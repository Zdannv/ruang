# Ruang

**Lahan usaha pinggir jalan.** Halaman depan rumah yang menganggur, disewakan
bulanan ke UMKM yang butuh tempat berjualan. Slogannya: *lahan nganggur jadi
cuan.*

Fokus itu dipersempit 7 September 2026, menggantikan "marketplace ruang P2P
untuk apa pun". Penyimpanan tidak dibuang — tipe ruang tertutup tetap ada dan
tetap bisa disewakan — tapi ia bukan lagi yang di depan, dan copy maupun
urutan di seluruh layar mengikuti fokus baru itu.

Nama produk sengaja **tidak** mengunci ke penitipan. Tahap pertama adalah sewa
ruang penyimpanan, tapi model data dan penamaan harus tetap netral supaya bisa
meluas nanti — sewa ruang untuk keperluan lain, atau jual-beli. Hindari kata
"titip" di nama tabel, rute, dan komponen.

**Nama aplikasi: Ada Tempat** (diputuskan 19 September 2026, sebelumnya
`Cari Ruang`, sebelumnya lagi `Ruang`). Domainnya `adatempat.com`. Slogannya
**sewa tempat usaha jadi gampang**, menggantikan *lahan nganggur jadi cuan*
yang masih boleh dipakai sebagai kalimat ajakan ke pemilik lahan, tapi bukan
lagi slogan utama.

Catatan penamaan: nama tabel `ruang` tetap. Di kode aplikasi
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
2. ~~**Pemesanan & pembayaran lewat platform** — bukan papan iklan.~~
   **DIBALIK 18 September 2026.** Rilis pertama justru papan iklan: orang
   bertanya lewat chat lalu bertemu sendiri dengan pemiliknya, seperti OLX.
   Lihat nomor 43. Tiga keputusan lain di daftar ini tetap berlaku.
3. **Harga per ruangan, ditentukan host** — bukan satuan boks seragam.
4. **Web app / PWA** — bukan native. Mobile-first.

Konsekuensi yang sudah diputuskan:

- **Tidak ada segel tamper-evident.** Bertentangan dengan akses bebas.
  Penggantinya: manifes berfoto + berita acara serah terima + log akses.
- **Tidak ada asuransi dan tidak ada jaminan ganti rugi dari platform.**
  Jangan pernah menulis "garansi keamanan" atau "barang dijamin aman" di UI.
  Sejak 18 September 2026 kalimatnya lebih keras lagi, karena uangnya tidak
  pernah lewat aplikasi: *aplikasi mempertemukan, tidak memegang uang, tidak
  menengahi, dan tidak memberi ganti rugi.* Kalimat lama ("platform memutuskan
  siapa yang benar") sudah TIDAK BOLEH dipakai — tanpa pemesanan, manifes, dan
  log akses, tidak ada bukti apa pun yang bisa dipakai memutuskan.
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

## Keterbukaan alamat — satu saklar milik pemiliknya

**Diubah 18 September 2026** (migrasi 21), mengganti tiga tingkat yang lama.
Tingkat 2 dan 3 dulu dipicu persetujuan host dan pembayaran; begitu alur
pemesanan dibuang, tidak ada lagi peristiwa yang bisa memicunya, dan alamat
yang tidak pernah terbuka memaksa orang chat cuma untuk tahu lahannya di mana.

| `terbuka_alamat` | Yang terlihat siapa pun |
|---|---|
| **menyala** (bawaan) | Alamat lengkap, patokan, titik peta **asli** |
| mati | Kelurahan, kecamatan, **jarak persis**, pin digeser ±200 m |

Pemiliknya yang memilih, dari formulir lahannya. Yang sudah terdaftar
**tidak ikut dinyalakan**: mereka mengisi alamat itu saat layar berjanji
alamatnya tidak akan pernah publik.

Nomor telepon **tidak ikut saklar ini**. Ia selalu lewat `kontak_lahan()`,
yang menolak pemanggil yang belum masuk — supaya nomor pemilik lahan tidak
bisa dipanen satu permintaan tanpa akun.

**Penting**: jarak selalu dihitung dari koordinat asli dan ditampilkan persis.
Penyamaran tidak boleh mengurangi kualitas pencarian terdekat.
Pergeseran pin harus **deterministik per properti** — pergeseran acak yang
berubah tiap load justru membocorkan titik aslinya.

Yang diplot di peta SELALU `peta_lat`/`peta_lng` dari `ruang_publik`, tidak
pernah `lat`/`lng` mentah. Databaselah yang memutuskan isinya titik asli atau
pin geseran; layar cuma menggambar, dan `alamat_terbuka` yang memberitahunya
mana yang sedang ia tampilkan.

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

18. **Penjual online ikut terlayani — selesai** (5 Sep 2026). Lihat
    `13_umkm.sql`. Kategori barang sudah ada di `ruang.kategori_diterima`
    sejak `01_schema.sql`, termasuk `stok_dagangan`, tapi tidak ada satu pun
    cara **menemukannya**: `ruang_terdekat()` tidak mengembalikan kolomnya dan
    `/cari` tidak punya penyaringnya. Jadi ruang yang menerima stok dagangan
    ada, dan penjual yang mencarinya tidak bisa memisahkannya dari yang akan
    menolaknya. Sekarang bisa.

    Ditambah juga `profil.nama_usaha` dan `profil.npwp`, keduanya opsional.
    `npwp` masuk daftar kolom terlarang di `periksa_permukaan_publik()`.

    **Tidak ditambahkan: invoice.** Menerbitkan "Invoice Rp1.200.000" untuk
    uang yang belum pernah berpindah adalah dokumen palsu — dan bedanya dengan
    layar yang mengaku "sudah dibayar" cuma satu: invoice dibawa orang ke
    pembukuannya. Ia menunggu pembayaran, seperti serah terima.

    **Tidak ditambahkan: pencatatan stok masuk-keluar.** Bentuknya belum
    diketahui — satuan, SKU, per boks, per lembar — dan menebaknya berarti
    membangun tabel yang harus dibongkar setelah penjual pertama memakainya.
    Yang sudah ada sekarang sudah menutup sebagian besar gunanya: manifes
    berversi mencatat nama, kategori, jumlah, dan nilai taksiran per barang,
    dan `akses_log` mencatat setiap kedatangan.

19. **Foto versi kecil — selesai** (6 Sep 2026). Lihat `14_foto_kecil.sql`.
    Setiap layar menarik berkas yang sama, 1600px, untuk kartu yang di layar
    lebarnya 360px. Yang habis duluan di paket gratis bukan penyimpanan
    melainkan bandwidth, dan inilah sumbernya.

    Versi kecil dibuat di peramban saat unggah — canvas yang sudah dipakai
    membuang EXIF dipanggil dua kali — bukan oleh layanan pengubah ukuran
    yang ditagih per gambar. Diukur pada satu foto HP sungguhan (900×1600):

    | | Ukuran |
    |---|---|
    | Sebelumnya, JPEG q0.85 | 174 KB |
    | Versi penuh, WebP q0.82 | 102 KB |
    | Versi kecil 800px, WebP q0.75 | **27 KB** |

    Jadi menyimpan DUA berkas (129 KB) tetap lebih hemat daripada satu berkas
    lama (174 KB), dan kartu hasil pencarian jadi 6,4 kali lebih ringan.

    Kartu memakai `unoptimized` **hanya** kalau URL-nya berakhiran
    `AKHIRAN_KECIL` — gambar 800px sudah berukuran tepat, dan menyerahkannya
    ke pengubah ukuran berarti membayar per gambar untuk memperkecil sesuatu
    yang sudah kecil. Foto lama tidak punya versi kecil, dan untuk mereka
    pengubah ukurannya tetap dipakai.

    `url_kecil` nullable, dan `fotoPertama()` mundur ke kolom lama saat
    databasenya menjawab `42703`. Tanpa itu, jarak antara push dan menjalankan
    migrasinya membuat SELURUH hasil pencarian mati — bukan sekadar
    kehilangan penghematan. Kemunduran itu diuji terhadap database sungguhan
    yang kolomnya memang belum ada.

20. **Alur daftar ruang jadi dua langkah — selesai** (6 Sep 2026).
    `/host/ruang/baru`: keterangan ruangnya dulu, lalu fotonya, di halaman
    yang sama.

    Sebelumnya halaman itu cuma berisi formulirnya, dan fotonya baru bisa
    diunggah kalau host menemukan sendiri jalan kembali ke ruang yang barusan
    ia buat. Halamannya bahkan menjelaskan alasannya — "karena keduanya
    menempel ke ruang yang sudah punya id". Itu kendala teknis yang bocor jadi
    masalah produk, dan dasbornya sendiri sudah tahu akibatnya: ia memasang
    peringatan "ruang tanpa foto hampir tidak pernah diklik".

    Urutannya memang tidak bisa dibalik — foto butuh id ruangnya, untuk jalur
    berkas di Storage maupun untuk baris `ruang_foto`. Yang diubah adalah siapa
    yang menanggung kendala itu.

    `KelolaFoto` sekarang mengelola daftarnya sendiri, tidak lagi bergantung
    penuh pada `router.refresh()`. Ketergantungan itu cuma bekerja di halaman
    yang memang mengambil fotonya dari server; di langkah dua alur ini halaman
    tidak mengambil apa pun, jadi host akan mengunggah foto lalu menatap kotak
    kosong.

21. **Wilayah dipilih dari daftar, bukan diketik — selesai** (6 Sep 2026).
    Lihat `src/app/api/wilayah/route.ts` dan `PilihWilayah.tsx`.

    Kelurahan, kecamatan, dan kota dulunya kolom teks bebas. Itu bukan cuma
    soal kenyamanan host: `permintaan_kecamatan()` dan facet pencarian
    mengelompokkan wilayah **sebagai teks**, jadi "Lowokwaru", "lowokwaru",
    dan "Kec. Lowokwaru" adalah tiga wilayah berbeda menurut database — dan
    tidak ada satu pun layar yang bisa menyadari hitungannya sudah pecah.
    Ruang sungguhan pertama di database produksi masuk dengan kecamatan
    `test`, yang menunjukkan persis betapa mudahnya itu terjadi.

    Sumbernya **wilayah.id** (data Kemendagri, Permendagri 72/2019), gratis
    dan tanpa kunci. Dipanggil lewat Route Handler sendiri, bukan langsung
    dari peramban, karena dua alasan: wilayah.id tidak mengirim
    `Access-Control-Allow-Origin`, dan satu-satunya alternatif yang mengirim
    header itu (emsifa) menuliskan seluruh nama HURUF BESAR — yang justru
    merusak hal yang sedang diperbaiki.

    Parameter `kode` diperiksa dengan `/^\d{2}(\.\d{2}){0,2}$/` sebelum
    disambung ke URL upstream. Tanpa itu, siapa pun bisa mengarahkan
    permintaan server kita ke tempat lain.

    Daftarnya boleh gagal: `PilihWilayah` berpindah ke tiga kolom teks
    beserta peringatannya, bukan menyandera formulirnya. Host yang sedang
    mendaftarkan ruang tidak boleh terhenti gara-gara layanan pihak ketiga.

22. **Data contoh dihapus — selesai** (6 Sep 2026). Lihat `15_hapus_seed.sql`,
    dan bagian 3 di SETUP.md. `02_seed.sql` sekarang opsional dan tidak lagi
    ada di daftar migrasi wajib.

    Penghapusannya menyebut id satu per satu, bukan `truncate` atau
    `delete from ruang`: pada saat migrasi itu ditulis, database sasarannya
    sudah memuat satu ruang sungguhan beserta fotonya di Storage. Urutannya
    juga bukan selera — `pemesanan.ruang_id` dan `pemesanan.penyewa_id` tidak
    cascade, jadi menghapus ruang atau profil lebih dulu akan ditolak
    Postgres.

    Profil seed yang sudah diklaim akun sungguhan (`user_id is not null`)
    sengaja ditinggalkan. Petunjuk lama menyarankan mengklaim profil host
    seed untuk mencoba dasbornya; menghapusnya berarti menghapus baris profil
    akun yang sedang dipakai, dan pemiliknya akan mendapati layar "Profilmu
    belum terbentuk" tanpa tahu sebabnya.

23. **Alur daftar & email dirapikan — selesai** (6 Sep 2026).

    **Email yang sudah terdaftar akhirnya ditolak.** Selama konfirmasi email
    menyala, Supabase TIDAK mengembalikan galat untuk email yang sudah
    dipakai — ia menjawab sukses dengan objek user samaran, supaya formulir
    daftar tidak bisa dipakai menebak alamat email siapa saja yang punya akun.
    Akibatnya di layar: menekan "Daftar" dengan email lama memberi jawaban
    yang sama dengan pendaftaran berhasil, padahal tidak ada email yang
    dikirim, dan orangnya menunggu sesuatu yang tidak pernah datang.

    Penandanya `data.user.identities` yang kosong. Memakainya berarti melepas
    perlindungan tadi, dan itu **ditukar sadar**: penyewa yang tidak bisa
    masuk ke akunnya sendiri adalah kerugian yang pasti, sedangkan penebakan
    alamat di sini paling banter memberi tahu bahwa seseorang punya akun.
    `/lupa-sandi` tetap menjawab sama untuk email yang ada maupun tidak — kalau
    nanti perlindungan itu mau dipulihkan, di situlah tempatnya diperketat,
    bukan dengan membuat layar daftar berbohong lagi.

    **Templat email ditulis sendiri**, di `supabase/email/`. Ketiganya memakai
    `{{ .TokenHash }}`, bukan `{{ .ConfirmationURL }}`: yang terakhir menempuh
    dua lompatan sehingga Site URL DAN Redirect URLs dua-duanya harus benar,
    sedangkan TokenHash menuju langsung ke halaman kita. Satu pengaturan yang
    bisa salah, bukan dua.

    Aturan menulisnya berbeda dari halaman web dan ditulis di komentar tiap
    berkas: tata letak `<table>`, CSS inline, tanpa gambar eksternal.

    **Catatan konfigurasi, bukan kode:** *"This site can't be reached"* setelah
    menekan tautan konfirmasi hampir selalu berarti Site URL project masih
    `http://localhost:3000`. Cara memeriksanya tanpa dashboard ada di SETUP.md
    langkah 6.

24. **Titik awal pencarian tidak lagi selalu Kampus UB — selesai**
    (6 Sep 2026). Lihat `src/lib/lokasiTersimpan.ts`.

    `/cari` dulu selalu mulai dari `TITIK_BAWAAN`, dan lokasi sungguhan hanya
    dipakai kalau tombol "Lokasiku" ditekan — termasuk bagi orang yang sudah
    pernah memberi izin lokasi, dan termasuk saat ia baru saja mencari dari
    titik lain semenit sebelumnya.

    Urutan penentuannya sekarang: parameter URL, lalu lokasi sungguhan **kalau
    izinnya sudah pernah diberikan**, lalu titik terakhir yang dipakai di
    perangkat itu, lalu titik bawaan. Kueri pertama ditahan `siapCari` sampai
    keputusannya jatuh — tanpa itu halaman menjalankan satu pencarian dari
    Kampus UB, menampilkan hasilnya, lalu menggantinya.

    **Yang TIDAK dilakukan: memanggil `getCurrentPosition()` saat halaman
    terbuka.** Dialog izin yang muncul tanpa interaksi diredam Chrome, dan
    penolakannya MELEKAT — sekali ditolak, tombol "Lokasiku" pun tidak bisa
    lagi bertanya. Jadi kunjungan pertama tetap butuh satu ketukan; yang
    diperbaiki adalah membuat ketukan itu terlihat (ada tawaran khusus yang
    muncul hanya di keadaan itu), bukan tersembunyi di antara kendali lain.

    Catatan untuk siapa pun yang menyentuh efek ini lagi: versi pertama
    memakai `useRef` sebagai kunci sekali-jalan, dan **ref bertahan melewati
    pelepasan komponen**. React memasang-melepas-memasang ulang setiap efek di
    mode ketat, jadi jalur pertama dibatalkan cleanup-nya sementara jalur
    kedua menemukan kuncinya sudah terpakai — hasilnya `siapCari` selamanya
    false dan pencarian tidak pernah dijalankan sama sekali. Ketahuan saat
    halamannya dibuka, bukan dari membaca kodenya.

25. **Titik awal ikut wilayah pendaftaran — selesai** (6 Sep 2026). Lihat
    `16_wilayah_profil.sql` dan `src/app/api/titik-saya/route.ts`.

    Untuk orang Malang, titik bawaan "Kampus UB" kebetulan masuk akal. Untuk
    orang Surabaya ia salah, dan tidak ada apa pun di aplikasi yang
    menyadarinya — padahal wilayahnya sudah ditanyakan saat mendaftar.

    Yang menghalangi bukan datanya melainkan bentuknya: `profil.kota` adalah
    NAMA, `ruang_terdekat()` butuh koordinat. Jembatannya `/api/titik-saya`,
    yang menggeokode nama wilayahnya **sekali** lewat Nominatim, menyimpan
    hasilnya ke `profil.lat`/`lng`, dan sesudahnya menjawab dari database.

    **Rute itu tidak menerima parameter apa pun, dan itu keputusan
    keamanan.** Wilayah yang digeokode selalu diambil dari profil
    pemanggilnya sendiri. Kalau ia menerima `?q=`, ia menjadi geocoder terbuka
    atas nama server kita — dan Nominatim membatasi pemakaian per IP, jadi
    penyalahgunaannya memblokir seluruh pengguna aplikasi ini, bukan
    penyalahgunanya.

    **Yang dikirim ke Nominatim hanya nama wilayah administratif.** Koordinat
    asli ruang TIDAK BOLEH pernah dikirim ke geocoder mana pun; seluruh aturan
    penyamaran alamat sia-sia kalau titik aslinya bocor lewat permintaan pihak
    ketiga.

    Formulir daftar sekarang memakai `PilihWilayah` dan berhenti di
    **kabupaten/kota** (`sampai="kabupaten"`), bukan kelurahan: di sana
    wilayahnya cuma jadi titik awal pencarian, dan dua dropdown tambahan di
    formulir daftar lebih mahal daripada ketelitian yang didapat. Halaman akun
    menawarkan keempat tingkatnya bagi yang mau lebih tepat, dan mengubahnya
    **mengosongkan `lat`/`lng`** supaya dihitung ulang — kalau tidak,
    pencarian tetap mulai dari kota lama setelah orangnya pindah.

    Urutan titik awal `/cari` selengkapnya: parameter URL → lokasi sungguhan
    (kalau izinnya sudah ada) → titik terakhir di perangkat itu → wilayah
    pendaftaran → titik bawaan.

26. **Wilayah hanya boleh dipilih dari daftar — selesai** (6 Sep 2026).
    Tidak ada lagi satu pun kolom teks bebas untuk kelurahan, kecamatan,
    atau kota di seluruh aplikasi.

    Yang dibuang: tombol "wilayahku tidak ada di daftar — ketik sendiri" dan
    seluruh mode manualnya di `PilihWilayah`. Tombol itu ditulis sebagai
    jaring saat layanannya mati, tapi ia melubangi satu-satunya hal yang
    komponen itu ada untuk menjaganya — begitu satu orang mengetik "kota
    malang", hitungan wilayahnya pecah dan tidak ada layar yang bisa
    menyadarinya.

    Dua formulir yang ternyata masih memakai teks bebas dan ikut diganti:

    - **`/permintaan`** — dan ini yang paling merugikan. Formulir itu justru
      yang mengisi `permintaan_kecamatan`, view yang mengelompokkan
      BERDASARKAN TEKS kecamatan. Satu orang yang menulis "lowokwaru" membuat
      permintaannya tidak pernah terlihat oleh host Lowokwaru, dan keduanya
      tidak akan pernah tahu kenapa.
    - **`/profil`** pada jalur sebelum migrasi 16 — `kelurahan` dan
      `kecamatan` belum ada kolomnya di sana, tapi `kota` ada, dan ia tetap
      harus berasal dari daftar.

    Ganti jaringnya: `src/data/wilayah-dasar.json` (25 KB) memuat 38 provinsi
    dan 514 kabupaten/kota, dan `/api/wilayah` menyajikannya saat upstream
    tidak bisa dihubungi. Jadi nama **kota** selalu bisa dipilih dari daftar
    yang sah, apa pun yang terjadi pada wilayah.id.

    Kecamatan dan kelurahan sengaja TIDAK disalin: jumlahnya 7.200 dan 83.000,
    dan mengunduhnya berarti ribuan permintaan ke layanan gratis. Di dua
    tingkat itu kegagalan dijawab 502 dan formulirnya menawarkan **coba
    lagi**. Konsekuensinya ditanggung sadar: kalau wilayah.id mati, ruang baru
    memang tidak bisa didaftarkan sampai ia hidup lagi. Ruang dengan kecamatan
    "test" lebih merugikan daripada ruang yang didaftarkan sepuluh menit
    kemudian.

    `PilihWilayah` sekarang punya prop `sampai`: `"kabupaten"` untuk
    pendaftaran akun, `"kecamatan"` untuk permintaan ruang, `"kelurahan"`
    untuk ruang.

27. **Wilayah peluncuran: Sidoarjo dan Surabaya Selatan** (7 Sep 2026),
    menggantikan Malang. Malang berasal dari data contoh `02_seed.sql` yang
    sudah dibuang — bukan dari keputusan pasar. Yang menentukan: pemiliknya
    berdomisili di Sidoarjo, dan lima belas host pertama harus bisa didatangi
    sendiri.

    `TITIK_PRESET` sekarang Waru/Aloha, Gedangan, Kota Sidoarjo,
    Sepanjang/Taman, Krian, dan Rungkut. Bobotnya sengaja ke Sidoarjo, bukan
    dibagi rata dengan Surabaya: kepadatan yang membuat "1 km dari rumahmu"
    benar, dan satu wilayah yang terisi lebih berguna daripada dua wilayah
    yang setengah-setengah.

    Preset bukan hiasan — ia satu-satunya cara orang memulai pencarian sebelum
    memberi izin lokasi, jadi kota yang salah di sini berarti hasil kosong pada
    kunjungan pertama. Titik awal peta di formulir ruang baru ikut dipindah.
    Koordinatnya diambil dari Nominatim, bukan ditebak.

    **Copy-nya ikut disesuaikan, dan urutannya yang paling berubah.** Sidoarjo
    bukan kota mahasiswa; ia padat penjual online dan usaha rumahan. Jadi
    segmen "Jualan online" dan "Usaha rumahan" naik ke depan dan "Kos
    kesempitan" turun ke belakang, dan di daftar tipe ruang "Lantai ruko"
    naik ke atas "Kamar" — di sana lantai ruko yang kosong jauh lebih banyak
    daripada kamar kos yang disewakan sebagian.

    Ajakan ke host juga berubah sasaran, dari "ruang yang cuma jadi gudang
    barang lama" menjadi **lantai dua ruko yang belum tersewa**, berikut
    kalimat yang mengisi kegagalan mereka: satu lantai tidak harus disewakan
    utuh ke satu penyewa, ia bisa dibagi ke beberapa orang. Pemilik ruko yang
    iklannya sudah berbulan-bulan tidak laku adalah daftar host paling hangat
    yang tersedia di wilayah itu.

28. **Fokus dipersempit ke lahan usaha pinggir jalan** (7 Sep 2026). Lihat
    `17_lahan_usaha.sql`.

    Yang menghalangi pivot ini bukan copy melainkan skema: kedelapan tipe yang
    ada seluruhnya ruang TERTUTUP, jadi halaman depan rumah secara harfiah
    tidak bisa dimasukkan ke database. Ditambah empat tipe lahan terbuka —
    `halaman_depan`, `lahan_kosong`, `teras`, `kios`.

    **Dua kelompok tipe sekarang punya satuan berbeda, dan layar wajib
    mengikutinya.** Lahan terbuka diukur LUAS (m²), ruang tertutup diukur
    VOLUME (m³) — lihat `pakaiLuas()`. Bukan kerapian: halaman 3×2 meter
    menghasilkan `volume_m3` = 0,60, angka yang benar secara aritmatika dan
    tidak berarti apa-apa bagi pedagang yang memikirkan berapa meter muka
    jalannya. `ruang_terdekat()` di-drop dan dibuat ulang supaya ikut
    mengembalikan `luas_m2`.

    **Kartu hasil dirancang untuk HP lebih dulu**, dan di lebar telepon ia
    tampil DUA KOLOM. Versi satu kolom cuma memuat satu setengah kartu per
    layar, dan menelusuri sepuluh pilihan terasa seperti pekerjaan. Urutan
    bacanya dibalik: harga dulu, judul sesudahnya — di marketplace, harga yang
    menentukan apakah sebuah kartu layak dibuka.

    Copy-nya ditulis ulang dengan register yang jauh kurang baku ("nggak perlu
    beli tanah", "gampang kok"), dan `ALASAN` sengaja **hanya menyebut hal
    yang datanya benar-benar ada**. Rubrik yang paling dibutuhkan pedagang —
    lebar muka jalan, listrik, air, atap, jam boleh jualan — belum ada
    kolomnya, jadi tidak disebut. Menjanjikannya sekarang berarti pengunjung
    pertama membuka listing dan tidak menemukannya.

    **Empat hal yang sengaja belum dikerjakan**, ditulis juga di ekor
    `17_lahan_usaha.sql`: rubrik khusus lahan usaha; `kuota_akses_bulanan`
    yang untuk pedagang tidak berarti (ia di sana setiap hari, bukan beberapa
    kali sebulan); manifes dan serah terima yang harus jadi opsional per tipe
    karena pedagang membawa gerobaknya pulang; dan `kategori_diterima` yang
    masih kategori BARANG padahal untuk lahan usaha yang menentukan adalah
    JENIS USAHA yang diizinkan pemilik — "boleh menggoreng" adalah pertanyaan
    yang jawabannya membatalkan sewa.

29. **Lambang dan kartu sorotan** (8 Sep 2026).

    Lambangnya **kanopi warung di atas garis lahan**, menggantikan siluet
    rumah. Rumah menggambarkan tempatnya; yang dijual aplikasi ini adalah apa
    yang TERJADI di tempat itu. Kanopi bergelombang terbaca dua arah — warung
    bagi pedagang, atap bagi pemilik rumah — dan itu persis dua sisi pasarnya.
    Garis lahan di bawahnya sengaja **lebih lebar** daripada kanopinya: itu
    yang membedakannya dari lambang storefront yang sudah lazim, dan sekaligus
    benar artinya, karena yang disewakan adalah lahannya.

    **Geometrinya hidup di tiga tempat** dan harus diubah bersamaan:
    `src/components/Lambang.tsx`, `public/ikon.svg`, dan
    `skrip/buat-ikon.mjs` yang menghitung ikon PWA per piksel. Kalau salah
    satu tertinggal, lambang di aplikasi dan ikon di layar utama jadi dua
    bentuk berbeda.

    Kanopinya digambar sebagai tiga busur **lingkaran**, bukan gelombang
    sinus. Versi pertama memakai sinus dan hasilnya terbaca sebagai air, bukan
    kain — ketahuan setelah PNG-nya dilihat, bukan dari membaca rumusnya.

    **Kartu sorotannya** dulu empat berkas SVG yang dihasilkan
    `skrip/buat-promo.py`. Diganti **dua ilustrasi** 9 September 2026 — SVG-nya
    terlalu datar untuk halaman utama meski sudah dirancang ulang sekali.
    Skrip dan keempat SVG-nya dibuang, bukan ditinggalkan mati.

    Dua pesan yang hilang bersamanya — rubrik jujur dan alamat bertahap —
    sudah dinyatakan sebagai teks HTML di bagian "Yang kamu dapat", jadi tidak
    ada keterangan yang benar-benar lenyap.

    Geseran mendatar dengan snap, **dulu** tanpa pemutar otomatis sama
    sekali. Dibalik 10 September 2026 — lihat nomor 39.

32. **Gambar sorotan: dua ilustrasi** (9 Sep 2026). Sumbernya di
    `desain/sorotan/`; yang disajikan hasil `skrip/pasang-sorotan.mjs`.

    **Jangan pernah menaruh JPEG aslinya langsung ke `public/`.** Aslinya
    1948 KB dan 2036 KB; setelah diperkecil ke 1400px dan dijadikan WebP
    q80 keduanya jadi 93 KB dan 96 KB — **95% lebih kecil**. Gambar ini
    diunduh di SETIAP kunjungan halaman depan, jadi ia berkas paling sering
    diunduh di seluruh aplikasi.

    **Rasionya diseragamkan, dan caranya bukan memangkas.** Versi pertama
    skrip itu memangkas dari tengah ke rasio terlebar — dan itu memotong judul
    di atas serta lambang di bawah, persis dua bagian terpenting. Ketahuan
    saat diuji dengan gambar berbingkai, bukan dari membaca kodenya.

    Yang dipakai: rasio bersama = rata-rata geometris rasio semua gambar
    (1,79 dan 1,31 → 1,53), lalu setiap gambar diberi bingkai `contain` ke
    sana dengan warna yang diambil dari piksel sudutnya sendiri. Keduanya cuma
    dapat bingkai 8-9% dan tidak satu piksel pun dibuang. Menyeragamkan ke
    rasio tertinggi akan memberi bingkai 18% pada yang lebar — cukup besar
    untuk terbaca sebagai kesalahan.

    **Yang PERTAMA harus memuat slogan utama**: di layar telepon cuma satu
    kartu yang terlihat sebelum digeser.

    Berbeda dari kartu SVG dan dari foto hasil pencarian, gambar ini **tidak**
    memakai `unoptimized`. Untuk SVG penghematan pengubah ukuran nol — ia
    bebas resolusi. Di sini berkasnya 1400px sementara slotnya 352px di
    telepon, jadi pengubah ukurannya benar-benar memotong dua pertiga, dan
    telepon adalah sasaran utamanya. Diperiksa: Next meminta varian `w=750`
    di layar kecil.

30. **Video lahan — selesai** (8 Sep 2026). Lihat `18_video.sql`,
    `src/lib/video.ts`, dan `PemutarVideo`. Diminta client; sebelumnya
    ditunda karena host diperkirakan tidak akan merekam sendiri, tapi
    permintaan yang nyata mengalahkan perkiraan.

    **Yang menentukan rancangannya bukan tabelnya melainkan kuota.** Satu
    video 30 detik dari HP sekitar 8 MB; paket gratis Supabase memberi 1 GB
    penyimpanan dan 5 GB egress per bulan. Kalau pemutarnya memuat sendiri,
    5 GB habis di sekitar 600 kunjungan halaman lahan.

    Tiga hal menahannya, dan yang ketiga paling besar:

    1. Bucket dibatasi 20 MB per berkas.
    2. Peramban menolak video lebih dari 45 detik **sebelum** mengunggah —
       host merekam pakai data seluler, dan ditolak setelah 20 MB terkirim
       adalah pengalaman yang membuat orang berhenti mencoba.
    3. **`preload="none"` dengan poster.** Biaya berpindah dari "setiap
       pengunjung" ke "setiap penonton", dan sebagian besar pengunjung tidak
       menonton. Posternya satu bingkai yang diambil di peramban saat unggah;
       tanpa itu yang perlu ditekan cuma kotak hitam.

    Videonya **tidak** dikompres ulang di peramban. Satu-satunya cara yang
    bisa diandalkan adalah ffmpeg.wasm — unduhan 25 MB demi menghemat
    beberapa MB, pertukaran yang arahnya salah.

    Kalau egress-nya tetap sempit, bucket-nya dipindah ke penyimpanan objek
    lain **tanpa migrasi data**: `url` disimpan per baris, jadi video lama dan
    baru boleh tinggal di tempat berbeda — persis seperti foto.

    Pengambilan posternya boleh gagal (sebagian peramban HP menolak menggambar
    bingkai video ke canvas) dan itu tidak membatalkan unggahan. Pemuatan
    videonya di halaman lahan juga dijawab daftar kosong saat migrasinya belum
    dijalankan — halaman terpenting di aplikasi ini tidak boleh mati karena
    penyempurnaan yang belum dipasang.

31. **Empat hak view yang tidak seharusnya ada — ditutup** (8 Sep 2026).
    Ketemu saat menulis migrasi 18, bukan dicari. Lihat catatan penjaga di
    bagian "Bentuk keamanannya sekarang".

    Tidak ada yang bisa dieksploitasi hari ini, dan itu **sudah diuji**:
    ketiga view "milik saya" `security_invoker = true`, jadi RLS tetap
    berlaku, dan percobaan mengubah lahan milik orang lain lewat `ruang_saya`
    menghasilkan `UPDATE 0`. Empat view publik lainnya view atas JOIN, yang
    Postgres tolak untuk ditulisi.

    Dicabut tetap, karena `ruang_saya` adalah view SATU TABEL — Postgres
    menerimanya sebagai bisa ditulis, dan yang menahannya cuma satu opsi.
    Hari ada orang membuat view serupa tanpa `security_invoker`, hak tulis
    yang menganggur itu langsung jadi jalan menembus RLS.

33. **Halaman depan: contoh listing, bukan deret angka** (9 Sep 2026).

    **Yang dibuang dari hero:** deret "N lahan tayang · N kecamatan · termurah
    Rp X", dan kotak pencarian `CariCepat`.

    Deret angka itu tidak menjawab pertanyaan yang sedang dipikirkan
    pengunjung. Dengan dua lahan di database ia bahkan membaca sebagai
    aplikasi yang kosong — dan tetap tidak berguna pada lima belas.

    Kotak pencarian dipindah ke `/cari` saja: di halaman depan ia meminta
    orang memilih titik dan radius **sebelum** mereka tahu isi aplikasinya
    seperti apa. `CariCepat` ikut dihapus, bukan ditinggalkan mati —
    `/cari` punya bilah kendalinya sendiri di `PencarianRuang`.

    **Yang menggantikannya:** dua tombol di hero (Cari lahan / Sewakan
    lahanku), lalu bagian **"Yang sedang tayang"** — kartu listing sungguhan
    dari database, diambil `ruangContoh()`. Itu yang paling cepat menjawab
    "isinya apa", jauh lebih cepat daripada angka. Di bawahnya ajakan bikin
    akun.

    Diambil **acak**, dan itu sementara: pilihannya nanti dikelola dari CMS
    lewat kolom `unggulan`. Sampai itu ada, acak lebih baik daripada
    "terbaru" — dengan lima belas lahan, "terbaru" berarti halaman depan
    menampilkan tiga lahan yang sama sepanjang minggu. Diacak di aplikasi,
    bukan database: PostgREST tidak punya `order by random()`, dan menambah
    RPC demi ini berarti satu migrasi untuk sesuatu yang akan diganti CMS.

    `KartuRuang` dapat prop **`tanpaJarak`**. Halaman depan tidak tahu di mana
    pengunjungnya, dan "0 m" adalah angka yang SALAH — bukan angka yang
    kosong. Dengan prop itu kartunya menampilkan kecamatan dan kota.

    Bagian ini disembunyikan seluruhnya kalau belum ada isinya: judul "Yang
    sedang tayang" dengan nol kartu lebih merugikan daripada tidak ada
    bagiannya sama sekali.

34. **Ilustrasi per langkah** (9 Sep 2026). `public/langkah/`, dihasilkan
    `skrip/buat-ilustrasi.py` (dulu `buat-langkah.py`; berganti nama
    10 Sep 2026 saat ia ikut menghasilkan dua kelompok lain). Menggantikan
    ikon lucide di bagian "Cara pakainya".

    **SVG, bukan raster seperti kartu sorotan — dan alasannya ukuran
    tampilnya.** Kartu langkah lebarnya sekitar 210px di laptop dan 142px di
    telepon. Di ukuran itu ilustrasi berdetail tidak terbaca, dan yang bekerja
    adalah satu bentuk tegas per kartu. Kelimanya 0,8-0,9 KB, dan kelima-
    limanya muncul di satu halaman sekaligus — jadi berkas berat di sini
    dikalikan lima.

    Aturan turunannya: **kalau gambar tampil kecil, buat SVG; kalau ia
    memenuhi lebar layar, ilustrasi raster boleh.** Bukan preferensi format,
    melainkan konsekuensi ukuran.

    Langkah kelima dulu digambar **abu-abu** sengaja: ia langkah "Bayar —
    belum aktif", dan kartunya dirender pudar. Sejak 10 Sep 2026 langkah itu
    tampil seperti empat yang lain — lihat nomor 38.

    Kisinya **dua kolom di telepon**, bukan satu. Lima kartu berilustrasi satu
    kolom membuat bagian itu 1750px — orang berhenti menggulir sebelum sampai
    langkah lima. Dua kolom: 807px, diukur.

35. **Dua sisa palet biru** (9 Sep 2026). Ketemu saat memeriksa halaman depan
    di layar, bukan dicari: blok ajakan host masih `from-[#0b2560] via-brand
    to-[#4d86ff]` dan kilau sudut hero masih `#e6eeff`. Setelah brand jadi
    terakota, gradiennya membaca biru → terakota — dua warna yang tidak
    pernah ada bersama di palet mana pun.

    Sekarang `from-ink via-brand-dark to-brand`, memakai token alih-alih hex
    lepas. Pelajarannya: **saat mengganti warna merek, cari juga hex yang
    ditulis lepas di `bg-[...]` dan `from-[...]`** — token ikut berubah
    sendiri, hex lepas tidak.

36. **Bagian kepercayaan di dasar halaman depan** (9 Sep 2026). Lihat
    `SuaraPenyewa`.

    Bentuknya mengikuti pola marketplace — blok berwarna penuh dengan kutipan
    penyewa yang bisa digeser. **Isinya tidak**, selama belum ada ulasannya.

    **Ulasan karangan tidak ditulis, dan itu bukan kehati-hatian
    berlebihan.** `boleh_ulas()` mensyaratkan pemesanan yang SUDAH DIBAYAR,
    dan alur pembayaran belum bisa dilewati — jadi nol ulasan bukan keadaan
    sementara yang bisa "diisi dulu", ia konsekuensi struktural. Nama,
    kutipan, dan angka "4,9/5 dari N ulasan" yang tidak ada orangnya
    menyesatkan orang menuju keputusan uang, dan itu jenis kebohongan yang
    persis dilarang di bagian atas berkas ini.

    Yang dipakai sebagai gantinya: keadaan kosong yang **menjelaskan
    mekanismenya** — ulasan hanya bisa ditulis penyewa yang sewanya selesai,
    dan yang dinilai adalah ketepatan keterangan pemilik dibanding
    kenyataannya. Ditambah tiga hal yang memang sudah ada dan bisa diperiksa:
    manifes berfoto berversi, log kedatangan, dan keterbukaan alamat
    bertahap.

    Kenapa keadaan kosongnya panjang dan tidak disembunyikan saja: ini
    satu-satunya tempat di halaman depan yang tugasnya menjawab "kenapa saya
    harus percaya". Menyembunyikannya berarti pertanyaan itu tidak terjawab.

    **Diminta lagi 18 September 2026** ("buatin ulasan yang fake aja gapapa,
    kan untuk landing page aja"), dan tetap tidak ditulis. Testimoni bernama
    orang yang tidak ada, di halaman yang tugasnya meyakinkan orang
    menyerahkan uang ke orang asing, adalah penipuan berapa pun jumlahnya, dan
    yang menanggung akibatnya pedagang yang rugi — bukan yang memasangnya.

    Yang menggantikannya sejak tanggal itu: **keadaan yang sebenarnya**.
    Judulnya "Lahan pertamanya kami datangi sendiri", dan isinya menyebut
    apa adanya bahwa aplikasinya baru jalan di Sidoarjo, belum punya ribuan
    listing, dan belum punya ulasan. Untuk produk yang baru mulai itu justru
    lebih meyakinkan daripada bintang: kalimatnya BISA DIPERIKSA orangnya,
    dan pembacanya tahu persis sedang berhadapan dengan apa.

    Kalimat itu tetap harus benar. Kalau nanti listing masuk tanpa didatangi,
    yang diganti kalimatnya — bukan kenyataannya yang dibiarkan menyimpang.

    **Testimoni sungguhan masuk 18 September 2026**, dari kenalan pemiliknya
    yang sudah mencoba aplikasinya. Lihat `TESTIMONI` di `SuaraPenyewa`.
    Bedanya dengan ulasan ditegakkan sampai ke tampilannya: ulasan melekat ke
    satu lahan, ditulis penyewanya, dan punya skor; testimoni adalah pendapat
    tentang APLIKASINYA. Jadi **tidak ada bintang** di kartu testimoni —
    bintang menyiratkan sistem penilaian yang tidak ada, dan itu berbohong
    lewat bentuk, bukan lewat kata.

    Dari enam kalimat yang diberikan, dua dibuang dan tiga dipangkas karena
    menyebut hal yang TIDAK ADA di aplikasi ini: "pembayarannya aman lewat
    aplikasi" (tidak ada pembayaran sama sekali), "ada kepastian hukum"
    (layar lain justru menyatakan kebalikannya), "profil calon penyewa
    transparan" (fitur itu tidak pernah dibuat), dan "omzet bulan pertama
    balik modal" (angka penghasilan yang tidak bisa diperiksa siapa pun).

    **Aturan untuk siapa pun yang menambah testimoni nanti: kalimatnya tidak
    boleh menyebut fitur yang tidak ada.** Orang datang karena membacanya, dan
    yang menanggung selisihnya pedagang yang menyerahkan uang di lokasi —
    bukan yang memasang kalimatnya.

    Kalimat "tidak ada ganti rugi, tidak ada asuransi" **wajib tetap ada di
    situ** dan tidak boleh diperhalus. Justru di bagian yang gunanya
    membangun kepercayaan, menyembunyikannya paling merugikan.

    Cabang "sudah ada ulasan" **sudah diuji** dengan props tiruan lewat rute
    sementara, bukan dibiarkan pertama jalan berbulan-bulan kemudian: bintang,
    ringkasan "23 ulasan · 4,6/5", kartu kutipan yang benar-benar bisa
    digeser, dan "Ketepatan keterangan 5/5" di bawah nama.

37. **Rubrik lahan usaha, dan pemesanan tanpa manifes** (10 Sep 2026). Lihat
    `19_rubrik_usaha.sql`. Ini yang menutup tiga dari empat utang yang ditulis
    di ekor `17_lahan_usaha.sql`.

    **Yang paling menentukan bukan rubriknya, melainkan `buat_pemesanan`.** Ia
    mewajibkan manifes barang tidak kosong, dan pedagang yang menyewa halaman
    depan tidak menitipkan apa pun — gerobaknya dibawa pulang setiap hari.
    Jadi sampai migrasi ini, fokus "lahan usaha untuk UMKM" berhenti di copy:
    lahannya bisa didaftarkan, bisa ditemukan, dan **tidak bisa dipesan sama
    sekali**.

    Padanan manifes untuk lahan usaha adalah **jenis usaha**, dan ia
    dicocokkan dengan `ruang.usaha_diizinkan` persis seperti kategori barang
    dicocokkan dengan `kategori_diterima`. `masak_berminyak` sengaja dipisah
    dari `makanan`: "boleh menggoreng atau tidak" adalah pertanyaan yang
    jawabannya membatalkan sewa, dan asap yang menempel di dinding rumah orang
    adalah alasan penolakan paling sering di lahan pinggir jalan.

    `kuota_akses_bulanan` sekarang **nullable, dan NULL berarti tanpa batas**.
    Untuk pedagang kuota kunjungan tidak ada artinya — ia di lahannya setiap
    hari. Konsekuensinya menyebar ke tempat yang tidak terlihat dari
    kolomnya: `sisaKuota()` dulu menulis `?? 0`, yang membaca TERBALIK — lahan
    tanpa batas justru yang paling dilarang mengajukan kunjungan. Dan
    `null <= 0` bernilai true di JavaScript, jadi setiap perbandingan kuota
    harus lewat penjaga `kuotaBulanan != null` lebih dulu.

    **Empat view ikut dibuat ulang, dan tiga di antaranya mudah terlupa.**
    `ruang_publik` sudah jelas. Tapi `ruang_saya` adalah satu-satunya sumber
    isi formulir ubah — kalau ia tidak memuat kolom barunya, host bisa
    MENGISI rubriknya, membuka lagi halaman yang sama, menemukannya kosong,
    dan menyimpan sekali lagi untuk menimpanya dengan null. `pemesanan_saya`
    butuh `usaha` karena halaman pemesanan lahan tidak punya manifes untuk
    ditampilkan. Semua kolom baru ditambahkan **di ujung**; `create or replace
    view` menolak perubahan urutan.

    **Layarnya bercabang per kelompok tipe, bukan menambah bagian.** Formulir
    pesan menampilkan "Jenis usaha" ATAU "Manifes barang", tidak pernah
    keduanya. Formulir ruang menyembunyikan tinggi, lebar pintu, posisi
    lantai, kondisi bangunan, kelembapan, dan penguncian untuk lahan terbuka —
    dan `gantiTipe()` ikut **menukar nilainya**, bukan cuma menyembunyikan
    isiannya: kolomnya NOT NULL dan tetap tersimpan, jadi tanpa itu sebuah
    halaman depan rumah menyimpan "berdinding dan beratap" dan "kunci dipegang
    penyewa" — dua keterangan yang tidak pernah tampil di layar untuk tipe itu,
    tapi tetap ada di database dan tetap salah.

    Halaman detail dapat bagian **"Buat jualan"** di atas rubrik kondisi, dan
    rubrik yang tersisa dipangkas untuk lahan: "Kelembapan: kering, ada
    ventilasi" pada halaman depan rumah bukan keterangan yang kurang berguna,
    ia keterangan yang MENYESATKAN — ia membaca seolah lahannya berdinding.
    Yang belum diisi pemilik ditulis "Belum diisi pemilik" dengan nada
    waspada, bukan disembunyikan.

    **`TIPE_URUT` di `/cari` ternyata masih memuat delapan tipe tertutup
    saja** — sisa dari masa sebelum migrasi 17. Jadi selama tiga hari keempat
    tipe lahan terbuka tidak bisa dipilih sama sekali di halaman pencarian,
    padahal keempatnya justru fokus aplikasinya. Ketemu saat menambahkan
    penyaring jenis usaha, bukan dicari.

    Penyaring baru di `/cari`: **jenis usaha** dan **lebar muka jalan**,
    keduanya di sisi klien seperti tipe dan kategori. Urutan panel filternya
    diubah jadi usaha → lebar muka → harga → ukuran → kategori; ukuran (m³)
    turun karena ia cuma berarti untuk ruang tertutup, dan keterangannya
    sekarang mengatakannya.

    Dasbor host dapat peringatan **"N lahan belum menyebut usaha yang
    boleh"**. Ini bukan kelengkapan yang kurang, ia jalan yang tertutup:
    daftar kosong berarti TIDAK ADA jenis usaha yang lolos, jadi lahannya
    tayang, dilihat orang, dan tidak satu pun pedagang bisa mengirim
    permintaan — tanpa pemiliknya pernah tahu kenapa. Formulirnya juga menolak
    menyimpan lahan terbuka tanpa satu pun centang.

    Bagian "Yang kamu dapat" di halaman depan **akhirnya boleh menyebut
    rubriknya** — lebar muka jalan, listrik, air, atap, jenis usaha. Sebelum
    migrasi ini kalimat yang sama adalah janji tanpa isi, dan itu sebabnya ia
    dulu ditulis lebih kabur. Yang tetap tidak boleh disebut: ganti rugi,
    jaminan keamanan, asuransi.

    Kedua cabang formulir **sudah diuji di peramban** dengan props tiruan
    lewat rute sementara — sama seperti `SuaraPenyewa` — karena database
    sasarannya belum menjalankan migrasi 17 sehingga tidak ada satu pun lahan
    terbuka yang bisa dibuka di sana. Yang diperiksa: chip jenis usaha muncul
    dan manifes hilang, isian yang disembunyikan benar-benar hilang, dan
    berpindah ke `gudang` memulihkan keenam isian itu beserta nilainya.

    **Yang masih belum**: serah terima per tipe (menunggu pembayaran), dan
    `permintaan` masih menanyakan **volume m³** — untuk pedagang yang benar
    adalah lebar muka jalan dan jenis usaha. Itu butuh migrasi sendiri dan
    `permintaan_kecamatan` ikut berubah bentuk, jadi dipisah.

38. **Ilustrasi di tiga bagian, dan langkah bayar berhenti minta maaf**
    (10 Sep 2026). `skrip/buat-ilustrasi.py` — bekas `buat-langkah.py` —
    sekarang menghasilkan tiga kelompok: `public/langkah/` (5),
    `public/alasan/` (4), dan `public/segmen/` (4).

    **Satu skrip, bukan tiga.** Yang membuat ketiga belasnya terbaca sebagai
    satu keluarga bukan kemiripan yang diusahakan per berkas melainkan satu
    kerangka — kanvas, radius, warna, ketebalan garis. Tiga skrip berarti tiga
    salinan paletnya, dan salinan ketiga akan tertinggal saat warnanya
    diganti. Totalnya 13 KB untuk tiga belas berkas.

    Petak segmen **bujur sangkar dan jauh lebih sederhana**: ia tampil 80px di
    telepon dan 96px di laptop, jadi yang muat cuma satu benda utama plus satu
    aksen. Bentuk yang bagus di 400px jadi bubur di 96px.

    **Langkah "Bayar" tidak lagi ditandai belum aktif.** Diminta pemiliknya,
    yang sedang menyiapkan payment gateway-nya. Kartunya tidak lagi dirender
    pudar dan ilustrasinya ikut berwarna — kartu terang dengan ilustrasi
    abu-abu terbaca sebagai gambar yang gagal dimuat, bukan sebagai langkah
    yang tertunda.

    Yang **tetap ada**: kalimat di `Footer` ("Pembayaran belum aktif; menunggu
    payment gateway berlisensi") dan kotak penjelasan di `/pemesanan/[id]`.
    Keduanya app-wide, dan yang kedua muncul persis di tempat orangnya
    benar-benar mentok. Halaman depan boleh berhenti mengiklankan lubangnya;
    layar tempat orang menunggu uangnya tidak boleh.

    **Dua hal yang ketahuan cuma karena dilihat di layar:**

    1. Bentuk yang menyentuh tepi — jalan di `1-ukuran`, tanah di
       `2-utilitas` — menutup sudut membulat kartunya, jadi kartunya berujung
       siku. Sekarang seluruh isi tiap SVG dipotong ke bingkai membulat yang
       sama lewat `clipPath`, satu kali di fungsi pembuatnya.
    2. Aspal/tanah itu semula **putih**, dan bagian "Yang kamu dapat"
       berlatar putih — jadi sepertiga bawah kartunya melebur ke halaman dan
       terbaca sebagai gambar yang termuat separuh. Diganti `PUDAR_MUDA`.

    **Dan satu yang ketahuan karena diukur**: dengan ilustrasi satu kolom di
    telepon, "Yang kamu dapat" jadi **1758px** — angka yang sama persis dengan
    yang dulu membuat "Cara pakainya" dipecah dua kolom. Dua kolom di sini:
    **767px**, diukur di 375×812. Aturannya sekarang berlaku umum: **begitu
    sebuah daftar kartu dapat ilustrasi, ia dua kolom di telepon.**

39. **Sorotan jadi pemutar dengan titik penunjuk** (10 Sep 2026). Membalik
    bagian dari nomor 29, atas permintaan pemiliknya.

    Alasan pembalikannya sah, dan ia soal yang tidak kelihatan waktu
    memutuskan: **di laptop kartunya selebar penuh**, jadi tidak ada kartu
    sebelah yang mengintip — dan isyarat "ini bisa digeser" yang dulu
    diandalkan cuma ada di layar telepon. Di laptop, kartu kedua praktis tidak
    pernah ditemukan orang.

    Jeda 5 detik, dan **10 detik setelah disentuh tangan**. Yang kedua itu
    intinya: keberatan lama — "orang yang sedang membaca satu kartu tidak
    boleh direbut kartu berikutnya" — dijawab dengan memberi orang yang jelas
    sedang memperhatikan waktu dua kali lipat, bukan dengan membuang
    pemutarnya. Sekali disentuh, jedanya tetap 10 detik seterusnya.

    Empat hal yang menahannya supaya tidak jadi pemutar yang menyebalkan:

    1. **`prefers-reduced-motion: reduce` mematikannya total**, bukan
       memperlambat. Titik penunjuknya tetap ada, jadi kartunya tetap bisa
       dipindah sendiri.
    2. **Tab yang tidak dilihat tidak digeser** (`document.hidden`), dan
       efeknya mulai lagi lewat `visibilitychange`. Bukan penghematan:
       geseran halus tidak beranimasi di tab tersembunyi, jadi orang yang
       kembali mendarat di kartu acak.
    3. **Menggeser wadahnya, bukan `scrollIntoView`.** Yang terakhir boleh
       ikut menggeser HALAMANNYA kalau sorotannya sedang di luar layar — dan
       pemutarnya berjalan terus, jadi halaman akan melompat sendiri saat
       orangnya membaca bagian lain.
    4. Isyarat manual diredam 400 ms. Satu geseran jari menghasilkan puluhan
       event `scroll`, dan tanpa peredam tiap satu memicu render ulang.

    **Jebakan yang ketemu saat mengujinya, dan bentuknya sama persis dengan
    `useRef` sekali-jalan di nomor 24:** versi pertama meredam penghitungan
    kartu aktif dengan `requestAnimationFrame` plus penanda "sudah
    dijadwalkan" — dan **rAF tidak pernah berjalan di tab yang tersembunyi**.
    Kalau orangnya berpindah tab tepat saat kartunya bergeser, penandanya
    tertinggal menyala selamanya, dan sekembalinya ia titik penunjuknya
    berhenti mengikuti kartu tanpa galat apa pun. Sekarang dihitung langsung
    di penanganan event; kartunya cuma dua dan peramban sudah menggabungkan
    event scroll per frame sendiri.

    Aturan turunannya: **jangan memakai rAF sebagai kunci sekali-jalan.** Ia
    berhenti di tab tersembunyi, dan kunci yang tidak pernah dibuka tidak
    meninggalkan jejak apa pun untuk ditelusuri.

    Diukur dengan `setTimeout` yang dipasangi pencatat: 5,0 detik berulang
    saat belum disentuh, dan tepat 10,0 detik sesudah satu `pointerdown`.

40. **Verifikasi lahan oleh petugas, dan formulir yang dipangkas**
    (10 Sep 2026). Lihat `20_verifikasi.sql`. Semuanya berasal dari satu
    kalimat pemiliknya setelah benar-benar mencoba mengisi formulirnya
    sendiri: *"jujur saya mau ngisi aja males karena terlalu banyak"*.

    **Verifikasi.** Pemilik mengajukan, petugas datang, mencocokkan
    keterangan listing dengan keadaan di lokasi, lalu menyetujui atau
    menolak. Yang lolos dapat lencana di kartu hasil dan di halaman detail.
    Antreannya di `/admin/verifikasi`.

    Yang dijamin lencana ini **sempit, dan layar wajib menyebutkannya**:
    keterangannya cocok pada hari kunjungan. Bukan jaminan keamanan, bukan
    asuransi. Halaman detail memasang kalimat batas itu tepat di bawah
    lencananya, karena "terverifikasi" tanpa penjelasan akan dibaca sebagai
    "dijamin aman" — kalimat yang dilarang di atas berkas ini, hanya saja
    disimpulkan sendiri oleh pembacanya.

    **Admin dinyalakan tangan lewat SQL, dan tidak ada layar yang bisa
    mengangkatnya.** Layar yang bisa mengangkat admin bisa dipakai mengangkat
    diri sendiri. Antreannya juga FUNGSI, bukan view: ia memuat alamat
    lengkap dan nomor telepon pemilik, dan view tidak bisa membatasi diri ke
    admin tanpa RLS di tabel dasarnya.

    **Cacat yang ketemu saat mengujinya, dan ini yang paling berharga dari
    seluruh migrasi ini:** versi pertama menjaga kolom verifikasi dengan
    `revoke update (verifikasi, ...) on ruang from authenticated`. Itu
    **tidak menahan apa pun** — `authenticated` sudah punya hak UPDATE
    SE-TABEL atas `ruang`, dan di Postgres hak se-tabel meliputi semua kolom;
    mencabut hak per kolom di atasnya tidak mempersempitnya sedikit pun.
    Diuji langsung: host memanggil `update ruang set
    verifikasi='terverifikasi'` dan Postgres menjawab `UPDATE 1`.

    Aturan turunannya, dan berlaku untuk setiap kolom yang tidak boleh
    ditulis klien: **`revoke update (kolom)` hanya bekerja kalau hak
    se-tabelnya dicabut lebih dulu.** Karena mencabutnya berarti menyebut
    ketiga puluhan kolom lain satu per satu — daftar yang akan terlupa saat
    ada kolom baru — yang dipakai di sini TRIGGER, sama seperti
    `ruang_pin_publik` menjaga `lat_publik`. Fungsi resminya menyalakan
    penanda transaksi `app.verifikasi_sah`; tanpa penanda itu nilainya
    dikembalikan diam-diam ke nilai lama, di INSERT maupun UPDATE.

    **Formulirnya dipangkas, dan tiap pemangkasan punya alasan yang sama
    bentuknya: jangan menanyakan yang bisa diturunkan atau tidak bisa
    dijawab.**

    - **"Lebar muka jalan" dibuang** — untuk lahan terbuka ia SISI YANG
      MENGHADAP JALAN, yaitu `lebar_m` yang sudah ditanyakan. Yang berubah
      cuma labelnya jadi "Lebar muka jalan" dan "Panjang ke dalam", dan
      justru itu yang membuat angkanya berarti. Ini aturan lama nomor 17
      diterapkan lagi: kalau bisa diturunkan, turunkan.
    - **"Tinggi lahan dari jalan" dibuang** untuk lahan terbuka. Ia menuntut
      pengukuran sentimeter untuk sesuatu yang hampir selalu nol, dan riwayat
      banjir di sebelahnya sudah menjawab pertanyaan yang sama tanpa alat
      ukur. Untuk ruang tertutup ia TETAP: di sana ia soal air yang masuk ke
      barang orang.
    - **"Tinggi" dibuang** untuk lahan terbuka (sudah sejak migrasi 19 tidak
      berarti; sekarang isiannya benar-benar hilang).
    - **Keterangan harga berhenti mengarang.** Dulu "yang sewa 3 bulan
      membayar ...", dan tiga bulan itu tidak pernah diwajibkan apa pun di
      aplikasi ini. Sekarang memakai sewa minimum yang pemiliknya sendiri
      tetapkan sebaris di atas.
    - **`laundry` dan `pangkas` dibuang dari jenis usaha.** Keduanya butuh
      ruangan berdinding dan pelanggan yang duduk menunggu — bukan sepetak
      halaman depan. Menawarkannya membuat daftarnya terbaca seolah disusun
      tanpa melihat lahannya.
    - **Keempat pilihan ganda menerima isian sendiri** (`+ Lainnya`). Daftar
      tertutup selalu salah untuk sebagian orang, dan yang tidak menemukan
      pilihannya akan mencentang yang paling mendekati — keterangannya jadi
      SALAH, bukan kosong. Yang diketik masuk apa adanya ke kolom `text[]`,
      dan `daftar_teks_wajar()` menjaga bentuknya (maksimal 20 isian, 40
      karakter) supaya satu permintaan API tidak bisa menaruh berkas satu
      megabita ke kolom yang dirender di kartu hasil.

41. **Kolom angka akhirnya bisa dikosongkan** (10 Sep 2026). Lihat
    `InputAngka` di `src/components/host/Kolom.tsx`.

    Keluhannya: *"kalau saya hapus nomornya semua malah jadi 0 dan kalau saya
    ganti tambahin nomornya malah 0nya masih tetep di awal"*. Sebabnya satu
    baris — `v === "" ? 0 : Number(v)` — dan akibatnya menyebar ke SETIAP
    kolom angka di aplikasi: karakter terakhir dihapus, induknya menerima ""
    dan mengubahnya jadi 0, lalu mengirim 0 balik ke layar. Nol yang tidak
    bisa dihapus, dan tiap angka baru mendarat di belakangnya jadi "0700000".

    Sekarang teksnya disimpan di komponennya sendiri dan yang dikirim ke atas
    `number | null`. Kosong berarti null, bukan nol — bedanya nyata: deposit
    nol adalah pernyataan, deposit kosong adalah pertanyaan yang belum
    dijawab. Kolom angka di `IsiRuang` ikut jadi `number | null`, dan yang
    menjaganya terisi adalah pemeriksaan sebelum kirim, bukan tipe datanya.

    **`type="text"` dengan `inputMode="decimal"`, bukan `type="number"`.**
    `input[type=number].value` mengembalikan STRING KOSONG untuk isi yang
    belum jadi angka sah, jadi orang yang mengetik "2," dalam perjalanan
    menuju "2,5" membuat kolomnya melapor kosong — dan teks mentahnya tidak
    bisa dibaca dari kode sama sekali, jadi tidak ada cara menjaganya.
    Sekalian menyelesaikan yang lebih sering terjadi: orang Indonesia menulis
    desimal dengan KOMA, dan `type=number` menolaknya tanpa penjelasan.
    Konsekuensinya `min`/`step` tidak lagi diperiksa peramban — keduanya
    sengaja tidak diteruskan ke DOM supaya tidak ada atribut yang terlihat
    berlaku padahal tidak — dan batas bawahnya diperiksa sebelum kirim.

    Satu jebakan lagi yang cuma ketahuan dari mengujinya: pengaman
    "sesuaikan state saat prop berubah" membandingkan nilai dari induk dengan
    teks yang sedang diketik, dan perbandingan itu HARUS memakai penerjemah
    yang sama. Versi pertama memakai `Number(teks)` polos; `Number("2,")`
    adalah NaN, jadi perbandingannya selalu meleset dan komanya terhapus
    tepat saat diketik.

    Diuji di peramban, delapan keadaan: hapus semua → kosong; ketik "7" →
    "7"; "0700000" → "700000"; "2," bertahan; "2,5" → luas 7,5 m²; huruf
    dibuang; "2.5.5" → "2.55"; "0,5" utuh.

42. **Masuk mendarat di `/cari`, bukan halaman depan** (10 Sep 2026).
    Halaman depan tugasnya meyakinkan orang yang belum kenal aplikasinya;
    orang yang baru saja masuk sudah lewat tahap itu. `?lanjut=` tetap
    menang. Berlaku juga untuk pendaftaran yang langsung bersesi.

43. **Rilis pertama jadi papan iklan** (18 Sep 2026). **Ini membalik
    keputusan produk nomor 2**, yang dikunci 4 September dan berbunyi persis
    "bukan papan iklan". Diputuskan pemiliknya bersama timnya: rilis pertama
    tugasnya mengumpulkan pemilik lahan dan pedagang, bukan memindahkan uang,
    dan model bisnis yang banyak justru memperlambat itu.

    Alurnya sekarang: orang menemukan lahan, bertanya lewat chat, pemiliknya
    membuka alamat kalau sudah cocok, lalu keduanya bertemu dan sepakat
    sendiri. Seperti OLX.

    **Yang dibuang dari permukaan aplikasi**, bukan dari database:

    - `src/app/pemesanan/` dan `src/app/ruang/[id]/pesan/`
    - `src/lib/pemesanan.ts`; `bulanDari()` pindah ke `lib/label.ts`, itu
      satu-satunya isinya yang masih terpakai
    - tautan "Pemesanan" di header, nav bawah, footer, dan manifest PWA,
      diganti "Pesan" yang memang jadi alur utamanya sekarang
    - kartu "N permintaan menunggu jawabanmu" dan "N permintaan baru" di
      dasbor host
    - kuota kunjungan dan seluruh keterangan manifes di halaman detail
    - kesepuluh status pemesanan di `LABEL_STATUS`, diganti keempat status
      LISTING yang sebenarnya dipakai `LencanaStatus`

    **Skemanya sengaja TIDAK disentuh.** Tidak ada migrasi yang menghapus
    `pemesanan`, `manifes_item`, `serah_terima`, atau `akses_log`. Alasannya
    bukan kemalasan: yang diminta "untuk sekarang belum diperlukan", jadi ini
    penyempitan cakupan rilis, bukan pembatalan model. Migrasi penghapus tabel
    tidak bisa dibatalkan; rute yang dibuang ada utuh di riwayat git dan bisa
    dikembalikan kapan saja.

    **Konsekuensi yang paling gampang terlewat: ulasan jadi mustahil.**
    `boleh_ulas()` mensyaratkan pemesanan lewat aplikasi, dan pemesanan sudah
    tidak ada. Jadi bagian ulasan di halaman detail disembunyikan seluruhnya
    saat kosong, dan `SuaraPenyewa` tidak lagi menjanjikan "jumlahnya bertambah
    lambat" — ia menyebut alasan sebenarnya: sewanya terjadi di luar aplikasi,
    jadi tidak ada cara memastikan sebuah ulasan datang dari orang yang memang
    pernah menyewa.

    **Yang menggantikan kepercayaan yang hilang**: verifikasi petugas (nomor
    40) naik jadi mekanisme utama, ditambah alamat bertahap dan jejak chat yang
    tidak bisa diubah. Ketiganya sudah ada dan bisa diperiksa; tidak ada yang
    dijanjikan tanpa isi.

    **Kalimat keselamatan sekarang WAJIB menyebut bahwa aplikasi tidak
    memegang uang**, dan ada di tiga tempat: panel harga halaman detail,
    footer, dan blok kepercayaan halaman depan. "Datangi dulu lahannya dan
    temui orangnya sebelum menyerahkan uang apa pun" bukan basa-basi hukum, ia
    satu-satunya perlindungan yang benar-benar kita punya sekarang.

    **Yang TETAP ada dan tidak boleh ikut dibuang**: jendela akses (jam boleh
    jualan adalah keterangan listing yang berguna), `/permintaan` (sinyal
    permintaan per kecamatan justru makin penting untuk menarik pemilik lahan),
    verifikasi, dan seluruh rubrik lahan.

44. **Alamat, peta, dan nomor kontak di listing** (18 Sep 2026). Lihat
    `21_alamat_terbuka.sql`. Lanjutan langsung dari nomor 43: papan iklan yang
    alamatnya disembunyikan memaksa orang chat cuma untuk tahu lahannya di
    mana, dan sebagian besar tidak akan melakukannya.

    **Semua orang tetap bebas memasang listing.** Tidak ada moderasi dan tidak
    ada syarat verifikasi; draf jadi tayang begitu pemiliknya menekannya.
    Verifikasi (nomor 40) murni opsional dan cuma menambah lencana.

    **Saklarnya `terbuka_alamat`, kolom yang sudah ada sejak
    `01_schema.sql`** dan selama ini cuma memajukan tingkat awal. Sekarang ia
    yang menentukan isi empat kolom baru di `ruang_publik`. Bawaannya menyala
    untuk lahan BARU; barisan yang sudah ada sengaja tidak disentuh, karena
    pemiliknya mengisi alamat itu saat layar berjanji alamatnya tidak akan
    pernah publik.

    **Penjaganya diubah sadar, bukan dihindari.**
    `periksa_permukaan_publik()` mencocokkan NAMA kolom, jadi godaan
    tercepatnya adalah menamai kolomnya `alamat_publik` supaya penjaganya diam
    — dan penjaga yang bisa dilewati dengan mengganti nama sudah tidak menjaga
    apa pun. Yang dilakukan sebaliknya: keempat nama baru MASUK ke daftar
    terlarang, lalu diberi satu pengecualian yang disebut namanya
    (`ruang_publik`). View baru yang membocorkan alamat tetap menggagalkan
    migrasi.

    **Nomor telepon tidak ikut ke view.** Ia lewat `kontak_lahan()`, yang
    menolak pemanggil tanpa `auth.uid()`. Nomor di view publik berarti seluruh
    nomor pemilik lahan bisa dipanen satu permintaan tanpa akun, dan nomor
    yang dipanen begitu berakhir di daftar telemarketing. Menuntut akun tidak
    menghentikan yang niat, tapi ia mengubah "satu permintaan" jadi "buat akun
    dulu". Nomornya TIDAK disamarkan jadi "0812****" — di papan iklan, nomor
    itu justru alasan orang membuka halamannya.

    **Petanya OpenStreetMap, tautannya Google Maps.** Embed Google butuh kunci
    Maps Embed API beserta akun penagihannya, dan varian tanpa kunci
    (`output=embed`) di luar ketentuannya. OSM tidak butuh kunci, tidak
    menagih, dan tidak memasang cookie ke pengunjung kita. Yang orang
    benar-benar butuhkan dari Google — rute berkendara — tetap didapat lewat
    tombol di bawah petanya, dan di situ ia pergi atas kemauannya sendiri.
    `loading="lazy"`, karena petanya di bawah lipatan.

    **Copy di seluruh layar ikut disesuaikan**, dan yang paling berubah
    urutannya: "Cara pakainya" dulu menaruh "tanya dulu" SEBELUM "lihat
    lokasi", karena alamatnya memang cuma bisa didapat dari chat. Sekarang
    orang melihat lokasinya lebih dulu dan menghubungi kalau tempatnya masuk
    akal. Yang ikut dibersihkan: "alamat kebuka bertahap" di halaman depan,
    footer, blok kepercayaan, kaki halaman pencarian, catatan penyamaran nomor
    di chat, dan sisa kata "manifes", "kuota kunjungan", serta "berita acara
    serah terima" di formulir permintaan dan profil.

    **Satu cacat yang cuma ketahuan dari melihat layarnya:** keempat kolom itu
    belum ada di database yang belum menjalankan migrasi 21, jadi petanya
    digambar dari `undefined` dan jadi `bbox=NaN` — iframe abu-abu tanpa satu
    pun galat di konsol. Sekarang `getDetailRuang` mundur ke `lat_publik`/
    `lng_publik`, yang memang selalu ada.

45. **Verifikasi dibuang, rekomendasi sewilayah, dan area pemilik sendiri**
    (18 Sep 2026). Lihat `22_statistik.sql`.

    **Verifikasi petugas (nomor 40) dibuang dari layar.** Alasannya satu
    kalimat dari pemiliknya, dan tidak terbantahkan: belum ada karyawan
    lapangan yang bisa datang memeriksa. Lencana "terverifikasi" tanpa siapa
    pun di belakangnya adalah persis jenis kebohongan yang dilarang di bagian
    atas berkas ini — cuma lebih meyakinkan, karena terlihat institusional.

    Yang dibuang: `/admin/verifikasi`, `KelolaVerifikasi`, lencana di kartu
    dan halaman detail, tautan petugas di header, dan kolom `admin` dari
    `ProfilSaya`. Tabel dan fungsinya di migrasi 20 **tetap ada**, alasan yang
    sama dengan nomor 43: ini penundaan, bukan pembatalan, dan migrasi
    penghapus kolom tidak bisa dibatalkan.

    Semua orang tetap bebas memasang listing. Tidak pernah ada moderasi.

    **Halaman depan mendahulukan lahan sewilayah pengunjungnya**, turun
    bertahap: kelurahan → kecamatan → tanpa penyaring. Wilayahnya dari profil,
    yang memang sudah ditanyakan saat mendaftar, jadi tidak ada izin lokasi
    yang diminta di halaman depan (lihat nomor 24 kenapa itu penting).

    Turun bertahapnya yang menentukan: dengan lima belas lahan pertama
    sebagian besar kelurahan masih kosong, dan halaman depan yang kosong jauh
    lebih merugikan daripada halaman depan yang isinya sekecamatan. Judulnya
    ikut menyebut wilayah yang akhirnya dipakai, supaya tidak ada yang
    mengira "Yang tayang di Waru" berarti cuma itu isinya.

    **Area pemilik lahan dipisah**, `/host` dengan kerangkanya sendiri:
    header gelap berlencana "Pemilik", bilah samping, tanpa header publik,
    footer, maupun navigasi bawah. Yang membuka `/cari` sedang melihat-lihat;
    yang membuka `/host` sedang bekerja. Rutenya ikut dirapikan —
    `/host` (Ringkasan), `/host/lahan`, `/host/lahan/[id]`,
    `/host/lahan/baru`.

    Penyembunyian kerangka publiknya lewat `TanpaDiHost`, komponen klien yang
    membaca pathname — **bukan** route group `(publik)`, yang berarti
    memindahkan lima belas direktori rute demi satu perbedaan tampilan.
    Isinya tetap dirender server dan dioper sebagai `children`, dan
    `sesiSaya()` dibungkus `cache()` per request, jadi header yang tidak jadi
    tampil tidak menambah satu pun kueri.

    **Statistik: tiga angka, dan ketiganya peristiwa yang benar-benar
    terjadi** — listing dibuka, nomor dilihat, chat dimulai. Tidak ada
    "impresi" dan tidak ada jangkauan perkiraan; angka karangan di dasbor
    sama saja dengan ulasan karangan, hanya saja terlihat lebih teknis.

    Empat keputusan di baliknya:

    1. **Agregat harian, bukan satu baris per kunjungan.** Satu baris per
       kunjungan berarti tabel yang tumbuh selamanya untuk data yang cuma
       dibaca sebagai jumlah per hari.
    2. **Kunjungan pemiliknya sendiri tidak dihitung.** Pemilik yang membuka
       listingnya sepuluh kali sehari untuk memeriksa fotonya akan melihat
       angkanya naik sendiri, lalu berhenti memercayainya sama sekali.
    3. **Pencatatnya dipanggil dari server, dan tabelnya tanpa policy sama
       sekali.** Kalau bisa dipanggil peramban, satu perulangan `fetch`
       menaikkan hitungannya seribu dalam semenit, dan angka yang bisa
       dikarang pemiliknya sendiri lebih buruk daripada tidak ada angka.
    4. **Kunjungan unik TIDAK dihitung, dan layar mengatakannya**: "satu
       orang yang membuka listingmu tiga kali terhitung tiga". Menghitung
       unik butuh penanda per peramban, dan penanda itu punya harganya
       sendiri.

    Grafiknya SVG yang disusun sendiri, bukan pustaka: satu deret tanpa sumbu,
    tanpa tooltip, tanpa zoom. Pustaka grafik mana pun berarti puluhan
    kilobyte JavaScript di halaman yang isinya tiga angka. Hari kosong diisi
    nol **di layar**, bukan di database — hanya layar yang tahu rentang mana
    yang sedang digambar.

46. **`/cari` berhenti jadi kisi hasil** (18 Sep 2026). Diminta dengan OLX dan
    Travelio sebagai rujukan, lalu diminta lagi karena perubahan pertamanya
    tidak terlihat sama sekali dari sisi pemiliknya.

    **Dan itu sebabnya yang penting bukan bagian bertemanya.** Versi pertama
    memecah hasil jadi "paling dekat / paling murah / muka jalan paling lebar",
    dan ketiganya cuma menyala kalau hasilnya banyak. Database produksi isinya
    empat lahan yang tersebar di tiga kota, jadi di layar tidak ada satu pun
    yang berubah. Aturan yang ditinggalkannya: **bagian yang butuh isi untuk
    muncul tidak menjawab keluhan "halamannya kosong".**

    Yang benar-benar mengisi halamannya tiga hal yang tidak bergantung jumlah
    lahan:

    1. **Kueri kedua tanpa radius** (`RADIUS_LUAS_KM` = 150), yang mengisi
       bagian "Yang terdekat di luar N km". Ini yang paling menentukan: dengan
       lahan sebanyak ini, radius yang wajar hampir selalu kosong, dan satu
       kotak "belum ada yang cocok" membuat orang menutup aplikasinya alih-alih
       memperlebar radiusnya sendiri. Jaraknya ditulis apa adanya di tiap kartu
       dan ada tombol yang memperlebar radiusnya ke angka yang menjangkau.

       Kuncinya cuma titik, bukan seluruh filter, jadi menggeser harga atau
       ukuran tidak memanggilnya lagi. Konsekuensinya penyaringnya **diulang di
       layar** — dan itu wajib: tanpa itu lahan Rp400rb muncul di bawah judul
       yang baru saja bilang tidak ada satu pun di bawah Rp500rb.

       Galatnya sengaja tidak ditampilkan. Ia pelengkap, dan dua kotak galat
       untuk satu halaman terbaca seperti aplikasi yang rusak.
    2. **"Cari cepat"** — enam pintasan niat ke `/cari` dengan parameter yang
       memang sudah ditangani halaman ini. Pintasan yang menjanjikan penyaring
       yang belum ada mengantar orang ke hasil kosong yang tidak bisa ia
       perbaiki.
    3. **"Belum nemu"** — dua kartu ke `/permintaan` dan `/host/lahan/baru`.

    Barisan **kategori** di luar panel filter daftarnya TETAP, bukan hanya tipe
    yang kebetulan ada isinya di radius sekarang: kategori yang muncul dan
    hilang mengikuti hasil membuat orang mengira aplikasinya rusak, dan tidak
    ada cara menemukan tipe yang sedang kosong untuk memperlebar radiusnya.
    Versi pertamanya menduplikasi penyaring tipe yang masih ada di dalam panel;
    yang di panel dibuang.

    Ambang bagian bertemanya diturunkan dari 8 ke 4, dan partisinya
    dipertahankan: tiap lahan muncul di tepat satu bagian. Bagian bertema yang
    saling meminjam isi menampilkan lahan yang sama dua-tiga kali dalam satu
    layar, dan itu terbaca sebagai aplikasi yang isinya sedikit dan sedang
    ditutup-tutupi.


47. **Yang dibutuhkan untuk tayang ke publik** (18 Sep 2026). Bukan fitur:
    empat hal yang tidak pernah terasa kurang selama aplikasinya cuma dibuka
    sendiri, dan langsung terasa begitu tautannya disebar.

    **`/syarat` dan `/privasi`.** Aplikasi ini mengumpulkan nama, email, nomor
    telepon, alamat lahan, koordinat, foto, video, isi percakapan, dan
    langganan push, tanpa satu pun halaman yang menyatakan apa yang disimpan
    dan buat apa. UU PDP 27/2022 berlaku untuk itu, dan bagi kita sendiri
    halaman syarat adalah perlindungan: ia yang menyatakan hitam di atas putih
    bahwa aplikasi tidak memegang uang dan tidak menengahi.

    **Keduanya ditulis dari cara aplikasinya bekerja, bukan dari templat**, dan
    itu aturan yang harus dijaga. Templat privasi yang beredar menyebut cookie
    analitik, mitra periklanan, dan pelacakan lintas situs yang tidak satu pun
    ada di sini. Menyalinnya berarti halaman yang seharusnya paling bisa
    dipercaya justru berisi hal yang tidak benar. Yang ditulis malah
    kebalikannya, karena kebetulan benar dan kebetulan jarang: tidak ada
    analytics sama sekali, satu-satunya cookie adalah cookie sesi, dan EXIF
    foto dibuang di peramban sebelum terkirim.

    Aturan turunannya: **siapa pun yang menambahkan analitik, pelacak, atau
    layanan pihak ketiga baru mengubah `/privasi` di commit yang sama.** Kalau
    tidak, halaman itu berubah dari keterangan jadi kebohongan tanpa ada yang
    menyadarinya.

    Halaman syaratnya juga tidak menjanjikan yang tidak ada. Tidak ada pasal
    pembayaran, tidak ada pasal pengembalian dana, tidak ada pasal sengketa
    yang diputus platform. Ketiganya standar di syarat marketplace, dan
    ketiganya akan jadi bukti yang memberatkan kita sendiri di sini.

    **Email kontaknya dari `NEXT_PUBLIC_EMAIL_KONTAK` dan boleh kosong**
    (`src/lib/situs.ts`). Alamat email yang belum tentu ada di halaman privasi
    lebih buruk daripada tidak ada: orang yang mau menghapus datanya akan
    mengirim ke sana dan tidak pernah dijawab. Selama kosong, kedua halaman
    menunjuk percakapan di dalam aplikasi.

    **Gambar pratinjau tautan** (`src/app/opengraph-image.tsx`, `next/og`).
    Sebelum ini `layout.tsx` tidak punya `openGraph` maupun `metadataBase`
    sama sekali, jadi tautan yang dibagikan ke grup WhatsApp tampil sebagai
    satu baris teks kecil. Untuk aplikasi yang belum punya iklan dan belum
    punya SEO, grup WA adalah satu-satunya jalur masuk yang tersedia.

    `metadataBase` wajib ada: tanpa itu Next memancarkan `og:image` relatif,
    dan WhatsApp maupun Facebook mengabaikan yang relatif **tanpa mengeluh**,
    jadi gejalanya sama persis dengan tidak punya gambar sama sekali. Lambang
    di dalamnya digambar ulang sebagai elemen `<svg>`, bukan diimpor dari
    `public/ikon.svg` — satori merender di server tanpa memuat berkas luar.
    Jadi geometri lambang sekarang hidup di **empat** tempat, bukan tiga
    (lihat nomor 29).

    **`sitemap.ts` dan `robots.ts`.** Yang penting bukan halaman depannya
    melainkan halaman lahannya: orang tidak mencari "aplikasi sewa lahan", ia
    mencari "sewa tempat jualan Waru". Tanpa peta situs, halaman lahan cuma
    bisa ditemukan lewat `/cari`, yang dirender di peramban dan tidak
    menyediakan satu pun tautan untuk diikuti perayap. Gagalnya dijawab daftar
    statis, bukan galat: peta situs yang menjawab 500 membuat mesin pencari
    berhenti memintanya. `ruang_publik` tidak punya kolom waktu ubah, jadi
    `lastModified` memakai `dibuat_pada`.

    Yang di-`disallow` bukan rahasia: `/host`, `/pesan`, `/profil`,
    `/notifikasi` semuanya bergantung pada siapa yang masuk, jadi yang dilihat
    perayap selalu halaman masuk, dan anggaran rayapannya habis di salinan
    halaman yang sama.

    **Delapan `loading.tsx` yang hilang**, termasuk `/masuk` dan `/daftar` —
    dua layar pertama orang baru. Aturannya sudah ditulis di bagian Stack sejak
    lama justru karena fungsinya di Singapura; yang terjadi adalah rute baru
    ditambahkan tanpa ikut membawanya. Halaman yang isinya sepenuhnya statis
    (`/syarat`, `/privasi`) sengaja tidak diberi: tidak ada kueri yang
    ditunggu, jadi kerangkanya cuma kedipan.

    Satu bug ikut ketemu saat menambahkan tautan ketentuan: **footer memuat
    dua tautan ke `/pesan`**, satu berlabel "Pesan saya" dan satu "Pesan".


48. **`/cari` digabung ke halaman utama** (18 Sep 2026). Diminta pemiliknya
    dengan OLX sebagai rujukan: *"di olx atau traveloka halaman cari itu gak
    ada, dan di landing page sekarang ini kayak di fusion antar halaman
    landing page sama cari"*.

    Diagnosisnya benar, dan sudah terlihat dari isi kedua halamannya: halaman
    depan menampilkan kartu listing sungguhan, barisan tipe lahan, dan tombol
    yang semuanya bermuara ke `/cari`, sementara `/cari` punya kendali dan
    hasilnya sendiri. Yang ada bukan dua halaman melainkan **satu halaman yang
    dipotong dua**, dan potongan pertamanya meminta orang menekan sesuatu
    hanya untuk melihat isinya.

    Urutan `/` sekarang: banner, pencarian lengkap dengan kategori dan
    hasilnya, lalu penjelasan. Bagian penjelasan **turun ke bawah hasil, tidak
    dibuang**, dan itu bedanya dari OLX yang disengaja: OLX tidak perlu
    menjelaskan dirinya karena semua orang sudah tahu apa itu OLX. Yang
    dipindahkan urutannya, bukan isinya.

    **`/cari` tidak dihapus, ia mengalihkan.** Alamat itu sudah ada di peta
    situs yang dikirim ke mesin pencari, di pintasan PWA yang terpasang di
    layar utama orang, dan di tautan yang sudah dibagikan. Parameternya ikut
    dibawa: `/cari?usaha=makanan` adalah hasil yang sudah disaring seseorang,
    dan mengantarnya ke halaman depan tanpa penyaringnya sama saja dengan
    membuangnya.

    **Sorotan jadi kisi dua kolom dari `lg`**, membalik sebagian nomor 39.
    Alasannya ukuran, bukan selera: gambarnya berasio 1,53 dan tidak boleh
    dipangkas (nomor 32), jadi satu kartu selebar `max-w-6xl` berarti banner
    setinggi **753px** yang mendorong hasil pencarian jauh ke bawah lipatan.
    Berdampingan: 410px, diukur. Ini sekaligus menjawab keberatan yang dulu
    melahirkan pemutar otomatisnya, yaitu kartu kedua tidak pernah ditemukan
    orang di laptop. Sekarang ia tidak perlu ditemukan.

    Pemutarnya berhenti sendiri di sana lewat `scrollWidth <= clientWidth`,
    **bukan media query**: yang menentukan memang bisa-tidaknya digeser, dan
    pemeriksaan dari wadahnya sendiri tetap benar kalau tata letaknya diubah
    lagi. Tanpa itu ia memanggil `scrollTo` yang tidak melakukan apa-apa dan
    memicu render ulang tiap lima detik selamanya.

    **Pita "Hasil di bawah dihitung dari Waru / Aloha" dibuang**, diminta
    pemiliknya: titik yang sedang dipakai sudah tertulis di kendali tepat di
    atasnya. Di 375px pita itu memakan sekitar 120px, dan yang terdorong ke
    bawahnya persis barisan kategori dan hasilnya. Diukur setelah dibuang:
    judul hasil di **y=676** dan kartu pertama di **y=748** pada 375×812;
    y=759 dan y=811 pada 1440×900. Keduanya di atas lipatan.

    **"Cari lahan" dibuang dari navigasi header**, karena sekarang ia menunjuk
    ke tempat yang sama dengan lambang di sebelahnya. Yang tersisa pintu masuk
    pemilik lahan, dan ia dibuat menonjol mengikuti pola "+ Jual" di OLX:
    pedagang datang sendiri lewat pencarian, sedangkan pemilik lahan harus
    disadarkan bahwa halaman depannya bisa disewakan, dan itu tidak terjadi
    lewat tautan abu-abu.

    **Akunnya tetap satu untuk kedua sisi.** Ditanyakan bersamaan: apakah
    masuk sebagai pemilik lahan sebaiknya dipisah. Tidak, dan alasannya
    orangnya sendiri: yang menyewakan halaman depannya bulan ini adalah orang
    yang bulan depan mencari lapak buat anaknya. Dua akun berarti dua email,
    dua kotak masuk chat, dan satu pesan yang masuk ke akun yang sedang tidak
    ia buka. Dari sisi keamanan pemisahan itu juga tidak memberi apa-apa: yang
    menahan siapa boleh mengubah lahan siapa adalah RLS per profil. Yang
    dipisah pintu masuknya, dan `/host` memang sudah punya kerangka sendiri.

49. **Titik bawaan pindah ke Jakarta** (18 Sep 2026), diminta pemiliknya,
    menggantikan Waru/Aloha. Preset Sidoarjo dan Surabaya tidak dibuang, cuma
    turun urutan.

    **Konsekuensinya harus ditulis terang, karena ia tidak terlihat dari
    kodenya:** selama belum ada satu pun lahan di Jakarta, pengunjung pertama
    yang tidak menekan "Lokasiku" mendarat di hasil kosong, dan bagian "di
    luar radius" pun tidak menolongnya, karena Sidoarjo 660 km dari Jakarta,
    jauh di luar `RADIUS_LUAS_KM` yang 150 km.

    Jadi urutan preset ini benar HANYA kalau Jakarta ikut diisi. Kalau
    ternyata lahannya tetap terkumpul di Sidoarjo, yang harus diubah bukan
    copy melainkan baris pertama `TITIK_PRESET`.


50. **Egress Supabase: tiga kebocoran ditutup** (18 Sep 2026). Ditanyakan
    pemiliknya setelah tahu kuota gratisnya 5 GB/bulan. Ketiganya gratis
    diperbaiki dan tidak satu pun butuh pindah layanan.

    **Yang paling besar: `cacheControl` tidak pernah diset saat unggah.**
    Bawaan Supabase Storage **3600 detik, satu jam**. Jadi tiap foto diunduh
    ulang dari Supabase tiap jam, per pengunjung, selamanya. Sekarang setahun
    (`src/lib/cacheBerkas.ts`), untuk foto, video, dan posternya.

    Setahun aman **karena berkasnya immutable**: tiap nama memuat
    `crypto.randomUUID()` dan tiap unggahan memakai `upsert: false`, jadi satu
    nama selamanya menunjuk isi yang sama. Foto yang diganti host adalah
    berkas BARU dengan nama baru. Cache panjang cuma berbahaya untuk alamat
    yang isinya bisa berubah, dan keadaan itu tidak bisa terjadi di sini.

    **Kedua: `minimumCacheTTL` masih bawaan 4 jam.** Itu yang menentukan
    seberapa sering Vercel menarik ULANG berkas aslinya dari Supabase; dengan
    4 jam, satu foto yang sama ditarik enam kali sehari. Sekarang 31 hari.
    Umur yang berlaku adalah yang TERBESAR antara nilai ini dan header
    upstream, jadi keduanya harus panjang, bukan salah satu.

    **Ketiga, dan ini membalik migrasi 14: `unoptimized` di `KartuRuang`
    dibuang.** Alasan lamanya benar tapi menghitung ongkos yang salah. Versi
    800px memang sudah berukuran tepat, jadi pengubah ukuran tidak menghemat
    byte, dan sampai di situ penalarannya sah. Yang terlewat: `unoptimized`
    juga berarti peramban mengambil berkasnya LANGSUNG dari Supabase, tanpa
    satu pun cache di antaranya. Jadi tiap kartu yang tampil di layar siapa pun
    memotong kuota egress.

    Lewat pengubah ukuran, Supabase dilayani sekali per gambar per ukuran;
    sesudahnya Vercel yang menyajikan dari tepi, dengan kuota bandwidth
    20 kali lebih besar (100 GB lawan 5 GB). Ongkosnya satu transformasi per
    gambar unik, bukan per tampilan.

    **Aturan turunannya, dan ia berlaku umum: `unoptimized` bukan cuma soal
    ukuran berkas, ia juga melepas cache tepi.** Pakai ia hanya untuk aset
    yang disajikan dari domain kita sendiri (SVG di `public/`), tidak pernah
    untuk berkas di penyimpanan pihak ketiga yang kuotanya kita bayar.

    `KelolaFoto` sengaja tidak ikut diubah: layar itu cuma dibuka pemiliknya
    beberapa kali, jadi cache tepinya tidak pernah sempat terpakai sementara
    transformasinya tetap terpakai.

    **Yang belum, dan urutannya kalau nanti kurang:** Supabase Pro (250 GB),
    lalu memindahkan bucket ke penyimpanan objek tanpa biaya egress. Yang
    kedua tidak butuh migrasi data sama sekali, karena `url` disimpan per
    baris sehingga berkas lama dan baru boleh tinggal di tempat berbeda. Itu
    sudah diantisipasi sejak `18_video.sql`.


51. **Nama jadi Ada Tempat** (19 Sep 2026), menggantikan Cari Ruang. Slogannya
    **sewa tempat usaha jadi gampang**. Domain `adatempat.com`.

    Kandidat yang ditolak di jalan, beserta alasannya, karena ketiganya bisa
    muncul lagi:

    - **`caricuan.app`**: "cuan" cuma bicara ke pemilik lahan, nadanya
      berlawanan dengan seluruh sikap keamanan aplikasi ini (tidak memegang
      uang, tidak menengahi, datangi dulu lahannya), dan ruang digital kata itu
      sudah penuh pinjol serta sinyal trading. Ditambah `caricuan.com` sudah
      dipegang orang lain sejak 2021, jadi nama yang disebut lewat telepon
      bocor ke alamat yang tidak kita kuasai.
    - **`carilapak.com`**: kata "lapak" tepat, tapi mengingatkan ke Bukalapak.
    - **`bukaruang.com`**: justru LEBIH mengingatkan ke Bukalapak, karena yang
      khas dari merek itu awalan "Buka-" beserta keluarga sub-mereknya
      (BukaPengadaan, BukaGlobal, BukaEmas), bukan kata "lapak" yang umum.
      Ditambah "ruang" adalah kata yang sudah ditinggalkan produk ini sejak
      migrasi 17.
    - **`mukajalan.com`**: paling ownable, tapi "muka jalan" bahasa pemilik
      properti, bukan bahasa pedagang. Pedagang gerobak tidak mencari "muka
      jalan".

    **Kenapa Ada Tempat menang: ia sekaligus pertanyaan dan jawaban.** Pedagang
    bertanya "ada tempat nggak buat jualan?", pemilik lahan menjawab "ada
    tempat". Satu nama melayani dua sisi pasar tanpa memihak, dan itu yang
    gagal dilakukan hampir semua kandidat lain.

    Kelemahannya diketahui dan ditanggung: **namanya tidak menjelaskan apa-apa
    sendirian.** Karena itu ia WAJIB selalu tampil bersama slogannya, di judul
    halaman, gambar pratinjau, dan manifest. Kalau suatu saat ada yang
    memakai "Ada Tempat" tanpa kalimat pendamping, yang hilang bukan kerapian
    melainkan satu-satunya keterangan tentang produknya.

    **Wordmark lama tergambar DI DALAM kedua ilustrasi banner**, dan itu tidak
    bisa diperbaiki dari kode. Keduanya dibersihkan per piksel: latarnya diukur
    dulu (putih 254 dan gelap 29,23,20), batas sudut peta diukur per baris,
    lalu wordmark-nya ditambal tanpa menyentuh gambarnya. Sumber JPEG aslinya
    tetap ada di `desain/sorotan/`, jadi kalau nanti ilustrasinya dibuat ulang
    dengan nama baru, yang diganti cuma hasil akhirnya.

    **Berkasnya berganti nama jadi `-v2`, dan itu wajib.** `minimumCacheTTL`
    baru dinaikkan ke 31 hari (nomor 50), dan dokumentasi Next menyebutnya
    sendiri: cache gambar tidak bisa dibatalkan. Menimpa berkas di alamat yang
    sama berarti versi lama tetap disajikan sebulan penuh. Terbukti langsung
    saat mengujinya: gambar lama masih muncul meski berkasnya sudah diganti.

    Aturan turunannya: **mengganti isi sebuah gambar berarti mengganti nama
    berkasnya.**

    Satu kalimat di `SuaraPenyewa` ikut diubah: ia menyebut "baru jalan di
    Sidoarjo dan Surabaya Selatan", dan itu bertabrakan dengan titik bawaan
    yang sekarang Jakarta (nomor 49). Sekarang cuma "baru mulai", yang tetap
    benar dari sisi mana pun.

    Yang TIDAK ikut berubah: lambang kanopi warung (masih benar artinya untuk
    nama ini), nama tabel `ruang`, dan rute `/ruang/[id]`. Ketiganya memang
    sengaja dipisah dari nama produk sejak awal.


### Berikutnya

Fokus rilis pertama: **mengumpulkan pemilik lahan dan pedagang**, bukan
menambah alur. Yang paling berguna dikerjakan sekarang bukan fitur melainkan
isi — lima belas lahan sungguhan di Sidoarjo, difoto dan diverifikasi sendiri.

Alur pembayaran, serah terima, dan kontrak PDF **ditunda, bukan dibatalkan**
(lihat nomor 43). Skemanya masih utuh di database, jadi menghidupkannya lagi
berarti mengembalikan rutenya dari riwayat git, bukan membangun ulang.

Yang masih pantas dikerjakan tanpa menambah model bisnis: verifikasi nomor HP
(menunggu WhatsApp/SMS), memisahkan properti dari ruang (utang no. 4), dan
memindahkan `permintaan` dari volume m³ ke lebar muka jalan + jenis usaha
(lihat ekor nomor 37).

## Yang masih menunggu pihak luar

Bukan keputusan produk: hal-hal ini butuh akun atau lisensi yang belum kita
punya. Jangan menirunya dengan tempelan yang terlihat berfungsi — layar yang
mengaku "sudah dibayar" tanpa uang sungguhan adalah kebohongan, bukan demo.

| Bagian | Kenapa belum | Yang boleh dikerjakan sekarang |
|---|---|---|
| Pembayaran | **tidak dipakai di rilis pertama** (nomor 43), bukan lagi soal vendor | tidak ada; jangan bangun ulang sebelum diminta |
| Verifikasi identitas | vendor e-KYC | kolom rujukan id vendor; jangan simpan foto KTP sendiri |
| Notifikasi WhatsApp | WhatsApp Business API provider | notifikasi in-app **sudah ada**; email lewat Supabase belum |

**Web push sudah ada** sejak `10_push.sql`, dan ia tidak butuh vendor mana pun:
kunci VAPID dibuat sendiri. Pemberitahuan sampai ke perangkat meski aplikasinya
tertutup — untuk host, itu justru keadaan yang paling sering terjadi. Cara
menyalakannya ada di SETUP.md; opsional, aplikasinya jalan penuh tanpanya.
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
`select periksa_permukaan_publik();`.** Sejak `18_video.sql` ia memeriksa
**tiga** hal, bukan dua: kolom rahasia yang bisa dibaca anon, hak anon ke
tabel dasar, dan — yang ketiga, baru — hak selain SELECT pada view mana pun.

Pemeriksaan ketiga ditambahkan setelah cacat yang sama ketemu di **empat**
view: `jendela_akses_publik` (migrasi 08), lalu `ruang_saya`,
`pemesanan_saya`, dan `percakapan_saya`. Sebabnya struktural — Supabase
memasang `alter default privileges ... grant all on tables to anon`, jadi
setiap view baru LAHIR dengan INSERT/UPDATE/DELETE/TRUNCATE untuk anon.
Lima view publik pertama selamat cuma karena `03_auth_rls.sql` mencabut
semuanya SETELAH mereka dibuat. **`grant select` saja tidak cukup; harus
`revoke all` lebih dulu.** Fungsi itu menggagalkan migrasi kalau
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
4. **Kamera in-app dan bucket bukti belum ada.** Unggahan host sudah masuk
   Supabase Storage (bucket `ruang-foto`), EXIF-nya dibuang di peramban lewat
   canvas — penting, karena EXIF foto HP hampir selalu memuat GPS — dan versi
   kecilnya dibuat sekaligus (migrasi 14). Yang belum: kamera in-app untuk foto
   serah terima, dan bucket terpisah untuk foto bukti, yang tidak boleh publik.
   Foto `picsum.photos` sudah tidak jadi soal sejak seed-nya dibuang (nomor 22
   di urutan bangun).
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

**Region fungsi Vercel dikunci ke `sin1` di `vercel.json`, dan itu bukan
kerapian.** Databasenya di Singapura, dan tiap perpindahan halaman memanggil
Supabase 5-8 kali berurutan: `getUser()`, kueri profil, dua lencana header,
lalu kueri halamannya. Kalau fungsinya jalan di Amerika, tiap panggilan bayar
sekitar 230 ms — dan jeda yang terasa itu penjumlahan semuanya, bukan satu
kueri yang lambat. Kalau region-nya berubah, yang rusak bukan fiturnya
melainkan rasanya, dan itu jenis kerusakan yang paling lama tidak disadari.

Dua aturan turunannya:

- **Setiap rute punya `loading.tsx`.** Tanpa itu, menekan tautan tidak
  menghasilkan apa-apa di layar sampai seluruh kueri servernya selesai.
- **Apa pun yang tidak mendesak dikeluarkan dari jalur kritis** dengan
  Suspense — angka di lencana header contohnya. Halaman tidak boleh menunggu
  hitungan notifikasi hanya untuk menampilkan judulnya.

## Arah tampilan — diputuskan 4 September 2026

Terang, tenang, dan **warna dipakai hemat**. Latar krem nyaris putih
(`--color-paper` #faf8f6), kartu putih bergaris tipis, dan terakota
(`--color-brand` #a93b20) hanya muncul di tombol utama, tautan, dan keadaan
terpilih.

**Warnanya diganti 8 September 2026**, dari #2563eb — yang persis `blue-600`
Tailwind, dan itulah keluhannya: warna bawaan kerangka kerja terlihat sebagai
warna bawaan. Terakota dipilih karena tiga alasan sekaligus: ia bukan nilai
palet Tailwind mana pun, ia warna tanah — dan yang disewakan di sini memang
lahan — dan ia berdiri sendiri di antara pesaing yang biru (Traveloka), hijau
(Tokopedia, Gojek), atau oranye terang (Shopee).

Kontrasnya dihitung, bukan dikira: putih di atas terakota 6,30:1, terakota di
atas kertas 5,95:1, `muted` di atas kertas 5,62:1 — ketiganya lewat AA. Kalau
warnanya diubah lagi, hitung ulang; `#b2411f` yang sempat dicoba cuma
5,72:1 dan sudah menipis untuk teks kecil.

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

  Aturan ini pernah dilanggar pelan-pelan, satu bagian filter setiap kali
  fitur baru ditambah, sampai di layar 375×812 kartu hasil PERTAMA mulai di
  y=809 — tiga piksel di bawah lipatan. Halaman yang satu-satunya alasan
  dibuka adalah hasil pencarian menampilkan nol hasil sebelum orang
  menggulir. Diukur, bukan dikira, 8 September 2026; sekarang y=419.

  Penyaring rinci ada di balik satu tombol **Filter**, dan yang tersisa di
  layar adalah barisan pilihan yang SEDANG aktif. Kalau nanti ada penyaring
  baru, ia masuk ke dalam panel itu — bukan menambah satu bagian lagi di
  atas hasil.
- **Yang berwarna besar hanya foto**, dan fotonya lahan sungguhan dari
  database — bukan gambar hiasan. **Satu perkecualian, 8 September 2026:**
  sorotan di halaman depan sekarang kartu SVG penjelasan
  (`public/promo/`, lihat `SorotanPromo`). Aturan ini benar saat isinya masih
  14 ruang berfoto; setelah data contoh dibuang, kolase fotonya menampilkan
  NOL gambar dan bagian terbesar halaman depan jadi kosong. Kartunya bukan
  hiasan — keempatnya menyatakan hal yang benar-benar berlaku di aplikasi.
- **Bayangan sangat halus, dua tingkat saja** (`.naik`, `.naik-hover` di
  globals.css). Halaman hasil menampilkan belasan kartu sekaligus; bayangan
  tebal membuatnya terasa berat.
- **Tinggi bilah atas ada di satu variabel** (`--tinggi-header`), diukur dari
  halaman jadi: 74px di layar kecil, 78px dari `sm`. Tiga tempat bergantung
  padanya. Sebelumnya ketiganya menulis `68px` sendiri-sendiri dan ketiganya
  salah, sehingga bilah filter menyelinap 10px ke balik header.

### `/cari` jadi halaman jelajah, bukan cuma kisi hasil — 18 September 2026

Diminta dengan OLX dan Travelio sebagai rujukan: *"harusnya gak cuma gini
doang"*. Dua hal yang ditambahkan, dan keduanya menghormati aturan "halaman
alat kerja tidak punya hero" yang sudah berlaku di sini.

1. **Baris kategori**, pola OLX. Enam tipe, di luar panel filter dan selalu
   terlihat: penyaring rinci sesekali dipakai, tapi "saya cuma mau lihat kios"
   adalah niat yang dibawa orang sejak sebelum halaman ini terbuka.

   Daftarnya **tetap**, bukan hanya tipe yang kebetulan ada isinya di radius
   sekarang. Kategori yang muncul dan hilang mengikuti hasil membuat orang
   mengira aplikasinya rusak, dan tidak ada cara menemukan tipe yang sedang
   kosong untuk memperlebar radiusnya. Enam, bukan dua belas, supaya barisnya
   muat di 375px dengan satu pintasan terpotong sedikit di kanan — potongan
   itu yang memberi tahu barisnya bisa digeser.

2. **Hasil dipecah jadi bagian bertema**: "Paling dekat dari X", "Paling murah
   di sekitarmu", lalu "Lahan lainnya".

   **Dipartisi, BUKAN diulang.** Tiap lahan muncul di tepat satu bagian.
   Bagian bertema yang saling meminjam isi akan menampilkan lahan yang sama
   dua-tiga kali dalam satu layar saat isinya masih lima belas, dan itu
   terbaca sebagai aplikasi yang isinya sedikit dan sedang ditutup-tutupi.

   Cuma menyala kalau hasilnya **>= 8 dan tidak ada penyaring aktif**. Orang
   yang sudah memilih "kios di bawah Rp500rb" sedang mencari, bukan
   melihat-lihat, dan memecah hasilnya jadi tiga bagian justru menyembunyikan
   yang ia minta.

   Tiap deret digeser mendatar di telepon, kisi di laptop. Empat kartu dalam
   kisi dua kolom memakan dua baris penuh di 375px dan mendorong bagian
   berikutnya jauh ke bawah.

**Penyaring tipe yang lama DIBUANG bersamaan, dan itu perbaikan atas cacat
yang sempat tayang.** Baris kategori ditambahkan tanpa membuang blok "Tempat
seperti apa?" di dalam panel Filter, jadi begitu panelnya dibuka ada DUA
pemilih tipe di satu layar — dan yang di dalam panel cuma menyisakan satu
petak "Semua" sendirian kalau radiusnya kosong, karena isinya diturunkan dari
hasil. Terlihat seketika di layar, tidak terlihat sama sekali dari kodenya.

Pelajarannya: **menambah pintasan untuk sesuatu yang sudah punya penyaring
berarti salah satunya harus pergi.** Dua kendali untuk satu kolom bukan
kemudahan, ia pertanyaan "yang mana yang berlaku" yang tidak dijawab layar.
Tombol reset "Semua" sekarang cuma muncul saat ada tipe yang sedang dipilih.

Baris koordinat mentah di bawah kendali titik (`Memakai lokasimu: -7,3013,
112,7834`) ikut dibuang. Itu isi kepala pengembang: tidak ada satu pun
keputusan yang bisa diambil pedagang dari empat angka di belakang koma, dan
nama titiknya sudah tertulis di kendali tepat di atasnya.

**Aturan lipatan tetap dijaga, dan diukur ulang**: kartu hasil pertama di
y=401 di laptop (sebelumnya 419 — baris kategori justru menggantikan ruang
yang lebih boros) dan y=513 di 375×812. Keduanya masih di atas lipatan.
Kalau nanti ada pintasan lain yang mau ditambahkan di atas hasil, ukur lagi;
batasnya tetap sama, hasil pencarian harus terlihat tanpa menggulir.

### Panel filter jadi dialog dua kolom — 18 September 2026

Keluhannya: *"filternya gini banget yaa, kok aneh gitulo, mending liat
punyanya olx"*, dengan tangkapan layar dialog "Semua Kategori" OLX.

Yang lama membuka lima kelompok sekaligus sebagai baris pil bertumpuk, di
tengah halaman, mendorong hasilnya ke bawah. Dua hal salah sekaligus, dan
yang kedua lebih dalam:

1. Aturan lipatan yang sudah pernah diukur dan diperbaiki dilanggar lagi,
   cuma kali ini hanya saat panelnya dibuka.
2. **Lima kelompok yang terlihat sekaligus tidak terbaca sebagai lima
   pertanyaan.** Yang muncul di layar cuma dinding pil, dan tidak ada satu
   pun yang mengundang dijawab.

Sekarang `PanelFilter`: dialog di laptop, lembar bawah di telepon, dengan
daftar kelompok di kiri dan pilihannya di kanan. Halamannya tidak bergeser
sama sekali, dan yang sedang dijawab cuma satu kelompok.

Tiga hal yang membuatnya bekerja:

- **Kolom kirinya menampilkan pilihan yang sedang berlaku** di bawah tiap
  judul, dengan warna merek. Tanpa itu orang harus menekan kelima kelompok
  satu per satu untuk tahu apa yang sedang menyaring.
- **Tidak ada tombol "Terapkan".** Penyaringnya langsung berlaku, dan tombol
  bawahnya berbunyi "Lihat N lahan" dengan N yang ikut berubah. Itu yang
  benar-benar ingin diketahui orangnya sebelum menutup panelnya, dan
  menundanya sampai "Terapkan" membuat angka itu mustahil ditampilkan.
- **Kelompoknya data, bukan JSX** (`KelompokFilter[]`). Kolom kiri butuh tahu
  judul dan ringkasan tiap kelompok SEBELUM kelompoknya dibuka, dan itu tidak
  bisa dibaca dari JSX yang bersarang.

Kelompok aktifnya **diturunkan, bukan disimpan mentah**: "Jenis usaha" dan
"Barang yang disimpan" hilang sendiri kalau tidak ada lahan yang
menyebutkannya di radius ini, dan kunci yang disimpan mentah akan menunjuk
kelompok yang sudah tidak ada — kolom kanan kosong tanpa penjelasan apa pun.

**Keterangan panjang di tiap kelompok dibuang.** Tiga paragraf yang dulu
menjelaskan kenapa sebuah penyaring berguna tidak muat di kolom selebar itu,
dan memang tidak ada yang membacanya. Yang tersisa satu baris di bawah
pilihan yang membutuhkannya.

Satu cacat yang cuma ketahuan dari melihat layarnya: overlay-nya `z-50`,
**sama dengan navigasi bawah**, dan karena navigasinya dirender belakangan di
layout akar ia menang. Tombol "Hapus semua" dan "Lihat N lahan" tertutup rapi
di telepon, tanpa satu pun galat. Sekarang `z-[60]`.


### Halaman depan berhenti terbaca seperti template — 18 September 2026

Keluhannya: *"desainnya kurang unik dan keliatan vibe codingnya."* Diagnosisnya
bukan soal warna atau font, melainkan **irama**: delapan bagian berturut-turut
dengan bentuk yang sama persis — judul, lalu kisi kartu putih bergaris tipis di
atas kertas, semuanya `max-w-6xl`, semuanya berjarak sama.

Empat hal yang diubah, dan ketiganya berlaku umum untuk halaman baru:

1. **Judulnya tidak boleh muncul dua kali.** Hero dulu menaruh H1 di kiri dan
   `SorotanPromo` di kanan — dan kartu sorotan pertama memuat slogan yang sama
   persis. Judul yang sama, bersebelahan, adalah hal pertama yang membuat
   halaman terbaca seperti disusun tanpa pernah dilihat.
2. **Hero satu kolom, dan yang mengisi kolom kedua adalah RUANG.** Judulnya
   naik ke 4,25rem dengan leading 0,98 dan dua warna, dan itu satu-satunya hal
   di layar pertama. Membagi dua semuanya adalah refleks yang membuat setiap
   halaman terlihat sama.
3. **Satu bidang gelap memecah iramanya.** "Cara pakainya" jadi `bg-ink`. Ini
   perkecualian sadar dari aturan "yang berwarna besar hanya foto": yang
   ditambahkan bukan warna baru melainkan nilai gelap dari palet yang sudah
   ada, dan ilustrasi krem di atasnya justru lebih menonjol.
4. **Bagian yang mengerjakan hal yang sama digabung.** "Mau jualan apa?" dan
   "Butuh lahan seperti apa?" dua-duanya kisi kartu menuju `/cari` dengan
   penyaring berbeda; sekarang satu bagian, tipe ruangnya jadi barisan chip di
   kakinya. "Sorotan" dan "Yang kamu dapat" dua-duanya bergambar dan berkisi;
   digabung jadi satu bagian dua kolom, gambarnya mendampingi teks yang
   menjelaskannya.

Hasilnya diukur: **delapan bagian jadi tujuh, 4963px jadi 4755px**, dan
latarnya sekarang berganti-ganti putih → kertas → putih → tinta → merek alih-alih
kertas terus-menerus.

Aturan turunannya: **kalau dua bagian berurutan punya bentuk yang sama, salah
satunya harus berubah bentuk atau keduanya digabung.** Bukan soal isi, soal
irama — dan irama yang seragam persis itulah yang terbaca sebagai "dibuat
tanpa dipikirkan".

## Bahasa

Seluruh UI dan copy dalam Bahasa Indonesia. Nama kolom database juga
Bahasa Indonesia (sudah begitu di schema) — konsisten, jangan campur.

@AGENTS.md
