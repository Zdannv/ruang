# Ruang — cara memasang

Panduan menyiapkan lingkungan pengembangan.

Sejak 4 September 2026 repo ini bukan lagi prototipe presentasi, melainkan
pengembangan produk sungguhan — lihat "Tahap saat ini" di CLAUDE.md. Pembayaran,
e-KYC, dan notifikasi WhatsApp masih belum ada karena menunggu lisensi dan akun
pihak luar, bukan karena sengaja dipalsukan.

## Cara pasang

1. Buat project Supabase baru (region **Southeast Asia / Singapore**).
2. SQL Editor → jalankan berurutan: `01_schema.sql`, `02_seed.sql`,
   `03_auth_rls.sql`, `04_pesan.sql`, `05_host.sql`, `06_akses.sql`,
   `07_advisor.sql`, `08_jendela.sql`. **Kedelapannya wajib.**
   Aplikasi membaca lewat view yang dibuat di `03`–`05` dan menulis lewat
   fungsi di `04`; tanpa itu layarnya menjawab "relation does not exist".
   `05` juga membuat bucket Storage `ruang-foto` beserta policy-nya.
3. Isi Malang siap pakai: 6 host, 4 penyewa, 14 ruang, 84 foto,
   6 pemesanan di lima status berbeda, manifes, log akses, ulasan,
   dan 5 permintaan ruang.
4. `cp .env.example .env.local`, lalu isi URL + **anon key**.
5. Authentication → Sign In / Providers → pastikan **Email** aktif dan
   *Confirm email* menyala.
6. Authentication → URL Configuration → **Redirect URLs**: tambahkan
   `http://localhost:3000/auth/konfirmasi` (dan alamat production-nya nanti).
   Kalau tidak terdaftar, Supabase mengabaikan `emailRedirectTo` dan diam-diam
   memakai Site URL — tautan konfirmasinya jadi mendarat di tempat yang salah.
7. `npm install && npm run dev`.

## Kalau tautan konfirmasi email berakhir ERR_CONNECTION_REFUSED

Ini kegagalan yang paling sering terjadi saat pengembangan, dan urutan
kejadiannya penting untuk dipahami sebelum menebak penyebabnya.

Tautan di email TIDAK langsung menunjuk ke aplikasi. Ia menunjuk ke
`https://<ref>.supabase.co/auth/v1/verify?...&redirect_to=<alamat aplikasi>`.
Jadi saat diklik:

1. Supabase memverifikasi tokennya di servernya sendiri — **akun sudah aktif
   di titik ini**, dan tokennya sudah terpakai.
2. Baru kemudian peramban dialihkan ke aplikasi.

Kalau dev server mati, yang gagal cuma langkah 2. **Akunnya sudah terkonfirmasi.**
Jangan minta email baru — coba masuk saja di `/masuk`. Kalau pesannya bukan
"Emailnya belum dikonfirmasi", berarti memang sudah beres.

Supaya tidak terulang:

- Isi `NEXT_PUBLIC_SITE_URL` di `.env.local`. Tanpa itu nilainya diambil dari
  alamat yang sedang dibuka, dan alamat itu **dibekukan ke dalam email** pada
  detik tombol daftar ditekan.
- Daftarkan alamat yang sama di Supabase Dashboard → Authentication → URL
  Configuration → **Redirect URLs**. Kalau tidak terdaftar, Supabase
  mengabaikannya dan diam-diam memakai Site URL.
- Biarkan `npm run dev` jalan saat mengklik tautannya, dan buka emailnya di
  komputer yang sama. `localhost` di HP berarti HP itu sendiri.
- Selama masih di tahap pengembangan, mematikan *Confirm email* di Supabase
  Dashboard → Authentication → Sign In / Providers menghilangkan langkah ini
  sepenuhnya. Nyalakan lagi sebelum ada pengguna sungguhan.
- Begitu sudah deploy ke Vercel, isi `NEXT_PUBLIC_SITE_URL` dengan domain
  Vercel-nya. Itu yang menyelesaikan masalah ini secara permanen, termasuk
  untuk email yang dibuka di HP.

Halaman `/auth/konfirmasi` menangani ketiga bentuk balasan Supabase
(`token_hash`, `code` PKCE, dan token di fragment URL) dan menyebutkan
alasannya kalau gagal — termasuk memberi tahu bahwa tautan yang sudah terpakai
memang akan gagal, dan menyarankan mencoba masuk lebih dulu.

## Masuk sebagai host isi seed

14 ruang di seed dimiliki profil yang belum punya akun. Untuk mengelolanya,
daftar lewat aplikasi lalu **pindahkan** akunmu ke profil seed. Urutannya
penting — mendaftar sudah membuat satu baris profil sendiri lewat trigger, dan
`profil.user_id` UNIQUE, jadi langsung meng-UPDATE profil seed akan gagal
"duplicate key":

```sql
begin;
  delete from profil
   where user_id = (select id from auth.users where email = 'kamu@contoh.com')
     and nama <> 'Pak Slamet Riyadi';

  update profil
     set user_id = (select id from auth.users where email = 'kamu@contoh.com')
   where nama = 'Pak Slamet Riyadi';
commit;
```

Aman karena profil yang dibuang belum punya ruang, pemesanan, atau ulasan apa
pun. Petunjuk lengkapnya juga ada di akhir `03_auth_rls.sql`.

Sudah diuji jalan bersih di Postgres 16, tanpa error.

## Pencarian terdekat

```sql
select * from ruang_terdekat(
  -7.9526, 112.6142,  -- titik penyewa
  5,                  -- radius km
  15,                 -- volume minimum m3   (opsional)
  1500000             -- harga maksimum      (opsional)
);
```

Haversine murni, tanpa PostGIS. Jarak dihitung dari koordinat **asli**;
yang dikembalikan untuk peta adalah `lat_publik`/`lng_publik` yang sudah
digeser ±200 m. Pergeserannya tetap per properti — kalau acak tiap kali
dimuat, titik aslinya bisa ditebak dari beberapa kali reload.

## Urutan bangun

Urutan dan statusnya dipelihara di CLAUDE.md supaya tidak ada dua daftar yang
saling bertentangan. Ringkasnya: pencarian dan detail ruang **selesai**,
berikutnya **auth**, lalu alur pesan, serah terima, dasbor host, dan
permintaan ruang.

## Yang belum ada

| Bagian | Kenapa | Rencana |
|---|---|---|
| Pembayaran | butuh payment gateway berlisensi + akun bisnis | model pemesanan dulu; status "sudah dibayar" tidak pernah ditulis tanpa uang sungguhan |
| Verifikasi identitas | butuh vendor e-KYC | simpan id rujukan vendor, bukan foto KTP |
| Notifikasi WhatsApp | butuh WhatsApp Business API provider | in-app + email Supabase lebih dulu |

Login **bukan** lagi switcher peran: yang dipakai auth Supabase sungguhan.
Daftar lengkap utang teknis ada di CLAUDE.md bagian "Utang yang diketahui".

## Catatan

- Uang disimpan `bigint` rupiah penuh. Jangan pernah float.
- Status pakai `text` + check constraint, bukan enum Postgres —
  enum menyakitkan diubah, dan daftar status Anda pasti bertambah.
- `pemesanan_transisi` sudah mencatat tiap perpindahan status. Di produk,
  tabel ini dan tabel bukti lainnya di-`REVOKE` update/delete-nya.
- Foto pakai `picsum.photos`. Tambahkan ke `images.remotePatterns` di
  `next.config.js`, atau pakai `<img>` biasa untuk demo.
- **RLS sudah sungguhan** sejak `03_auth_rls.sql`. Anon tidak punya hak select
  ke satu pun tabel dasar; seluruh bacaan publik lewat lima view. Diuji dari
  database kosong di Postgres 16: anon ditolak di sepuluh tabel, penyewa yang
  sudah membayar bisa membaca alamat ruang yang ia sewa dan tidak bisa membaca
  yang lain, host tidak bisa menandai pemesanannya sendiri sudah dibayar, dan
  ulasan hanya bisa ditulis atas sewa yang sudah selesai.
- **`pemesanan` tidak punya policy INSERT/UPDATE** — itu disengaja. Semua
  perpindahan status lewat fungsi di `04_pesan.sql`, yang memeriksa pemanggil
  dan transisinya. Diuji: host yang meng-UPDATE `pemesanan.status` langsung
  ditolak `permission denied`.
- **Tidak ada jalan ke status "sudah dibayar".** Alur pesan berhenti di
  `menunggu_pembayaran`; tidak ada `bayar_pemesanan()` bahkan sebagai simulasi.
- **Tumpang tindih tanggal mustahil di level database**, lewat constraint
  `exclude using gist` — bukan cuma diperiksa di fungsi, karena pemeriksaan di
  fungsi kalah balapan kalau dua host menekan "Terima" bersamaan.
- **`lat_publik`/`lng_publik` tidak bisa ditulis klien.** Trigger menimpanya di
  setiap insert dan update, jadi host tidak bisa menerbitkan titik aslinya.
- **Tiap migrasi yang menambah view atau mengubah hak akses diakhiri
  `select periksa_permukaan_publik();`** — penjaga yang menggagalkan migrasi
  kalau anon bisa membaca kolom rahasia atau punya hak ke tabel dasar. Perlu,
  karena Supabase memberi `all on tables to anon` ke setiap tabel baru lewat
  default privileges.
- **Klien tidak punya hak tulis apa pun ke tabel bukti.** `manifes_item`,
  `pemesanan_transisi`, `akses_log`, `serah_terima`, dan `pemesanan` cuma
  SELECT untuk `authenticated`; semua penulisan lewat fungsi SECURITY DEFINER.
  Diuji: insert langsung ke keempat tabel bukti ditolak `permission denied`.
- **Foto host diunggah langsung ke Storage dari peramban**, setelah digambar
  ulang lewat canvas — itu yang membuang EXIF berisi GPS. Berkasnya disimpan di
  `<profil_id>/<ruang_id>/`, dan policy Storage mengikat folder pertama ke
  pemiliknya.
