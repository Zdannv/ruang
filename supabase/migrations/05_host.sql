-- ============================================================
--  Ruang — sisi host + penyamaran pin + penyimpanan foto
--
--  Jalankan setelah 04_pesan.sql. Aman dijalankan ulang.
--
--  Tidak ada fungsi baru untuk mengelola ruang: policy
--  `ruang_host_kelola` dan `foto_host_kelola` di 03 sudah memberi
--  host hak penuh atas barisnya sendiri. Yang ditambahkan di sini
--  hal-hal yang TIDAK boleh dipercayakan ke klien.
-- ============================================================

-- ---------- 1. penyamaran pin ditegakkan database ----------

/*
  `lat_publik` / `lng_publik` tidak lagi boleh diisi klien.

  Aturan produknya: pin digeser sekitar 200 m, dan pergeserannya harus
  **deterministik per properti** — pergeseran acak yang berubah tiap kali
  dimuat justru membocorkan titik aslinya, karena rata-rata beberapa kali muat
  menuju ke titik yang sebenarnya.

  Kalau nilainya diisi dari formulir, host bisa mengirim lat_publik = lat dan
  seluruh aturannya batal tanpa ada yang tahu. Jadi trigger ini yang
  menghitungnya, selalu, dan menimpa apa pun yang dikirim.

  Arah dan besar pergeseran diturunkan dari hash id ruangnya: tetap selamanya
  untuk satu ruang, tapi tidak bisa ditebak arahnya dari ruang sebelahnya.
*/
create or replace function _set_pin_publik()
returns trigger
language plpgsql
as $$
declare
  v_hash   bigint;
  v_sudut  double precision;
  v_meter  double precision;
begin
  v_hash := abs(hashtextextended(new.id::text, 0));

  -- Sudut penuh 0..2π, jarak 120..200 m.
  v_sudut := (v_hash % 3600)::double precision / 3600 * 2 * pi();
  v_meter := 120 + ((v_hash / 3600) % 81)::double precision;

  -- 1 derajat lintang ≈ 111.320 m di mana pun; bujur menyusut mengikuti
  -- kosinus lintang, dan di Malang (−7,95°) selisihnya sudah ~1%.
  new.lat_publik := new.lat + (v_meter / 111320.0) * cos(v_sudut);
  new.lng_publik := new.lng
    + (v_meter / (111320.0 * cos(radians(new.lat)))) * sin(v_sudut);

  return new;
end;
$$;

-- Menyala di SETIAP insert dan update, bukan hanya saat `lat`/`lng` ikut
-- diubah.
--
-- Versi pertama memakai `update of lat, lng` — dan itu bisa dilewati dengan
-- satu perintah: `update ruang set lat_publik = lat` tidak menyentuh kolom
-- pemicunya, jadi trigger tidak berjalan dan pin publiknya jadi persis titik
-- aslinya. Sudah terbukti di pengujian. Menyala selalu berarti kedua kolom itu
-- tidak pernah bisa ditulis klien, apa pun bentuk perintahnya.
drop trigger if exists ruang_pin_publik on ruang;
create trigger ruang_pin_publik
  before insert or update on ruang
  for each row execute function _set_pin_publik();

-- Barisan yang sudah ada ikut dihitung ulang sekali, supaya tidak ada dua
-- aturan yang berlaku bersamaan: yang lama diisi tangan di 02_seed.sql.
update ruang set judul = judul;

-- ---------- 2. daftar ruang milik host ----------

-- `security_invoker = true` — WAJIB. View ini memuat baris `ruang` utuh milik
-- orang, termasuk kolom alamat. Tanpa security_invoker ia melewati RLS `ruang`
-- dan membocorkan seluruh alamat ke siapa pun yang boleh membacanya.
create or replace view ruang_saya with (security_invoker = true) as
select
  r.id, r.judul, r.tipe, r.status,
  r.alamat, r.patokan, r.kelurahan, r.kecamatan, r.kota,
  r.lat, r.lng, r.lat_publik, r.lng_publik,
  r.panjang_m, r.lebar_m, r.tinggi_m, r.luas_m2, r.volume_m3,
  r.akses_masuk, r.posisi_lantai, r.lebar_pintu_cm, r.jarak_parkir,
  r.kondisi_bangunan, r.penguncian, r.berbagi, r.kelembapan,
  r.riwayat_banjir, r.tinggi_lantai_cm,
  r.pengawasan, r.fasilitas, r.kategori_diterima,
  r.jendela_akses, r.kuota_akses_bulanan, r.durasi_min_hari,
  r.harga_bulanan, r.deposit, r.kepemilikan, r.terbuka_alamat,
  r.dibuat_pada,
  (select count(*) from ruang_foto f where f.ruang_id = r.id)::int as jumlah_foto,
  (
    select count(*) from pemesanan pm
    where pm.ruang_id = r.id and pm.status = 'menunggu_konfirmasi'
  )::int as permintaan_baru,
  (
    select count(*) from pemesanan pm
    where pm.ruang_id = r.id and pm.status = any (status_menahan_ruang())
  )::int as sedang_terpakai
from ruang r;

revoke all on ruang_saya from anon;
grant select on ruang_saya to authenticated;

-- ---------- 3. ringkasan permintaan untuk host ----------

/*
  "7 orang mencari ruang di kecamatan Anda".

  `permintaan_kecamatan` dari 03 sudah menyediakan hitungannya dan boleh dibaca
  siapa pun. Yang ditambahkan di sini: fungsi yang mengurutkannya berdasarkan
  kecamatan tempat host sudah punya ruang, supaya dasbornya tidak menampilkan
  permintaan di kota lain yang tidak bisa ia layani.
*/
create or replace function permintaan_di_wilayah_saya()
returns table (kota text, kecamatan text, jumlah int,
               harga_maks_rata bigint, volume_rata numeric)
language sql
stable
security definer
set search_path = public
as $$
  select pk.kota, pk.kecamatan, pk.jumlah, pk.harga_maks_rata, pk.volume_rata
  from permintaan_kecamatan pk
  where exists (
    select 1 from ruang r
    where r.host_id = profil_saya()
      and r.kota = pk.kota
      and r.kecamatan = pk.kecamatan
  )
  order by pk.jumlah desc;
$$;

revoke all on function permintaan_di_wilayah_saya() from public, anon;
grant execute on function permintaan_di_wilayah_saya() to authenticated;

-- ---------- 4. penyimpanan foto ----------

/*
  Satu bucket publik untuk foto ruang.

  Publik karena foto ruang tayang memang dilihat siapa pun, termasuk yang belum
  punya akun — dan URL bertanda tangan yang harus diperbarui tiap beberapa menit
  akan merusak cache gambar tanpa menambah kerahasiaan apa pun.

  Yang TIDAK boleh publik adalah foto serah terima nanti: itu bukti, isinya
  barang orang. Foto itu masuk bucket berbeda saat langkahnya dibangun.
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ruang-foto', 'ruang-foto', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Berkas disimpan di <profil_id>/<ruang_id>/<berkas>, dan policy di bawah
-- mengikat folder pertama ke pemiliknya. Tanpa itu, satu penyewa bisa menimpa
-- foto ruang orang lain — nama berkasnya bisa ditebak dari URL publiknya.
do $$
begin
  execute 'drop policy if exists ruang_foto_baca_publik on storage.objects';
  execute 'drop policy if exists ruang_foto_tulis_pemilik on storage.objects';
  execute 'drop policy if exists ruang_foto_hapus_pemilik on storage.objects';

  execute $p$
    create policy ruang_foto_baca_publik on storage.objects
      for select using (bucket_id = 'ruang-foto')
  $p$;

  execute $p$
    create policy ruang_foto_tulis_pemilik on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'ruang-foto'
        and (storage.foldername(name))[1] = profil_saya()::text
      )
  $p$;

  execute $p$
    create policy ruang_foto_hapus_pemilik on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'ruang-foto'
        and (storage.foldername(name))[1] = profil_saya()::text
      )
  $p$;
end $$;

-- ============================================================
--  Cara memeriksa
--
--  1. Pin tidak bisa dipalsukan, bahkan tanpa menyentuh lat/lng:
--       update ruang set lat_publik = lat, lng_publik = lng where id = '<id>';
--       select lat = lat_publik as bocor from ruang where id = '<id>';
--     `bocor` harus false — trigger menimpanya.
--
--  2. Pergeserannya tetap:
--       select lat_publik from ruang where id = '<id>';
--       update ruang set judul = judul where id = '<id>';
--       select lat_publik from ruang where id = '<id>';
--     Dua-duanya harus sama.
--
--  3. Jaraknya wajar (120-200 m):
--       select round(
--         6371000 * acos(least(1, greatest(-1,
--           cos(radians(lat)) * cos(radians(lat_publik)) *
--           cos(radians(lng_publik) - radians(lng)) +
--           sin(radians(lat)) * sin(radians(lat_publik))
--         )))
--       ) as meter from ruang;
-- ============================================================
