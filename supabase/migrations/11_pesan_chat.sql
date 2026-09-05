-- ============================================================
--  Ruang — percakapan penyewa & host
--
--  Jalankan setelah 10_push.sql. Aman dijalankan ulang.
--
--  KENAPA SEBELUM PEMESANAN, BUKAN SESUDAH
--
--  Rubrik kondisi menjawab banyak hal, tapi tidak menjawab
--  "muat motor saya nggak", "boleh lihat dulu", atau "bisa mulai
--  tanggal 20". Memaksa orang mengisi tanggal dan manifes lengkap
--  hanya untuk bertanya adalah beban yang terlalu berat — dan
--  hasilnya bukan mereka memesan, melainkan mereka pergi.
--
--  KENAPA KONTAK DISAMARKAN DI SINI, BUKAN DI LAYAR
--
--  Penyamaran di frontend bisa dilewati siapa pun yang memanggil
--  API langsung. Kalau aturannya "bukan papan iklan" (keputusan
--  produk nomor 2), tempatnya di database.
--
--  Yang perlu jujur diakui: ini menahan di pinggiran saja.
--  Kebocoran ke luar aplikasi tidak bisa dicegah secara teknis.
--  Yang benar-benar menahan orang di dalam adalah uang yang
--  dijaga platform dan penengah saat bersengketa — dan pembayaran
--  belum ada. Jadi jangan menambah rekayasa anti-kebocoran yang
--  lebih berat dari ini sebelum pembayarannya jalan.
-- ============================================================

-- ---------- 1. tabel ----------

create table if not exists percakapan (
  id                 uuid primary key default gen_random_uuid(),
  ruang_id           uuid not null references ruang(id) on delete cascade,
  penyewa_id         uuid not null references profil(id) on delete cascade,
  -- Keterbukaan alamat tingkat 2: diisi saat host membukanya untuk penyewa ini.
  alamat_dibuka_pada timestamptz,
  penyewa_baca_pada  timestamptz,
  host_baca_pada     timestamptz,
  pesan_terakhir_pada timestamptz not null default now(),
  dibuat_pada        timestamptz not null default now(),
  -- Satu utas per pasangan ruang dan penyewa. Bukan per pemesanan: pertanyaan
  -- datang sebelum pemesanan ada, dan riwayatnya tidak boleh terputus begitu
  -- pemesanannya jadi.
  constraint percakapan_satu_utas unique (ruang_id, penyewa_id)
);

create index if not exists percakapan_ruang_idx on percakapan (ruang_id);
create index if not exists percakapan_penyewa_idx on percakapan (penyewa_id, pesan_terakhir_pada desc);

create table if not exists pesan (
  id            uuid primary key default gen_random_uuid(),
  percakapan_id uuid not null references percakapan(id) on delete cascade,
  pengirim_id   uuid not null references profil(id),
  isi           text not null check (length(btrim(isi)) between 1 and 2000),
  -- true kalau ada bagian yang disamarkan; dipakai layar untuk menjelaskan
  -- kenapa ada titik-titik, alih-alih membuat orang mengira pesannya rusak.
  disamarkan    boolean not null default false,
  pada          timestamptz not null default now()
);

create index if not exists pesan_utas_idx on pesan (percakapan_id, pada);

alter table percakapan enable row level security;
alter table pesan enable row level security;

-- Tabel baru: cabut hak bawaan dari anon lebih dulu.
revoke all on percakapan from anon, authenticated;
revoke all on pesan from anon, authenticated;

-- Menulis hanya lewat fungsi. `percakapan` boleh di-UPDATE pemiliknya untuk
-- menandai sudah dibaca; `pesan` tidak pernah bisa diubah atau dihapus klien —
-- ia bukti percakapan.
grant select, update on percakapan to authenticated;
grant select on pesan to authenticated;

-- ---------- 2. helper ----------

create or replace function saya_pihak_percakapan(p_percakapan uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from percakapan c
    join ruang r on r.id = c.ruang_id
    where c.id = p_percakapan
      and (c.penyewa_id = profil_saya() or r.host_id = profil_saya())
  );
$$;

/**
 * Keterbukaan alamat tingkat 2.
 *
 * Selama ini tingkat 2 tidak bisa ditegakkan karena tidak ada tabel permintaan
 * survei — `akses_log` menempel ke pemesanan yang sudah jadi, sedangkan survei
 * terjadi sebelum pemesanan ada. Percakapan mengisi celah itu: host membuka
 * alamat untuk satu penyewa tertentu, dari utas yang sudah berjalan.
 */
create or replace function saya_diberi_alamat(p_ruang uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from percakapan c
    where c.ruang_id = p_ruang
      and c.penyewa_id = profil_saya()
      and c.alamat_dibuka_pada is not null
  );
$$;

drop policy if exists percakapan_pihak on percakapan;
create policy percakapan_pihak on percakapan
  for all to authenticated
  using (saya_pihak_percakapan(id))
  with check (saya_pihak_percakapan(id));

drop policy if exists pesan_pihak on pesan;
create policy pesan_pihak on pesan
  for select to authenticated
  using (saya_pihak_percakapan(percakapan_id));

-- `ruang` dapat satu jalan baca baru: penyewa yang alamatnya sudah dibuka.
drop policy if exists ruang_baca_alamat_dibuka on ruang;
create policy ruang_baca_alamat_dibuka on ruang
  for select to authenticated
  using (saya_diberi_alamat(id));

-- ---------- 3. penyamaran kontak ----------

/**
 * Mengganti nomor telepon dan email dengan titik-titik.
 *
 * Polanya sengaja menuntut awalan yang khas nomor Indonesia (`08`, `+62`, `62`)
 * alih-alih "deretan angka panjang". Tanpa syarat itu, ukuran ruang dan harga
 * yang ditulis panjang ikut tersamarkan — dan pesan yang rusak lebih merugikan
 * daripada satu nomor yang lolos.
 */
create or replace function _samarkan_kontak(p_isi text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(
    regexp_replace(
      p_isi,
      -- Email.
      '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
      '[kontak disamarkan]',
      'g'
    ),
    -- Nomor HP Indonesia, termasuk yang ditulis dengan spasi, titik, atau
    -- tanda hubung di antaranya.
    -- Pemisah hanya boleh DI ANTARA angka, tidak setelah angka terakhir.
    -- Versi pertama mengizinkan pemisah di ujung, sehingga spasi sesudah nomor
    -- ikut termakan dan kalimatnya jadi "di [kontak disamarkan]ya".
    '(\+?62|0)[ .-]?8[0-9]([ .-]?[0-9]){6,11}',
    '[kontak disamarkan]',
    'g'
  );
$$;

-- ---------- 4. memulai dan mengirim ----------

create or replace function mulai_percakapan(p_ruang uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_saya  uuid := profil_saya();
  v_ruang ruang;
  v_id    uuid;
begin
  if v_saya is null then
    raise exception 'Masuk dulu untuk bertanya ke host.'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_ruang from ruang where id = p_ruang and status = 'tayang';
  if not found then
    raise exception 'Ruangnya tidak ada atau sedang tidak disewakan.'
      using errcode = 'no_data_found';
  end if;

  if v_ruang.host_id = v_saya then
    raise exception 'Ini ruangmu sendiri.' using errcode = 'check_violation';
  end if;

  insert into percakapan (ruang_id, penyewa_id)
  values (p_ruang, v_saya)
  on conflict (ruang_id, penyewa_id) do update set ruang_id = excluded.ruang_id
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function kirim_pesan(p_percakapan uuid, p_isi text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_saya     uuid := profil_saya();
  v_c        percakapan;
  v_host     uuid;
  v_judul    text;
  v_bersih   text;
  v_disamar  boolean;
  v_penerima uuid;
  v_id       uuid;
begin
  if not saya_pihak_percakapan(p_percakapan) then
    raise exception 'Ini bukan percakapanmu.' using errcode = 'insufficient_privilege';
  end if;

  if coalesce(btrim(p_isi), '') = '' then
    raise exception 'Pesannya kosong.' using errcode = 'check_violation';
  end if;
  if length(btrim(p_isi)) > 2000 then
    raise exception 'Pesannya terlalu panjang (maksimal 2000 karakter).'
      using errcode = 'check_violation';
  end if;

  select * into v_c from percakapan where id = p_percakapan;
  select r.host_id, r.judul into v_host, v_judul from ruang r where r.id = v_c.ruang_id;

  v_bersih := _samarkan_kontak(btrim(p_isi));
  v_disamar := v_bersih is distinct from btrim(p_isi);

  insert into pesan (percakapan_id, pengirim_id, isi, disamarkan)
  values (p_percakapan, v_saya, v_bersih, v_disamar)
  returning id into v_id;

  update percakapan
     set pesan_terakhir_pada = now(),
         -- Pengirim otomatis dianggap sudah membaca utasnya sendiri.
         penyewa_baca_pada = case when v_saya = v_c.penyewa_id then now() else penyewa_baca_pada end,
         host_baca_pada    = case when v_saya = v_host          then now() else host_baca_pada end
   where id = p_percakapan;

  v_penerima := case when v_saya = v_c.penyewa_id then v_host else v_c.penyewa_id end;

  perform _kirim_notifikasi(
    v_penerima, 'pesan',
    'Pesan baru tentang ' || v_judul,
    left(v_bersih, 140),
    '/pesan/' || p_percakapan,
    null
  );

  return v_id;
end;
$$;

/**
 * Host membuka alamat untuk satu penyewa.
 *
 * Tidak bisa dibatalkan, dan itu disengaja: alamat yang sudah dilihat orang
 * tidak bisa ditarik kembali. Tombol "tutup lagi" hanya akan memberi rasa aman
 * palsu.
 */
create or replace function buka_alamat(p_percakapan uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_c    percakapan;
  v_judul text;
begin
  select * into v_c from percakapan where id = p_percakapan;
  if not found then
    raise exception 'Percakapannya tidak ada.' using errcode = 'no_data_found';
  end if;

  if not saya_host_ruang(v_c.ruang_id) then
    raise exception 'Hanya host ruangnya yang bisa membuka alamat.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_c.alamat_dibuka_pada is not null then
    return;
  end if;

  update percakapan set alamat_dibuka_pada = now() where id = p_percakapan;

  select judul into v_judul from ruang where id = v_c.ruang_id;
  perform _kirim_notifikasi(
    v_c.penyewa_id, 'pesan',
    'Host membuka alamat ' || v_judul,
    'Alamat lengkap dan patokannya sekarang terlihat di halaman ruang.',
    '/ruang/' || v_c.ruang_id, null
  );
end;
$$;

-- ---------- 5. notifikasi jenis baru ----------

alter table notifikasi drop constraint if exists notifikasi_jenis_check;
alter table notifikasi add constraint notifikasi_jenis_check
  check (jenis in ('pemesanan', 'akses', 'pesan'));

-- ---------- 6. daftar untuk layar ----------

-- `security_invoker` WAJIB: view ini memuat percakapan orang.
create or replace view percakapan_saya with (security_invoker = true) as
select
  c.id, c.ruang_id, c.penyewa_id, c.alamat_dibuka_pada,
  c.pesan_terakhir_pada, c.dibuat_pada,
  rp.judul, rp.kecamatan, rp.kota, rp.host_id, rp.host_nama,
  (
    select p.isi from pesan p
    where p.percakapan_id = c.id
    order by p.pada desc limit 1
  ) as pesan_terakhir,
  (
    select f.url from ruang_foto_publik f
    where f.ruang_id = c.ruang_id order by f.urutan limit 1
  ) as foto,
  (
    select count(*)::int from pesan p
    where p.percakapan_id = c.id
      and p.pengirim_id <> (select profil_saya())
      and p.pada > coalesce(
        case when c.penyewa_id = (select profil_saya())
             then c.penyewa_baca_pada else c.host_baca_pada end,
        '-infinity'::timestamptz
      )
  ) as belum_dibaca
from percakapan c
join ruang_publik rp on rp.id = c.ruang_id;

revoke all on percakapan_saya from anon;
grant select on percakapan_saya to authenticated;

-- ---------- 7. hak jalankan ----------

do $$
declare f text;
begin
  foreach f in array array[
    'mulai_percakapan(uuid)',
    'kirim_pesan(uuid, text)',
    'buka_alamat(uuid)'
  ]
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

revoke all on function _samarkan_kontak(text) from public, anon, authenticated;

select periksa_permukaan_publik();
