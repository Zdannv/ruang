-- ============================================================
--  14. Foto versi kecil
--
--  Sebelum ini setiap tempat yang menampilkan foto mengambil berkas yang sama:
--  1600px, sekitar 300-400 KB. Halaman `/cari` menampilkan belasan kartu
--  sekaligus, jadi satu kali pencarian menarik beberapa megabita — untuk gambar
--  yang di layar lebarnya cuma 360px.
--
--  Yang habis duluan di paket gratis bukan penyimpanan melainkan bandwidth,
--  dan inilah sumbernya. Versi kecilnya dibuat di peramban saat unggah, sekali,
--  memakai canvas yang memang sudah dipakai membuang EXIF — bukan oleh layanan
--  pengubah ukuran yang ditagih per gambar.
--
--  `url_kecil` boleh NULL, dan itu bukan kelalaian: seluruh foto yang sudah
--  telanjur diunggah — termasuk isi seed yang menunjuk picsum.photos — tidak
--  punya versi kecil, dan aplikasinya jatuh ke `url` biasa untuk baris itu.
-- ============================================================

alter table ruang_foto add column if not exists url_kecil text;

comment on column ruang_foto.url_kecil is
  'URL versi 800px. NULL untuk foto yang diunggah sebelum migrasi 14; '
  'pembacanya wajib jatuh ke url biasa, bukan menampilkan bingkai kosong.';

-- Kolomnya ditambahkan di URUTAN TERAKHIR. `create or replace view` menolak
-- perubahan nama atau urutan kolom yang sudah ada, tapi mengizinkan
-- penambahan di belakang — jadi view-nya tidak perlu di-drop, dan hak akses
-- yang menempel padanya tidak perlu diberikan ulang.
create or replace view ruang_foto_publik as
select f.id, f.ruang_id, f.url, f.urutan, f.keterangan, f.url_kecil
from ruang_foto f
join ruang r on r.id = f.ruang_id
where r.status = 'tayang';

select periksa_permukaan_publik();
