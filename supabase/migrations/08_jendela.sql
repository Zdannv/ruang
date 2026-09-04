-- ============================================================
--  Ruang — jendela akses jadi data terstruktur
--
--  Jalankan setelah 07_advisor.sql. Aman dijalankan ulang.
--
--  Menutup utang no. 1. Sebelum ini `ruang.jendela_akses` adalah
--  teks bebas ("Sen-Sab 08.00-17.00"), sehingga aturan produk
--  nomor satu — "kunjungan hanya di dalam jendela akses yang
--  ditetapkan host" — tidak bisa ditegakkan database sama sekali.
--  `minta_akses` cuma bisa memeriksa kuota dan tanggal.
--
--  Sekarang jendelanya baris data. Teks yang lama tetap ada, tapi
--  berubah peran: dari sumber kebenaran menjadi label tampilan
--  yang DIHASILKAN dari baris-baris itu, jadi keduanya tidak bisa
--  berbeda pendapat.
-- ============================================================

-- ---------- 1. tabel ----------

create table if not exists jendela_akses (
  id       uuid primary key default gen_random_uuid(),
  ruang_id uuid     not null references ruang(id) on delete cascade,
  -- Mengikuti `extract(dow)` Postgres: 0 = Minggu ... 6 = Sabtu.
  hari     smallint not null check (hari between 0 and 6),
  mulai    time     not null,
  selesai  time     not null,
  constraint jendela_urut check (selesai > mulai),
  constraint jendela_tanpa_duplikat unique (ruang_id, hari, mulai)
);

create index if not exists jendela_ruang_idx on jendela_akses (ruang_id, hari);

comment on table jendela_akses is
  'Jam saat penyewa boleh datang. Satu baris per hari per rentang; satu hari '
  'boleh punya dua rentang (mis. pagi dan sore). Rentang yang melewati tengah '
  'malam ditulis sebagai dua baris.';

alter table jendela_akses enable row level security;

-- Label di `ruang` tidak lagi diisi tangan, jadi butuh nilai bawaan untuk
-- ruang yang baru dibuat sebelum jendelanya ditentukan.
alter table ruang alter column jendela_akses set default 'Belum ditentukan';

-- ---------- 2. nama hari ----------

-- Urutan tampilan mulai Senin, bukan Minggu: itu cara orang di sini menyebut
-- minggu kerja. `extract(dow)` mulai dari Minggu, jadi keduanya perlu
-- dijembatani, dan jembatannya ditulis sekali di sini.
create or replace function _hari_ke_indeks(p_dow smallint)
returns int
language sql
immutable
set search_path = public
as $$ select (p_dow::int + 6) % 7; $$;

create or replace function _indeks_ke_hari(p_indeks int)
returns smallint
language sql
immutable
set search_path = public
as $$ select ((p_indeks + 1) % 7)::smallint; $$;

create or replace function nama_hari(p_dow smallint)
returns text
language sql
immutable
set search_path = public
as $$
  select (array['Min','Sen','Sel','Rab','Kam','Jum','Sab'])[p_dow + 1];
$$;

create or replace function _indeks_dari_nama(p_nama text)
returns int
language sql
immutable
set search_path = public
as $$
  select array_position(array['Sen','Sel','Rab','Kam','Jum','Sab','Min'],
                        initcap(btrim(p_nama))) - 1;
$$;

-- ---------- 3. label tampilan dihasilkan dari barisnya ----------

/*
  Menyusun "Sen-Sab 08.00-17.00" dari baris jendela.

  Hari dikelompokkan per rentang jam, lalu tiap kelompok diringkas: tujuh hari
  jadi "Setiap hari", deretan berurutan jadi "Sen-Sab", sisanya jadi daftar
  "Sen, Rab, Jum". Beberapa rentang jam dipisah titik koma.
*/
create or replace function _label_jendela(p_ruang uuid)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_grup   record;
  v_hasil  text[] := '{}';
  v_hari   text;
  v_idx    int[];
begin
  for v_grup in
    select mulai, selesai,
           array_agg(_hari_ke_indeks(hari) order by _hari_ke_indeks(hari)) as indeks
      from jendela_akses
     where ruang_id = p_ruang
     group by mulai, selesai
     order by min(_hari_ke_indeks(hari)), mulai
  loop
    v_idx := v_grup.indeks;

    if array_length(v_idx, 1) = 7 then
      v_hari := 'Setiap hari';
    elsif array_length(v_idx, 1) > 1
      and v_idx[array_length(v_idx, 1)] - v_idx[1] = array_length(v_idx, 1) - 1 then
      -- Deretan berurutan tanpa bolong.
      v_hari := nama_hari(_indeks_ke_hari(v_idx[1])) || '-'
             || nama_hari(_indeks_ke_hari(v_idx[array_length(v_idx, 1)]));
    else
      select string_agg(nama_hari(_indeks_ke_hari(i)), ', ' order by i)
        into v_hari
        from unnest(v_idx) as i;
    end if;

    v_hasil := v_hasil || (
      v_hari || ' ' ||
      to_char(v_grup.mulai, 'HH24.MI') || '-' || to_char(v_grup.selesai, 'HH24.MI')
    );
  end loop;

  if array_length(v_hasil, 1) is null then
    return 'Belum ditentukan';
  end if;
  return array_to_string(v_hasil, '; ');
end;
$$;

-- Label ikut berubah setiap kali barisnya berubah, jadi tidak bisa basi.
create or replace function _segarkan_label_jendela()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ruang uuid := coalesce(new.ruang_id, old.ruang_id);
begin
  update ruang set jendela_akses = _label_jendela(v_ruang) where id = v_ruang;
  return null;
end;
$$;

drop trigger if exists jendela_segarkan_label on jendela_akses;
create trigger jendela_segarkan_label
  after insert or update or delete on jendela_akses
  for each row execute function _segarkan_label_jendela();

-- ---------- 4. pindahkan teks lama jadi baris ----------

/*
  Isi seed memakai dua bentuk saja: "Setiap hari HH.MM-HH.MM" dan
  "Xxx-Yyy HH.MM-HH.MM". Keduanya diurai di sini, sekali.

  Yang tidak bisa diurai TIDAK menggagalkan migrasi — ia dilaporkan lewat
  NOTICE dan ruangnya dibiarkan tanpa jendela terstruktur. Menggagalkan seluruh
  migrasi karena satu host menulis kalimat yang tidak terduga akan menahan
  perbaikan untuk semua orang.
*/
do $$
declare
  r          record;
  v_cocok    text[];
  v_awal     int;
  v_akhir    int;
  v_mulai    time;
  v_selesai  time;
  i          int;
  v_gagal    text[] := '{}';
begin
  -- Hanya jalan sekali: kalau sudah ada barisnya, jangan diurai ulang.
  if exists (select 1 from jendela_akses) then
    raise notice 'jendela_akses sudah berisi, penguraian teks lama dilewati';
    return;
  end if;

  for r in select id, jendela_akses from ruang loop
    v_cocok := regexp_match(
      r.jendela_akses,
      '^\s*(Setiap hari|[A-Za-z]{3})(?:\s*-\s*([A-Za-z]{3}))?\s+(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})\s*$'
    );

    if v_cocok is null then
      v_gagal := v_gagal || format('%s (%s)', r.id, r.jendela_akses);
      continue;
    end if;

    v_mulai   := make_time(v_cocok[3]::int, v_cocok[4]::int, 0);
    v_selesai := make_time(v_cocok[5]::int, v_cocok[6]::int, 0);

    if v_cocok[1] ilike 'Setiap hari' then
      v_awal := 0; v_akhir := 6;
    else
      v_awal := _indeks_dari_nama(v_cocok[1]);
      v_akhir := coalesce(_indeks_dari_nama(v_cocok[2]), v_awal);
      if v_awal is null or v_akhir is null or v_akhir < v_awal then
        v_gagal := v_gagal || format('%s (%s)', r.id, r.jendela_akses);
        continue;
      end if;
    end if;

    for i in v_awal..v_akhir loop
      insert into jendela_akses (ruang_id, hari, mulai, selesai)
      values (r.id, _indeks_ke_hari(i), v_mulai, v_selesai)
      on conflict do nothing;
    end loop;
  end loop;

  if array_length(v_gagal, 1) > 0 then
    raise notice 'Jendela akses yang tidak bisa diurai (perlu diisi host): %',
      array_to_string(v_gagal, '; ');
  end if;
end $$;

-- ---------- 5. penegakan ----------

/*
  Apakah `p_untuk` jatuh di dalam salah satu jendela ruangnya.

  Ruang yang belum punya jendela terstruktur dianggap MEMBOLEHKAN, bukan
  menolak. Alasannya sama dengan kenapa penyewa yang menunggak tetap boleh
  mengambil barangnya: kalau host menghapus jendelanya di tengah masa sewa,
  penyewa tidak boleh sampai terkurung dari barangnya sendiri. Host diberi
  peringatan di dasbor, bukan penyewa yang dihukum.
*/
create or replace function jendela_memuat(p_ruang uuid, p_untuk timestamptz)
returns boolean
language sql
stable
set search_path = public
as $$
  select not exists (select 1 from jendela_akses where ruang_id = p_ruang)
      or exists (
        select 1 from jendela_akses j
        where j.ruang_id = p_ruang
          and j.hari = extract(dow from (p_untuk at time zone 'Asia/Jakarta'))::smallint
          and (p_untuk at time zone 'Asia/Jakarta')::time >= j.mulai
          and (p_untuk at time zone 'Asia/Jakarta')::time <= j.selesai
      );
$$;

-- `minta_akses` diganti utuh: satu pemeriksaan baru disisipkan setelah
-- pemeriksaan tanggal, sebelum kuota.
create or replace function minta_akses(
  p_pemesanan uuid,
  p_untuk     timestamptz,
  p_catatan   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saya        uuid := profil_saya();
  v_pm          pemesanan;
  v_menggantung int;
  v_sisa        int;
  v_label       text;
  v_id          uuid;
begin
  if v_saya is null then
    raise exception 'Masuk dulu.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_pm from pemesanan where id = p_pemesanan;
  if not found then
    raise exception 'Pemesanannya tidak ada.' using errcode = 'no_data_found';
  end if;

  if v_pm.penyewa_id <> v_saya then
    raise exception 'Hanya penyewa yang bisa meminta jadwal kunjungan.'
      using errcode = 'insufficient_privilege';
  end if;

  if not (v_pm.status = any (status_boleh_akses())) then
    raise exception 'Kunjungan baru bisa dijadwalkan setelah serah terima masuk.'
      using errcode = 'check_violation';
  end if;

  if p_untuk <= now() then
    raise exception 'Jadwalnya harus di waktu yang belum lewat.'
      using errcode = 'check_violation';
  end if;

  if p_untuk > now() + interval '90 days' then
    raise exception 'Jadwal paling jauh 90 hari dari sekarang.'
      using errcode = 'check_violation';
  end if;

  if p_untuk::date > v_pm.selesai then
    raise exception 'Jadwalnya melewati tanggal berakhirnya sewa (%).', v_pm.selesai
      using errcode = 'check_violation';
  end if;

  -- BARU: jendela akses akhirnya bisa ditegakkan, bukan cuma ditampilkan.
  if not jendela_memuat(v_pm.ruang_id, p_untuk) then
    select jendela_akses into v_label from ruang where id = v_pm.ruang_id;
    raise exception 'Di luar jendela akses ruang ini (%).', v_label
      using errcode = 'check_violation';
  end if;

  select count(*)::int into v_menggantung
    from akses_log where pemesanan_id = p_pemesanan and status = 'diminta';
  if v_menggantung >= _batas_permintaan_menggantung() then
    raise exception 'Masih ada % permintaan yang belum dijawab host. Tunggu jawabannya dulu.',
      v_menggantung using errcode = 'check_violation';
  end if;

  v_sisa := sisa_kuota_akses(p_pemesanan, p_untuk::date);
  if v_sisa <= 0 then
    raise exception 'Kuota kunjungan bulan itu sudah habis.'
      using errcode = 'check_violation';
  end if;

  insert into akses_log (pemesanan_id, diminta_untuk, status, catatan)
  values (p_pemesanan, p_untuk, 'diminta', nullif(btrim(p_catatan), ''))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function minta_akses(uuid, timestamptz, text) from public, anon;
grant execute on function minta_akses(uuid, timestamptz, text) to authenticated;

-- ---------- 6. hak akses ----------

/*
  Cabut dulu, beri kemudian — dan urutan ini bukan kerapian, tapi keharusan.

  Supabase memasang `alter default privileges in schema public grant all on
  tables to anon, authenticated`. Artinya setiap tabel BARU langsung bisa
  dibaca DAN ditulis anon begitu dibuat, tanpa satu pun perintah grant.
  `jendela_akses` di atas kena itu, dan tanpa baris ini migrasinya mengirim
  lubang: siapa pun tanpa akun bisa mengubah jam akses ruang orang.

  Ini ketemu karena `periksa_permukaan_publik()` menggagalkan migrasinya, bukan
  karena terpikir saat menulisnya. Itu gunanya penjaga itu ada.
*/
revoke all on jendela_akses from anon, authenticated;

-- Host mengelola jendela ruangnya sendiri.
drop policy if exists jendela_host_kelola on jendela_akses;
create policy jendela_host_kelola on jendela_akses
  for all to authenticated
  using (saya_host_ruang(ruang_id))
  with check (saya_host_ruang(ruang_id));

grant select, insert, update, delete on jendela_akses to authenticated;

-- Publik lewat view, bukan lewat tabel — supaya anon tetap tidak punya hak ke
-- satu pun tabel dasar (dijaga `periksa_permukaan_publik`).
create or replace view jendela_akses_publik as
select j.ruang_id, j.hari, j.mulai, j.selesai
from jendela_akses j
join ruang r on r.id = j.ruang_id
where r.status = 'tayang';

grant select on jendela_akses_publik to anon, authenticated;

select periksa_permukaan_publik();
