-- ============================================================
--  Hapus dua lahan percobaan dari database produksi.
--
--  BUKAN migrasi, dan sengaja tidak diberi nomor. Isinya dua id yang cuma
--  ada di satu database, jadi menjalankannya di database lain tidak
--  menghapus apa pun (dan itu aman). Berkas di `migrations/` harus bisa
--  dijalankan di database kosong mana pun; yang ini tidak.
--
--  Yang dihapus:
--    7d043283  "test", kecamatan "test", kota Malang
--    deef8d3d  "test", Tanah Abang, Jakarta Pusat
--
--  Keduanya `usaha_diizinkan` kosong, yang menurut aturan aplikasi sendiri
--  berarti tidak ada satu pun pedagang yang bisa menemukannya lewat
--  penyaring jenis usaha. Jadi keduanya tidak cuma tidak berguna, mereka
--  memang tidak bisa dipakai.
--
--  CARA MENJALANKANNYA: DUA LANGKAH, BUKAN SATU.
--
--  SQL Editor Supabase menjalankan seluruh isi editor sekaligus dan cuma
--  menampilkan hasil pernyataan terakhir. Jadi `select` pemeriksa yang
--  ditaruh sebelum `delete` di berkas yang sama tidak pernah sempat dibaca
--  siapa pun, dan pemeriksaan yang tidak terbaca bukan pemeriksaan.
--
--  Tempel LANGKAH 1 dulu, lihat hasilnya, hapus isinya, baru tempel
--  LANGKAH 2.
-- ============================================================


-- ---------- LANGKAH 1: lihat dulu apa yang akan hilang ----------
--
-- Harus muncul TEPAT DUA baris, keduanya berjudul "test". Kalau yang
-- muncul bukan itu, berhenti di sini dan jangan jalankan langkah 2.

select id, judul, kecamatan, kota, status
from ruang
where id in (
  '7d043283-9db9-43df-8eec-84758604069c',
  'deef8d3d-63dc-48ec-b158-cad3eb8a7eec'
);


-- ---------- LANGKAH 2: hapus ----------
--
-- URUTANNYA BUKAN SELERA. `pemesanan.ruang_id` adalah satu-satunya rujukan
-- ke `ruang` yang TIDAK cascade (lihat 01_schema.sql baris 107), jadi
-- menghapus ruangnya lebih dulu akan ditolak Postgres kalau kebetulan ada
-- barisnya. Sisanya (foto, video, jendela akses, percakapan, statistik)
-- ikut terhapus sendiri.
--
-- Satu transaksi: kalau salah satu gagal, tidak ada yang terhapus separuh.

begin;

delete from pemesanan
where ruang_id in (
  '7d043283-9db9-43df-8eec-84758604069c',
  'deef8d3d-63dc-48ec-b158-cad3eb8a7eec'
);

delete from ruang
where id in (
  '7d043283-9db9-43df-8eec-84758604069c',
  'deef8d3d-63dc-48ec-b158-cad3eb8a7eec'
);

commit;

-- ============================================================
--  Yang TIDAK ikut terhapus: berkas fotonya di Storage.
--
--  Baris `ruang_foto` hilang lewat cascade, tapi objek di bucket
--  `ruang-foto` tidak punya foreign key ke mana pun. Hapus foldernya dari
--  Storage lewat dashboard, atau biarkan: ia tidak lagi tertaut dari layar
--  mana pun, dan besarnya beberapa ratus kilobyte.
-- ============================================================
