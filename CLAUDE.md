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
| 2 | Penyewa yang alamatnya dibuka host dari percakapan | Alamat lengkap, patokan |
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
14. **PWA — selesai** (4 Sep 2026). Menutup keputusan produk nomor 4, yang
    selama ini baru terpenuhi separuh: aplikasinya memang mobile-first, tapi
    belum bisa dipasang di layar utama. Sekarang ada `app/manifest.ts`, ikon
    192/512/maskable/apple-touch yang dihasilkan `skrip/buat-ikon.mjs`, service
    worker, dan halaman offline.

    **Service worker tidak boleh menyimpan HTML halaman.** Hampir semua halaman
    dirender di server dan isinya bergantung pada siapa yang sedang masuk —
    nama di header, daftar pemesanan, alamat ruang yang sudah dibayar.
    Menyimpannya berarti halaman berisi data satu orang bisa tersaji lagi
    setelah ia keluar. Yang disimpan hanya aset statis ber-hash; navigasi selalu
    dari jaringan, dan saat gagal jatuh ke `public/offline.html` — berkas statis
    biasa, bukan rute Next, supaya tidak ikut merender layout yang membaca sesi.
15. **Web push — selesai** (4 Sep 2026). Lihat `10_push.sql`. Dipicu Database
    Webhook Supabase saat baris `notifikasi` dibuat, dikirim `/api/push`.

    **`/api/push` tidak memercayai badan permintaan webhook** dan membaca
    sendiri dari database. Kalau ia memakai isi yang dikirim webhook, siapa pun
    yang menebak rahasianya bisa mengirim pemberitahuan berisi apa saja ke
    perangkat orang lain.

    Ini satu-satunya tempat `SUPABASE_SERVICE_ROLE_KEY` dipakai, karena
    pengirim push harus membaca langganan milik orang lain. Jangan
    memperluasnya ke tempat lain.
16. **Percakapan penyewa & host — selesai** (4 Sep 2026). Lihat
    `11_pesan_chat.sql`. Satu utas per pasangan ruang dan penyewa, dibuka
    **sebelum** pemesanan.

    **Sebelum, bukan sesudah** — dan itu keputusan, bukan kelalaian. Rubrik
    kondisi menjawab banyak hal tapi tidak menjawab "muat motor saya nggak"
    atau "boleh lihat dulu". Memaksa orang mengisi tanggal dan manifes lengkap
    hanya untuk bertanya membuat sebagian besar dari mereka pergi, bukan
    memesan.

    Nomor telepon dan email **disamarkan di database**, bukan di layar:
    penyamaran di frontend bisa dilewati siapa pun yang memanggil API langsung.
    Tapi ini menahan di pinggiran saja — kebocoran ke luar aplikasi tidak bisa
    dicegah secara teknis. Yang benar-benar menahan orang di dalam adalah uang
    yang dijaga platform dan penengah saat bersengketa. **Jangan menambah
    rekayasa anti-kebocoran yang lebih berat dari ini sebelum pembayarannya
    jalan.**

    `pesan` tidak bisa diubah atau dihapus klien — ia bukti saat bersengketa.
17. **Balasan cepat — selesai** (4 Sep 2026). Lihat `12_balasan_cepat.sql`.

    **Balasan yang bisa disusun dari data ruang TIDAK disimpan.** Lebar pintu,
    jendela akses, sewa minimum, harga — semuanya dihitung di layar dari kolom
    yang sudah ada. Menyimpannya berbahaya: balasan tersimpan bisa menyebut
    lebar pintu lama setelah pintunya diganti, dan host tidak akan pernah tahu
    ia sedang mengirim keterangan yang salah.

    Yang disimpan hanya yang ditulis host sendiri, untuk hal yang memang tidak
    ada di rubrik ("sebaiknya datang sore, pagi ramai").

    Aturan turunannya: **kalau sebuah balasan bisa diturunkan dari kolom yang
    sudah ada, turunkan — jangan simpan salinannya.**

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

**Web push sudah ada** sejak `10_push.sql`, dan ia tidak butuh vendor mana pun:
kunci VAPID dibuat sendiri. Pemberitahuan sampai ke perangkat meski aplikasinya
tertutup — untuk host, itu justru keadaan yang paling sering terjadi. Cara
menyalakannya ada di SETUP.md; opsional, aplikasinya jalan penuh tanpanya.
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

1. **Dua tanda tangan serah terima masih satu baris.** Masalah keamanannya sudah
   ditutup — klien tidak punya UPDATE, dan penandatanganan lewat fungsi yang
   hanya bisa menyalakan tanda tangan pemanggil. Yang belum: bentuk datanya
   belum append-only sungguhan. Pisah jadi baris sendiri saat serah terima
   dibangun.
3. **Properti dan ruang masih satu tabel.** Satu properti dengan tiga ruang sewa
   sekarang harus jadi tiga baris `ruang` dengan alamat yang diulang.
4. **Foto isi seed masih `picsum.photos`.** Unggahan host sudah masuk Supabase
   Storage (bucket `ruang-foto`) dan EXIF-nya dibuang di peramban lewat canvas —
   penting, karena EXIF foto HP hampir selalu memuat GPS. Yang belum: kamera
   in-app untuk foto serah terima, dan bucket terpisah untuk foto bukti, yang
   tidak boleh publik.
5. **Nomor HP belum diverifikasi.** Diisi saat daftar dan disimpan apa adanya;
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

## Arah tampilan — diputuskan 4 September 2026

Terang, tenang, dan **warna dipakai hemat**. Latar nyaris putih (`--color-paper`
#f7f8fa), kartu putih bergaris tipis, dan biru merek (#2563eb) hanya muncul di
tombol utama, tautan, dan keadaan terpilih.

Ini menggantikan versi sebelumnya yang memakai gradien biru pekat sebagai
bidang besar — hero halaman depan dan seluruh bagian atas `/cari`. Alasannya
ketahuan setelah halamannya dilihat di layar sungguhan, bukan dari membaca
kode:

1. Di `/cari`, bidang itu mendorong hasil pencarian ke bawah lipatan. Hasil
   pencarian adalah satu-satunya alasan orang membuka halaman itu.
2. Warna sekuat itu di area seluas itu membuat foto ruang, harga, dan kondisi —
   hal yang benar-benar ingin dilihat orang — justru kalah menonjol.

Aturan yang mengikutinya:

- **Halaman alat kerja tidak punya hero.** `/cari`, `/pemesanan`, `/host`
  langsung ke isinya; kendalinya muat dalam satu bilah.
- **Yang berwarna besar hanya foto**, dan fotonya ruang sungguhan dari
  database — bukan gambar hiasan.
- **Bayangan sangat halus, dua tingkat saja** (`.naik`, `.naik-hover` di
  globals.css). Halaman hasil menampilkan belasan kartu sekaligus; bayangan
  tebal membuatnya terasa berat.
- **Tinggi bilah atas ada di satu variabel** (`--tinggi-header`), diukur dari
  halaman jadi: 74px di layar kecil, 78px dari `sm`. Tiga tempat bergantung
  padanya. Sebelumnya ketiganya menulis `68px` sendiri-sendiri dan ketiganya
  salah, sehingga bilah filter menyelinap 10px ke balik header.

## Bahasa

Seluruh UI dan copy dalam Bahasa Indonesia. Nama kolom database juga
Bahasa Indonesia (sudah begitu di schema) — konsisten, jangan campur.

@AGENTS.md
