# Ruang

Marketplace ruang P2P. Siapa pun yang punya ruang kosong bisa menyewakannya;
siapa pun yang butuh tempat bisa menyewanya.

Nama produk sengaja **tidak** mengunci ke penitipan. Tahap pertama adalah sewa
ruang penyimpanan, tapi model data dan penamaan harus tetap netral supaya bisa
meluas nanti — sewa ruang untuk keperluan lain, atau jual-beli. Hindari kata
"titip" di nama tabel, rute, dan komponen.

Catatan penamaan: nama aplikasi `Ruang` dan tabel `ruang` sama. Di kode aplikasi
pakai istilah yang lebih spesifik untuk tipe dan rute — `Listing` / `/ruang/[id]`
— supaya tidak tertukar dengan nama produk.

**Tahap saat ini: pengembangan produk sungguhan.** Diputuskan 4 September 2026,
menggantikan tahap "prototipe untuk dipresentasikan ke calon partner". Fitur
dibangun untuk dipakai orang: auth sungguhan, RLS per pemilik, alur yang
benar-benar mengubah status. Kalau sesuatu belum bisa dibangun, biarkan kosong
dan catat di "Utang yang diketahui" — jangan dipalsukan supaya terlihat jalan.

---

## Keputusan produk yang sudah dikunci

Jangan tawarkan alternatif untuk empat ini kecuali diminta:

1. **Akses bebas terjadwal** — penyewa bisa datang berkali-kali, janjian lewat
   aplikasi dari jendela akses yang ditetapkan host.
2. **Pemesanan & pembayaran lewat platform** — bukan papan iklan.
3. **Harga per ruangan, ditentukan host** — bukan satuan boks seragam.
4. **Web app / PWA** — bukan native. Mobile-first.

Konsekuensi yang sudah diputuskan:

- **Tidak ada segel tamper-evident.** Bertentangan dengan akses bebas.
  Penggantinya: manifes berfoto + berita acara serah terima + log akses.
- **Tidak ada asuransi dan tidak ada jaminan ganti rugi dari platform.**
  Jangan pernah menulis "garansi keamanan" atau "barang dijamin aman" di UI.
  Kalimat yang benar: *platform memutuskan siapa yang benar, platform tidak
  membayar ganti rugi.*
- **Host berhak melihat dan menolak barang.** Manifes wajib, kategori
  dideklarasikan penyewa dan dicocokkan sistem dengan kebijakan host
  sebelum permintaan sampai ke host.

## Kebijakan pembatalan — dikunci 4 September 2026

| Keadaan | Boleh dibatalkan? | Uang | Status |
|---|---|---|---|
| Host belum menjawab | ya, bebas | belum ada yang berpindah | **berjalan** |
| Diterima, belum dibayar | ya, bebas | belum ada yang berpindah | **berjalan** |
| Sudah dibayar, belum serah terima | ya | sewa penuh + deposit penuh kembali | menunggu jalur pengembalian dana |
| Sewa berjalan / menunggak | **tidak** | — | menunggu serah terima |

Dua baris terakhir bukan lubang yang lupa ditutup. Yang sudah dibayar
dikembalikan penuh karena barang belum masuk dan yang hilang dari host cuma
waktu — sama seperti baris kedua. Sewa yang sudah berjalan tidak punya
"pembatalan" sama sekali: yang ada **pengakhiran lebih awal**, dan itu wajib
lewat serah terima keluar, karena barang harus keluar dulu dan keluarnya harus
tercatat. Sisa bulan yang belum dijalani dikembalikan; bulan yang sedang
berjalan tidak.

`batalkan_pemesanan` menolak dua keadaan terakhir dengan pesan yang menyebut
alasannya. Jangan menambahkan jalan pintas sebelum jalur pembayaran ada.

## Aturan teknis yang tidak boleh dilanggar

- **Uang**: `bigint`, rupiah penuh. Tidak pernah float, tidak pernah numeric.
- **Waktu**: `timestamptz`, simpan UTC, tampilkan Asia/Jakarta.
- **Status**: `text` + check constraint. Bukan enum Postgres.
- **Primary key**: uuid. Bukan serial.
- **Tabel bukti** (`manifes_item`, `serah_terima`, `pemesanan_transisi`,
  `akses_log`): perlakukan sebagai append-only. Perubahan manifes membuat
  versi baru, tidak menimpa. Di produk nanti UPDATE/DELETE di-REVOKE.
- **Foto verifikasi** diambil lewat kamera in-app (`getUserMedia` + canvas),
  bukan `<input type=file>`. Buang EXIF sebelum simpan.
- **Jangan simpan foto KTP** di database sendiri — nanti cukup simpan ID
  rujukan dari vendor e-KYC. Berlaku juga untuk data pembayaran.

## Keterbukaan alamat — tiga tingkat

| Tingkat | Untuk siapa | Yang terlihat |
|---|---|---|
| 1 | Siapa pun | Kelurahan, kecamatan, **jarak persis**, pin digeser ±200 m |
| 2 | Penyewa yang jadwal surveinya disetujui host | Alamat lengkap, patokan, titik asli |
| 3 | Setelah dibayar | Nomor kontak langsung |

Host memilih tingkat awalnya. Bawaan: tingkat 1 untuk ruang di rumah tinggal,
tingkat 2 untuk ruang komersial (ruko, gudang, kios).

**Penting**: jarak selalu dihitung dari koordinat asli dan ditampilkan persis.
Penyamaran tidak boleh mengurangi kualitas pencarian terdekat.
Pergeseran pin harus **deterministik per properti** — pergeseran acak yang
berubah tiap load justru membocorkan titik aslinya.

## Skema

`01_schema.sql` dan `02_seed.sql` sudah diuji jalan bersih di Postgres 16.
Seed berisi data Malang: 6 host, 4 penyewa, 14 ruang, 84 foto, 6 pemesanan
di lima status, manifes, log akses, ulasan, 5 permintaan ruang.

Pencarian terdekat: `ruang_terdekat(lat, lng, radius_km, volume_min, harga_maks)`
— haversine, tanpa PostGIS.

Catatan: di demo, properti dan ruang digabung dalam satu tabel `ruang`.
Di produk sebenarnya terpisah (satu properti, banyak ruang sewa).

## Urutan bangun

Kerjakan berurutan. Jangan lompat.

1. **Halaman pencarian — selesai** (4 Sep 2026). Titik + radius + tipe + ukuran
   + harga; seluruh keadaan filter ada di URL.
2. **Detail ruang — selesai** (4 Sep 2026). Foto berketerangan, rubrik kondisi
   lengkap, kebijakan, host, ulasan. Rubriknya jangan pernah diringkas;
   kelengkapan itu yang membedakan dari OLX.
3. **Auth — selesai** (4 Sep 2026). Supabase Auth email + sandi dengan
   konfirmasi email, `profil` diikat ke `auth.users` lewat trigger, dan seluruh
   RLS permisif ditulis ulang. Lihat `03_auth_rls.sql`.
4. **Alur pesan — selesai** (4 Sep 2026). Tanggal, manifes, konfirmasi host,
   penolakan, pembatalan. Lihat `04_pesan.sql`.

   `pemesanan` tetap **tanpa policy INSERT/UPDATE**: setiap perpindahan status
   lewat fungsi SECURITY DEFINER (`buat_pemesanan`, `konfirmasi_pemesanan`,
   `tolak_pemesanan`, `batalkan_pemesanan`) yang memeriksa siapa pemanggilnya,
   apakah status asalnya benar, dan apakah syarat isinya terpenuhi. Kalau
   menambah status baru, tambahkan fungsinya — jangan pernah memberi klien
   hak tulis ke kolom `status`.

   Alurnya **berhenti di `menunggu_pembayaran`** dan tidak ada satu pun fungsi
   yang bisa menaikkannya dari sana. Itu disengaja: menulis "sudah dibayar"
   tanpa uang sungguhan adalah kebohongan, bukan demo.
5. **Serah terima — TERHALANG pembayaran.** Statusnya hanya bisa dicapai
   setelah `menunggu_pembayaran` bisa dilewati, dan itu menunggu payment
   gateway. Yang sudah bisa dikerjakan sudah dikerjakan: hak UPDATE klien atas
   `serah_terima` dicabut, dan penandatanganannya lewat
   `tandatangani_serah_terima()` yang hanya bisa menyalakan tanda tangan milik
   pemanggil — host tidak bisa menandatangani atas nama penyewa. Sisanya, fungsi
   pembuat berita acaranya, menunggu.
6. **Dasbor host — selesai** (4 Sep 2026). Daftar ruang, tambah/ubah/hapus,
   unggah foto ke Supabase Storage. Lihat `05_host.sql`. Kotak masuk
   permintaannya tidak diduplikasi di sini — sudah ada di `/pemesanan`, yang
   menampilkan dua sisi sekaligus.
7. **Permintaan ruang — selesai** (4 Sep 2026). `/permintaan`: penyewa
   menitipkan kriteria, host melihat hitungannya per kecamatan lewat
   `permintaan_di_wilayah_saya()`.
8. **Landing page — selesai** (4 Sep 2026). `/` jadi halaman depan; pencarian
   pindah ke `/cari`.
9. **Jadwal kunjungan — selesai** (4 Sep 2026). Lihat `06_akses.sql`. Ini
   keputusan produk nomor satu ("akses bebas terjadwal") sekaligus pengganti
   segel tamper-evident, dan satu-satunya alur inti yang tidak terhalang
   pembayaran. Penyewa mengajukan jadwal, host menjawab, kedatangan dicatat;
   kuota bulanan ditegakkan database.

10. **Temuan Supabase Advisor — ditangani** (4 Sep 2026). Lihat
    `07_advisor.sql`. Yang diperbaiki: `search_path` empat fungsi, policy yang
    memanggil `auth.uid()`/`profil_saya()` per baris, dan `btree_gist` yang
    mendarat di skema `public`. Yang sengaja tidak diperbaiki — "Security
    Definer View" pada kelima view publik — alasannya ditulis di bagian 5
    berkas itu.
11. **Jendela akses jadi data terstruktur — selesai** (4 Sep 2026). Lihat
    `08_jendela.sql`. Menutup utang no. 1: aturan produk nomor satu akhirnya
    ditegakkan database, bukan cuma ditampilkan.

12. **Notifikasi in-app — selesai** (4 Sep 2026). Lihat `09_notifikasi.sql`.
    Sebelum ini host baru tahu ada permintaan kalau ia membuka `/pemesanan`
    sendiri — untuk marketplace dua sisi itu cacat mendasar. Triggernya dipasang
    di `pemesanan_transisi` dan `akses_log`, BUKAN di dalam masing-masing fungsi
    transisi, supaya transisi yang ditambahkan nanti (pembayaran, serah terima)
    otomatis ikut terkirim tanpa ada yang perlu ingat menambahkannya.
13. **Lupa sandi & halaman profil — selesai** (4 Sep 2026). `/lupa-sandi`,
    `/sandi-baru`, `/profil`.

### Berikutnya, selama pembayaran belum ada

Tinggal utang no. 3 (pisahkan dua tanda tangan serah terima jadi baris
sendiri), dan itu pun lebih baik dikerjakan bersamaan dengan serah terimanya.

Artinya: **tidak ada lagi fitur berarti yang bisa dibangun tanpa jalur
pembayaran.** Serah terima, pengakhiran lebih awal, dan kontrak PDF semuanya
menunggu `menunggu_pembayaran` bisa dilewati. Yang tersisa cuma pekerjaan yang
tidak menambah alur: verifikasi nomor HP (menunggu WhatsApp/SMS), memisahkan
properti dari ruang (utang no. 4), dan mengganti foto seed.

Kalau ada waktu dan pembayaran masih jauh, yang paling berguna dikerjakan
adalah **menyiapkan integrasi pembayarannya sendiri**: pilih penyedia, daftar
akun bisnis, lalu bangun `bayar_pemesanan()` beserta webhook-nya. Itu satu-
satunya hal yang membuka enam langkah berikutnya sekaligus.

## Yang masih menunggu pihak luar

Bukan keputusan produk: hal-hal ini butuh akun atau lisensi yang belum kita
punya. Jangan menirunya dengan tempelan yang terlihat berfungsi — layar yang
mengaku "sudah dibayar" tanpa uang sungguhan adalah kebohongan, bukan demo.

| Bagian | Kenapa belum | Yang boleh dikerjakan sekarang |
|---|---|---|
| Pembayaran | payment gateway berlisensi + akun bisnis | model pemesanan & transisi status |
| Verifikasi identitas | vendor e-KYC | kolom rujukan id vendor; jangan simpan foto KTP sendiri |
| Notifikasi WhatsApp | WhatsApp Business API provider | notifikasi in-app **sudah ada**; email lewat Supabase belum |
| Kontrak PDF | menunggu alur pesan | dibuat dari data pemesanan, bukan berkas contoh |

**Login tidak lagi masuk daftar ini.** Switcher peran dibuang; yang dipakai
auth Supabase sungguhan (lihat nomor 3 di urutan bangun).

## Bentuk keamanannya sekarang

Seluruh bacaan publik lewat **view**, bukan lewat policy di tabel — dan ini
keputusan, bukan kebetulan. Dua alasannya:

1. Yang perlu disembunyikan dari publik adalah **kolom** (`alamat`, `patokan`,
   `lat`, `lng`), dan RLS tidak menyaring kolom. View yang tidak memuat kolom
   itu menegakkannya.
2. Policy yang menyebut tabel lain ikut terkena RLS tabel itu. Policy "foto
   boleh dibaca kalau ruangnya tayang" selalu kosong untuk anon, karena anon
   tidak boleh membaca `ruang`.

Permukaan baca publik: `ruang_publik`, `ruang_foto_publik`, `ulasan_publik`,
`ruang_ketersediaan`, `permintaan_kecamatan`, dan fungsi `ruang_terdekat()`.
Anon **tidak punya hak select ke satu pun tabel dasar**. Kalau butuh data baru
di layar publik, tambahkan kolomnya ke view — jangan memberi anon akses tabel.

Dua kolom **tidak boleh ditulis klien sama sekali**: `lat_publik` dan
`lng_publik`. Keduanya dihitung trigger `ruang_pin_publik` dari hash id
ruangnya — tetap selamanya per ruang, 120-200 m dari titik asli. Triggernya
menyala di **setiap** insert dan update, bukan hanya saat `lat`/`lng` ikut
diubah: versi pertama memakai `update of lat, lng` dan bisa dilewati dengan
`update ruang set lat_publik = lat`, yang membatalkan seluruh aturan
penyamaran alamat tanpa jejak.

**Setiap migrasi yang menambah view atau mengubah hak akses WAJIB diakhiri
`select periksa_permukaan_publik();`.** Fungsi itu menggagalkan migrasi kalau
ada kolom rahasia yang bisa dibaca anon, atau anon punya hak ke tabel dasar mana
pun. Ia bukan hiasan: saat `08_jendela.sql` ditulis, ia menangkap bahwa tabel
`jendela_akses` yang baru langsung bisa **ditulis anon**, karena Supabase
memasang `alter default privileges ... grant all on tables to anon`. Jadi tiap
tabel baru butuh `revoke all ... from anon` eksplisit — jangan pernah
mengandalkan "kan saya tidak memberi grant".

**Notifikasi ditulis trigger, tidak pernah klien.** Klien tidak punya INSERT ke
`notifikasi` sama sekali — kalau punya, siapa pun bisa mengirim "Host menerima
permintaanmu" palsu ke orang lain. Triggernya menempel di `pemesanan_transisi`
dan `akses_log`; penerimanya selalu pihak yang TIDAK melakukan tindakan itu.

**Jendela akses adalah data, bukan teks.** Tabel `jendela_akses` yang jadi
sumber kebenaran; `ruang.jendela_akses` cuma label tampilan yang dihasilkan
trigger dari baris-baris itu. Jangan pernah menulis label itu dari aplikasi.

Policy yang saling menyebut wajib lewat helper `SECURITY DEFINER`
(`saya_host_ruang`, `saya_penyewa_terbayar`, `saya_pihak_pemesanan`,
`boleh_ulas`). Versi pertama menulisnya sebagai `exists (select ...)` biasa dan
Postgres menolak dengan "infinite recursion detected in policy" — tidak ada
satu pun kueri yang jalan.

## Utang yang diketahui

1. **Keterbukaan alamat tingkat 2 belum bisa ditegakkan.** Tingkat 1 (publik)
   dan 3 (setelah dibayar) sudah jalan. Tingkat 2 — "penyewa yang jadwal
   surveinya disetujui host" — butuh tabel permintaan survei yang belum ada:
   `akses_log` menempel ke pemesanan yang sudah jadi, sedangkan survei terjadi
   sebelum pemesanan ada. Sampai tabel itu ada, alamat hanya terbuka di
   tingkat 3.
2. **Dua tanda tangan serah terima masih satu baris.** Masalah keamanannya sudah
   ditutup — klien tidak punya UPDATE, dan penandatanganan lewat fungsi yang
   hanya bisa menyalakan tanda tangan pemanggil. Yang belum: bentuk datanya
   belum append-only sungguhan. Pisah jadi baris sendiri saat serah terima
   dibangun.
4. **Properti dan ruang masih satu tabel.** Satu properti dengan tiga ruang sewa
   sekarang harus jadi tiga baris `ruang` dengan alamat yang diulang.
5. **Foto isi seed masih `picsum.photos`.** Unggahan host sudah masuk Supabase
   Storage (bucket `ruang-foto`) dan EXIF-nya dibuang di peramban lewat canvas —
   penting, karena EXIF foto HP hampir selalu memuat GPS. Yang belum: kamera
   in-app untuk foto serah terima, dan bucket terpisah untuk foto bukti, yang
   tidak boleh publik.
6. **Nomor HP belum diverifikasi.** Diisi saat daftar dan disimpan apa adanya;
   verifikasinya menunggu jalur WhatsApp/SMS.

## Stack

Next.js (App Router) di Vercel · Supabase (Postgres + Storage) region Singapura.

**Vercel saja — tidak ada Railway.** Diputuskan 4 September 2026: satu-satunya
backend adalah API Supabase, jadi tidak ada worker atau penjadwal yang butuh
proses hidup terus. Kalau nanti perlu kerja terjadwal (mis. mengingatkan jadwal
akses sehari sebelumnya), pakai Vercel Cron + Route Handler, atau `pg_cron` di
Supabase — jangan menambah platform ketiga sebelum jelas keduanya tidak cukup.

Unggah foto lewat signed URL langsung ke Supabase Storage, jangan lewat
API route — mahal di bandwidth dan kena batas waktu fungsi.

## Bahasa

Seluruh UI dan copy dalam Bahasa Indonesia. Nama kolom database juga
Bahasa Indonesia (sudah begitu di schema) — konsisten, jangan campur.

@AGENTS.md
