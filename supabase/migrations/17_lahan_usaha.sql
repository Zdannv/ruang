-- ============================================================
--  17. Lahan usaha pinggir jalan
--
--  Fokus produk dipersempit (7 September 2026): dari "sewa ruang penyimpanan
--  apa pun" menjadi **lahan usaha di pinggir jalan** — halaman depan rumah
--  yang menganggur, disewakan bulanan ke UMKM yang butuh tempat berjualan.
--
--  Yang menghalangi bukan copy melainkan skema: kedelapan tipe yang ada
--  seluruhnya ruang TERTUTUP (kamar, garasi, gudang, mezanin, bawah tangga,
--  loteng, kontainer, lantai ruko). Tidak ada satu pun yang bisa dipakai
--  mendaftarkan halaman depan rumah, jadi produk barunya secara harfiah tidak
--  bisa dimasukkan ke database.
--
--  Tipe lama TETAP ADA dan tidak diapa-apakan. Penyimpanan bukan salah, ia
--  cuma bukan lagi yang di depan — dan menghapusnya akan mematikan ruang yang
--  sudah didaftarkan orang.
-- ============================================================

-- ---------- 1. tipe lahan terbuka ----------

alter table ruang drop constraint if exists ruang_tipe_check;
alter table ruang add constraint ruang_tipe_check check (tipe in (
  -- Lahan terbuka: yang disewa adalah PERMUKAAN dan muka jalannya.
  'halaman_depan','lahan_kosong','teras','kios',
  -- Ruang tertutup: yang disewa adalah VOLUME-nya.
  'kamar','garasi','gudang','lantai_ruko','mezanin',
  'bawah_tangga','loteng','kontainer'
));

comment on column ruang.tipe is
  'Dua kelompok. Lahan terbuka (halaman_depan, lahan_kosong, teras, kios) '
  'diukur dengan luas m2 — tingginya tidak berarti. Ruang tertutup diukur '
  'dengan volume m3. Layar wajib menampilkan ukuran yang sesuai '
  'kelompoknya; "18 m3" untuk sebuah halaman adalah angka yang benar '
  'secara aritmatika dan tidak berarti apa-apa bagi yang membacanya.';

-- ---------- 2. pencarian ikut mengembalikan luas ----------

/*
  `ruang_terdekat()` hanya mengembalikan `volume_m3`, jadi kartu hasil tidak
  punya cara menampilkan luas untuk lahan terbuka. Ditambahkan `luas_m2` —
  kolom terhitung yang sudah ada sejak `01_schema.sql`, cuma belum pernah
  ikut keluar.

  Di-drop dulu: Postgres menolak `create or replace` kalau tipe kembaliannya
  berubah.
*/
drop function if exists ruang_terdekat(double precision, double precision, double precision, numeric, bigint);

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
  luas_m2 numeric, volume_m3 numeric, harga_bulanan bigint,
  akses_masuk text, riwayat_banjir text, penguncian text,
  kategori_diterima text[],
  jarak_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.judul, r.tipe, r.kecamatan, r.kota,
         r.lat_publik, r.lng_publik,
         r.luas_m2, r.volume_m3, r.harga_bulanan,
         r.akses_masuk, r.riwayat_banjir, r.penguncian,
         r.kategori_diterima,
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

revoke all on function ruang_terdekat(double precision, double precision, double precision, numeric, bigint) from public;
grant execute on function ruang_terdekat(double precision, double precision, double precision, numeric, bigint) to anon, authenticated;

select periksa_permukaan_publik();

-- ============================================================
--  Yang BELUM dikerjakan migrasi ini, dan kenapa dipisah
--
--  1. Rubrik khusus lahan usaha — lebar muka jalan, listrik, air, atap,
--     kelas jalan, jam boleh berjualan. Ini yang benar-benar menentukan bagi
--     pedagang, dan tidak satu pun ada sekarang. Butuh kolom baru plus
--     formulirnya, dan itu pekerjaan sendiri.
--  2. `kuota_akses_bulanan` masih wajib. Untuk penyimpanan ia benar — orang
--     datang beberapa kali sebulan. Untuk pedagang ia salah: ia di sana
--     SETIAP HARI. Kolomnya perlu boleh kosong, dan `minta_akses` perlu
--     melewatkan pemeriksaannya untuk tipe lahan terbuka.
--  3. Manifes dan serah terima. Pedagang tidak menitipkan barang; ia membawa
--     gerobaknya pulang. Keduanya harus jadi opsional per tipe, bukan wajib.
--  4. `kategori_diterima` masih kategori BARANG. Untuk lahan usaha yang
--     relevan adalah JENIS USAHA yang diizinkan pemilik — dan "boleh
--     menggoreng" adalah pertanyaan yang jawabannya menentukan sewa.
--
--  Keempatnya diketahui, bukan terlupa. Menambahkannya sekaligus di sini
--  berarti satu migrasi yang tidak bisa diuji sepotong-sepotong.
-- ============================================================
