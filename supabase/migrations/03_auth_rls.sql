-- ============================================================
--  Ruang — auth + RLS sungguhan
--
--  Menggantikan policy demo di 01_schema.sql (semua boleh baca,
--  semua boleh tulis). Jalankan SETELAH 01 dan 02.
--
--  Aman dijalankan ulang.
--
--  Bentuk yang dipakai: seluruh akses publik lewat VIEW, bukan
--  lewat policy di tabel. Alasannya dua.
--
--  1. Aturan keterbukaan alamat tiga tingkat tidak bisa ditegakkan
--     dengan policy baris saja — yang perlu disembunyikan adalah
--     KOLOM (alamat, patokan, lat, lng), dan RLS tidak menyaring
--     kolom. View yang tidak memuat kolom itu menegakkannya.
--  2. Policy yang menyebut tabel lain ikut terkena RLS tabel itu.
--     Policy "foto boleh dibaca kalau ruangnya tayang" akan selalu
--     kosong untuk anon, karena anon tidak boleh membaca `ruang`.
--     Lewat view, join-nya dievaluasi sebagai pemilik view.
--
--  View di sini SENGAJA bukan security_invoker: ia berjalan sebagai
--  pemiliknya supaya bisa melewati RLS tabel dasarnya. Karena itu
--  setiap view WAJIB menyaring sendiri (`status = 'tayang'`) dan
--  WAJIB tidak memuat kolom rahasia. Linter Supabase akan menandai
--  ini sebagai "security definer view" — itu memang yang diinginkan,
--  bukan kelalaian.
-- ============================================================

-- ---------- 1. profil terikat auth.users ----------

alter table profil add column if not exists user_id uuid unique
  references auth.users(id) on delete set null;

comment on column profil.user_id is
  'Akun Supabase Auth pemilik profil ini. NULL untuk profil isi seed yang '
  'belum diklaim siapa pun. ON DELETE SET NULL, bukan CASCADE: menghapus akun '
  'tidak boleh ikut menghapus pemesanan, manifes, dan serah terima yang jadi '
  'bukti bagi pihak lain.';

-- Telepon tidak lagi wajib. Pendaftaran lewat email tidak punya nomor, dan
-- menyimpan string kosong supaya lolos NOT NULL cuma memindahkan masalahnya
-- ke setiap tempat yang membacanya. Nomor diisi dan diverifikasi terpisah
-- begitu jalur WhatsApp ada.
alter table profil alter column telepon drop not null;

create index if not exists profil_user_idx on profil (user_id);

-- ---------- 2. helper ----------

-- Id profil milik pemanggil. SECURITY DEFINER supaya pemanggilannya di dalam
-- policy tidak memicu RLS `profil` (yang akan berujung rekursi policy).
create or replace function profil_saya()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profil where user_id = auth.uid();
$$;

comment on function profil_saya() is
  'Id baris profil milik auth.uid(), atau NULL kalau belum ada. Dipakai di '
  'seluruh policy; jangan tulis "join profil" langsung di policy.';

-- Empat helper di bawah ini ada untuk satu alasan: memutus rekursi policy.
--
-- Policy `ruang` perlu tahu "apakah aku penyewa yang sudah membayar ruang ini",
-- yang berarti membaca `pemesanan`. Policy `pemesanan` perlu tahu "apakah aku
-- host ruangnya", yang berarti membaca `ruang`. Kalau keduanya ditulis sebagai
-- `exists (select ...)` biasa, Postgres menolak dengan
-- "infinite recursion detected in policy" — dan tidak ada satu pun kueri yang
-- jalan. Sudah terbukti di pengujian, bukan kekhawatiran teoretis.
--
-- SECURITY DEFINER membuat isi fungsi berjalan sebagai pemiliknya, jadi RLS
-- tabel yang dibacanya tidak dievaluasi ulang dan siklusnya terputus. Yang
-- dikembalikan cuma boolean tentang hubungan PEMANGGIL SENDIRI, jadi tidak ada
-- data orang lain yang bisa bocor lewat sini.

create or replace function saya_host_ruang(p_ruang uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from ruang r
    where r.id = p_ruang and r.host_id = profil_saya()
  );
$$;

-- Keterbukaan tingkat 3: alamat lengkap terbuka setelah dibayar.
-- `menunggu_pembayaran` sengaja TIDAK termasuk.
create or replace function saya_penyewa_terbayar(p_ruang uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from pemesanan pm
    where pm.ruang_id = p_ruang
      and pm.penyewa_id = profil_saya()
      and pm.status in ('menunggu_serah_terima','aktif',
                        'menunggu_serah_terima_keluar','selesai')
  );
$$;

create or replace function saya_pihak_pemesanan(p_pemesanan uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from pemesanan pm
    join ruang r on r.id = pm.ruang_id
    where pm.id = p_pemesanan
      and (pm.penyewa_id = profil_saya() or r.host_id = profil_saya())
  );
$$;

-- Ulasan hanya boleh ditulis atas sewa yang sudah selesai, dan hanya dari sisi
-- yang benar: penyewa menilai host, host menilai penyewa.
create or replace function boleh_ulas(p_pemesanan uuid, p_arah text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from pemesanan pm
    join ruang r on r.id = pm.ruang_id
    where pm.id = p_pemesanan
      and pm.status = 'selesai'
      and (
        (p_arah = 'untuk_host'    and pm.penyewa_id = profil_saya())
        or (p_arah = 'untuk_penyewa' and r.host_id = profil_saya())
      )
  );
$$;

-- Baris profil dibuat otomatis saat orang mendaftar, jadi tidak ada layar yang
-- perlu menangani kasus "akun ada tapi profilnya belum".
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profil (user_id, nama, telepon, kota)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nama'), ''), split_part(new.email, '@', 1)),
    nullif(btrim(new.raw_user_meta_data ->> 'telepon'), ''),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'kota'), ''), 'Malang')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- 3. buang policy demo ----------

do $$
declare
  t text;
begin
  foreach t in array array['profil','ruang','ruang_foto','pemesanan',
                           'pemesanan_transisi','manifes_item','serah_terima',
                           'akses_log','ulasan','permintaan_ruang']
  loop
    execute format('drop policy if exists demo_baca on %I', t);
    execute format('drop policy if exists demo_tulis on %I', t);
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ---------- 4. permukaan baca publik ----------

-- Ruang tayang, kolom publik saja. Tidak ada alamat, patokan, lat, lng.
create or replace view ruang_publik as
select
  r.id, r.judul, r.tipe,
  r.kelurahan, r.kecamatan, r.kota,
  r.lat_publik, r.lng_publik,
  r.panjang_m, r.lebar_m, r.tinggi_m, r.luas_m2, r.volume_m3,
  r.akses_masuk, r.posisi_lantai, r.lebar_pintu_cm, r.jarak_parkir,
  r.kondisi_bangunan, r.penguncian, r.berbagi, r.kelembapan,
  r.riwayat_banjir, r.tinggi_lantai_cm,
  r.pengawasan, r.fasilitas, r.kategori_diterima,
  r.jendela_akses, r.kuota_akses_bulanan, r.durasi_min_hari,
  r.harga_bulanan, r.deposit,
  r.kepemilikan, r.terbuka_alamat, r.status, r.dibuat_pada,
  r.host_id,
  p.nama          as host_nama,
  p.foto_url      as host_foto_url,
  p.terverifikasi as host_terverifikasi,
  p.bergabung     as host_bergabung,
  p.kota          as host_kota
from ruang r
join profil p on p.id = r.host_id
where r.status = 'tayang';

create or replace view ruang_foto_publik as
select f.id, f.ruang_id, f.url, f.urutan, f.keterangan
from ruang_foto f
join ruang r on r.id = f.ruang_id
where r.status = 'tayang';

-- Ulasan tanpa menyebut pemesanan mana. Kalau `pemesanan_id` ikut terbuka,
-- ulasan bisa dikorelasikan ke satu sewa tertentu beserta tanggalnya.
create or replace view ulasan_publik as
select
  u.id, u.arah, u.skor, u.akurasi, u.komentar, u.pada,
  pm.ruang_id,
  pr.nama     as penulis_nama,
  pr.foto_url as penulis_foto_url
from ulasan u
join pemesanan pm on pm.id = u.pemesanan_id
join ruang r on r.id = pm.ruang_id
join profil pr on pr.id = u.penulis_id
where r.status = 'tayang';

-- Ketersediaan: hanya tanggalnya, tidak menyebut siapa yang menyewa.
create or replace view ruang_ketersediaan as
select
  r.id as ruang_id,
  max(pm.selesai) filter (
    where pm.status in ('menunggu_pembayaran','menunggu_serah_terima',
                        'aktif','menunggu_serah_terima_keluar')
  ) as tersewa_sampai
from ruang r
left join pemesanan pm on pm.ruang_id = r.id
where r.status = 'tayang'
group by r.id;

-- Tidak ada `profil_publik`, dan itu disengaja.
--
-- Sempat ada, lalu dibuang: ia membuka nama, kota, dan tanggal bergabung
-- SELURUH pengguna — termasuk penyewa yang tidak pernah memajang apa pun —
-- sehingga seluruh daftar pengguna platform bisa diambil dengan satu kueri.
-- Yang benar-benar perlu tampil ke publik cuma dua: nama host (sudah ikut di
-- `ruang_publik`) dan nama penulis ulasan (sudah ikut di `ulasan_publik`).
-- Kalau nanti perlu halaman profil host, buat view yang dibatasi ke host yang
-- punya ruang tayang — bukan ke semua orang.
drop view if exists profil_publik;

-- "7 orang mencari ruang di kecamatan Anda" — hitungan saja, tanpa identitas.
--
-- Rata-rata anggaran dan ukuran hanya keluar kalau satu kecamatan punya
-- minimal tiga permintaan. Di bawah itu, "rata-rata" adalah angka satu orang:
-- host bisa membaca anggaran persis seseorang yang tidak pernah bermaksud
-- menunjukkannya. Hitungan jumlahnya sendiri tetap tampil apa adanya, karena
-- itulah gunanya view ini.
create or replace view permintaan_kecamatan as
select
  kota, kecamatan,
  count(*)::int as jumlah,
  case when count(*) >= 3 then round(avg(harga_maks))::bigint end as harga_maks_rata,
  case when count(*) >= 3 then round(avg(volume_m3), 1) end       as volume_rata
from permintaan_ruang
group by kota, kecamatan;

-- Jarak dihitung dari koordinat ASLI, dan anon tidak boleh membaca kolom itu.
-- Karena itu fungsinya jadi SECURITY DEFINER: ia berjalan sebagai pemiliknya,
-- membaca lat/lng, tapi hanya mengembalikan kolom publik + jarak.
create or replace function ruang_terdekat(
  p_lat        double precision,
  p_lng        double precision,
  p_radius_km  double precision default 10,
  p_volume_min numeric default 0,
  p_harga_maks bigint default 999999999
)
returns table (
  id uuid, judul text, tipe text, kecamatan text, kota text,
  lat_publik double precision, lng_publik double precision,
  volume_m3 numeric, harga_bulanan bigint,
  akses_masuk text, riwayat_banjir text, penguncian text,
  jarak_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.judul, r.tipe, r.kecamatan, r.kota,
         r.lat_publik, r.lng_publik,
         r.volume_m3, r.harga_bulanan,
         r.akses_masuk, r.riwayat_banjir, r.penguncian,
         round((
           6371 * acos(
             least(1, greatest(-1,
               cos(radians(p_lat)) * cos(radians(r.lat)) *
               cos(radians(r.lng) - radians(p_lng)) +
               sin(radians(p_lat)) * sin(radians(r.lat))
             ))
           )
         )::numeric, 2)::double precision as jarak_km
  from ruang r
  where r.status = 'tayang'
    and r.volume_m3 >= p_volume_min
    and r.harga_bulanan <= p_harga_maks
    and 6371 * acos(
          least(1, greatest(-1,
            cos(radians(p_lat)) * cos(radians(r.lat)) *
            cos(radians(r.lng) - radians(p_lng)) +
            sin(radians(p_lat)) * sin(radians(r.lat))
          ))
        ) <= p_radius_km
  order by jarak_km asc;
$$;

-- ---------- 5. hak akses tabel ----------

-- Mulai dari nol supaya yang diberikan bisa dibaca satu per satu, bukan
-- bergantung pada default privileges Supabase yang memberi `all` ke anon.
revoke all on all tables in schema public from anon, authenticated;

-- anon: tidak menyentuh satu pun tabel dasar. Hanya view dan fungsi.
grant select on ruang_publik, ruang_foto_publik, ulasan_publik,
                ruang_ketersediaan, permintaan_kecamatan
  to anon, authenticated;

grant select, update            on profil             to authenticated;
grant select, insert, update, delete on ruang         to authenticated;
grant select, insert, update, delete on ruang_foto    to authenticated;
grant select                    on pemesanan          to authenticated;
grant select, insert            on pemesanan_transisi to authenticated;
grant select, insert            on manifes_item       to authenticated;
grant select, insert, update    on serah_terima       to authenticated;
grant select, insert, update    on akses_log          to authenticated;
grant select, insert            on ulasan             to authenticated;
grant select, insert, delete    on permintaan_ruang   to authenticated;

-- Tabel bukti: tidak ada UPDATE dan DELETE untuk siapa pun dari klien.
-- Perubahan manifes membuat versi baru, tidak menimpa yang lama.
--
-- Dua pengecualian yang disengaja: `serah_terima` perlu UPDATE karena dua
-- tanda tangan ditulis ke baris yang sama, dan `akses_log` perlu UPDATE untuk
-- perpindahan diminta -> disetujui -> selesai. Keduanya utang bentuk data,
-- bukan kelonggaran keamanan — kalau nanti tanda tangan dipisah jadi baris
-- sendiri, UPDATE-nya bisa dicabut juga.

-- ---------- 6. policy ----------

-- profil
drop policy if exists profil_baca_sendiri on profil;
create policy profil_baca_sendiri on profil
  for select to authenticated using (user_id = auth.uid());

drop policy if exists profil_ubah_sendiri on profil;
create policy profil_ubah_sendiri on profil
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ruang: host penuh atas ruangnya sendiri.
drop policy if exists ruang_host_kelola on ruang;
create policy ruang_host_kelola on ruang
  for all to authenticated
  using (host_id = profil_saya())
  with check (host_id = profil_saya());

-- Penyewa yang sudah membayar boleh membaca baris ruang utuh — di situlah
-- alamat lengkapnya. Ini keterbukaan tingkat 3.
--
-- Tingkat 2 ("penyewa yang jadwal surveinya disetujui host") BELUM bisa
-- ditegakkan: belum ada tabel permintaan survei di skema. `akses_log`
-- menempel ke pemesanan yang sudah jadi, sedangkan survei terjadi sebelum
-- pemesanan ada. Tercatat sebagai utang; sampai tabel itu ada, alamat hanya
-- terbuka di tingkat 3.
drop policy if exists ruang_baca_penyewa_terbayar on ruang;
create policy ruang_baca_penyewa_terbayar on ruang
  for select to authenticated
  using (saya_penyewa_terbayar(id));

-- foto: dikelola host ruangnya.
drop policy if exists foto_host_kelola on ruang_foto;
create policy foto_host_kelola on ruang_foto
  for all to authenticated
  using (saya_host_ruang(ruang_id))
  with check (saya_host_ruang(ruang_id));

-- pemesanan: hanya dua pihaknya.
--
-- Tidak ada policy INSERT maupun UPDATE, dan itu disengaja. Status pemesanan
-- menentukan uang dan kepemilikan akses; kalau klien boleh menulisnya
-- langsung, siapa pun bisa menandai dirinya "sudah dibayar". Perpindahan
-- status ditambahkan di langkah "alur pesan" sebagai fungsi SECURITY DEFINER
-- yang memvalidasi transisinya, bukan sebagai policy.
drop policy if exists pemesanan_baca_pihak on pemesanan;
create policy pemesanan_baca_pihak on pemesanan
  for select to authenticated
  using (saya_pihak_pemesanan(id));

-- Tabel turunan pemesanan: ikut siapa yang boleh melihat pemesanannya.
do $$
declare
  t text;
begin
  foreach t in array array['pemesanan_transisi','manifes_item','serah_terima','akses_log']
  loop
    execute format('drop policy if exists %I on %I', t || '_pihak', t);
    execute format($f$
      create policy %I on %I
        for all to authenticated
        using (saya_pihak_pemesanan(pemesanan_id))
        with check (saya_pihak_pemesanan(pemesanan_id))
    $f$, t || '_pihak', t);
  end loop;
end $$;

-- Blok di atas memakai `saya_pihak_pemesanan()`, bukan `exists (select 1 from
-- pemesanan ...)`. Bentuk kedua sekilas lebih sederhana dan sempat dipakai,
-- tapi ia membaca `pemesanan` yang policy-nya membaca `ruang` yang policy-nya
-- membaca `pemesanan` — rekursi, dan seluruh kueri gagal.

-- ulasan: dibaca lewat ulasan_publik. Tabelnya hanya untuk pihak terkait
-- dan untuk menulis.
drop policy if exists ulasan_baca_pihak on ulasan;
create policy ulasan_baca_pihak on ulasan
  for select to authenticated
  using (penulis_id = profil_saya() or saya_pihak_pemesanan(pemesanan_id));

-- Hanya boleh menulis ulasan atas sewa yang sudah selesai, dan hanya dari
-- sisi yang benar: penyewa menilai host, host menilai penyewa.
drop policy if exists ulasan_tulis_setelah_selesai on ulasan;
create policy ulasan_tulis_setelah_selesai on ulasan
  for insert to authenticated
  with check (penulis_id = profil_saya() and boleh_ulas(pemesanan_id, arah));

-- permintaan ruang (waitlist): milik sendiri; hitungannya publik lewat view.
drop policy if exists permintaan_milik_sendiri on permintaan_ruang;
create policy permintaan_milik_sendiri on permintaan_ruang
  for all to authenticated
  using (penyewa_id = profil_saya())
  with check (penyewa_id = profil_saya());

-- ============================================================
--  Cara memeriksa hasilnya
--
--  1. Sebagai anon (pakai anon key), keempat ini harus 200 dan berisi:
--       select * from ruang_publik limit 1;
--       select * from ruang_foto_publik limit 1;
--       select * from ruang_ketersediaan limit 1;
--       select ruang_terdekat(-7.9526, 112.6142, 5);
--
--     `ruang_publik` sudah membawa nama host; tidak ada view profil publik.
--
--  2. Sebagai anon, keempat ini harus GAGAL (permission denied):
--       select * from ruang;          -- alamat, lat, lng
--       select * from profil;         -- telepon
--       select * from pemesanan;
--       select * from manifes_item;
--
--  3. Profil isi seed belum punya akun. Untuk masuk sebagai salah satu host,
--     daftar lewat aplikasi lalu PINDAHKAN akunnya ke profil seed.
--
--     Urutannya penting: mendaftar sudah membuat satu baris profil sendiri
--     lewat trigger, dan `profil.user_id` UNIQUE — jadi langsung meng-UPDATE
--     profil seed akan gagal "duplicate key". Buang profil baru itu dulu:
--
--       begin;
--         with akun as (
--           select id from auth.users where email = 'kamu@contoh.com'
--         )
--         delete from profil
--          where user_id = (select id from akun)
--            and nama <> 'Pak Slamet Riyadi';
--
--         update profil
--            set user_id = (select id from auth.users where email = 'kamu@contoh.com')
--          where nama = 'Pak Slamet Riyadi';
--       commit;
--
--     Jalankan di SQL editor (service role). Aman karena profil baru itu belum
--     punya ruang, pemesanan, atau ulasan apa pun.
-- ============================================================
