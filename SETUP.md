# Ruang — cara memasang

Panduan menyiapkan lingkungan pengembangan.

Sejak 4 September 2026 repo ini bukan lagi prototipe presentasi, melainkan
pengembangan produk sungguhan — lihat "Tahap saat ini" di CLAUDE.md. Pembayaran,
e-KYC, dan notifikasi WhatsApp masih belum ada karena menunggu lisensi dan akun
pihak luar, bukan karena sengaja dipalsukan.

## Cara pasang

1. Buat project Supabase baru (region **Southeast Asia / Singapore**).
2. SQL Editor → jalankan berurutan: `01_schema.sql`, `03_auth_rls.sql`,
   `04_pesan.sql`, `05_host.sql`, `06_akses.sql`, `07_advisor.sql`,
   `08_jendela.sql`, `09_notifikasi.sql`, `10_push.sql`, `11_pesan_chat.sql`,
   `12_balasan_cepat.sql`, `13_umkm.sql`, `14_foto_kecil.sql`, `16_wilayah_profil.sql`.
   **Semuanya wajib.** Aplikasi membaca lewat view yang dibuat di `03`–`05`
   dan menulis lewat fungsi di `04`; tanpa itu layarnya menjawab "relation
   does not exist". `05` juga membuat bucket Storage `ruang-foto` beserta
   policy-nya.
3. **`02_seed.sql` sengaja tidak ada di daftar itu.** Ia berisi data contoh
   Malang — 6 host, 4 penyewa, 14 ruang, 84 foto berpenunjuk picsum.photos,
   6 pemesanan, manifes, log akses, ulasan, 5 permintaan — dan gunanya cuma
   untuk melihat aplikasinya terisi. Jalankan hanya kalau itu yang kamu mau,
   dan **sebelum** ada isi sungguhan.

   Kalau seed sudah pernah dijalankan dan sekarang isinya harus bersih:
   jalankan `15_hapus_seed.sql`. Ia menghapus **hanya** baris dengan id yang
   tertulis di `02_seed.sql`, jadi ruang sungguhan yang sudah ada tidak ikut
   terbawa. Profil seed yang sudah diklaim akun sungguhan ditinggalkan, dan
   jumlah yang dihapus dicetak sebagai NOTICE.
4. `cp .env.example .env.local`, lalu isi URL + **anon key**.
5. Authentication → Sign In / Providers → pastikan **Email** aktif dan
   *Confirm email* menyala.
6. Authentication → URL Configuration. **Dua kolom, dan yang pertama paling
   sering salah.**

   - **Site URL** → domain produksinya, mis. `https://ruang-kamu.vercel.app`.
     Bukan `http://localhost:3000`. Ke sinilah setiap tautan email mendarat
     kalau tujuan lainnya tidak cocok, jadi selama isinya localhost, orang
     yang membuka email konfirmasi di HP akan melihat *"This site can't be
     reached"* — meskipun akunnya sudah benar-benar terkonfirmasi.
   - **Redirect URLs** → tambahkan `http://localhost:3000/**` untuk
     pengembangan. Yang tidak terdaftar di sini diabaikan Supabase, yang
     diam-diam memakai Site URL sebagai gantinya.

   Isi Site URL project bisa diperiksa tanpa membuka dashboard — kirim token
   yang sengaja ngawur, lalu lihat ke mana ia dialihkan:

   ```bash
   curl -sD - -o /dev/null "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/verify?token=bogus&type=signup" | grep -i ^location
   ```

   Alamat sebelum tanda `#` itulah Site URL yang sedang dipakai.

7. Authentication → Emails → tempel isi `supabase/email/*.html` ke templat yang
   sesuai:

   | Berkas | Templat Supabase | Subject yang disarankan |
   |---|---|---|
   | `01_konfirmasi_pendaftaran.html` | Confirm signup | Konfirmasi email kamu — Ruang |
   | `02_setel_ulang_sandi.html` | Reset password | Setel ulang sandi — Ruang |
   | `03_ganti_alamat_email.html` | Change email address | Konfirmasi alamat email baru — Ruang |

   Ketiganya memakai `{{ .TokenHash }}`, bukan `{{ .ConfirmationURL }}`, dan
   itu bukan selera. `ConfirmationURL` menempuh dua lompatan — lewat
   `/auth/v1/verify` milik Supabase, lalu dialihkan ke aplikasi — sehingga
   **Site URL dan Redirect URLs dua-duanya** harus benar. Versi TokenHash
   menuju langsung ke halaman kita, jadi cuma Site URL yang menentukan. Satu
   pengaturan yang bisa salah, bukan dua.

8. `npm install && npm run dev`.

## Menyalakan web push

Opsional — aplikasinya jalan penuh tanpa ini, cuma notifikasinya hanya terlihat
saat aplikasi dibuka. Web push **tidak butuh vendor mana pun**; kunci VAPID
dibuat sendiri.

1. Buat kunci dan rahasia:

   ```bash
   npx web-push generate-vapid-keys
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Isi di `.env.local` (dan di Environment Variables Vercel):
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `PUSH_RAHASIA`, dan `SUPABASE_SERVICE_ROLE_KEY`.

   `SUPABASE_SERVICE_ROLE_KEY` melewati SELURUH RLS. Ia dipakai di satu tempat
   saja — `/api/push`, yang perlu membaca langganan milik orang lain untuk bisa
   mengirim ke perangkat mereka. Jangan pernah memberinya awalan
   `NEXT_PUBLIC_`, dan jangan memakainya untuk apa pun yang bisa dikerjakan
   klien biasa.

3. Supabase Dashboard → Database → **Webhooks** → Create:

   | Isian | Nilai |
   |---|---|
   | Table | `notifikasi` |
   | Events | `Insert` |
   | Type | HTTP Request |
   | Method | `POST` |
   | URL | `https://<domain-kamu>/api/push` |
   | HTTP Header | `x-ruang-rahasia: <isi PUSH_RAHASIA>` |

   Webhook-nya **tidak perlu** mengirim isi notifikasinya. `/api/push` sengaja
   mengabaikan badan permintaan dan membaca sendiri dari database: kalau ia
   memercayai badan permintaan, siapa pun yang menebak rahasianya bisa
   mengirim pemberitahuan berisi apa saja ke perangkat orang lain.

4. Buka `/notifikasi` di aplikasi, tekan **Nyalakan**. Izin diminta setelah
   ditekan, bukan saat halaman dimuat — permintaan izin yang muncul tiba-tiba
   hampir selalu ditolak, dan penolakan di Chrome bersifat permanen.

**Perlu domain HTTPS.** Service worker hanya didaftarkan di production, jadi
push tidak bisa diuji lewat `next dev`. Webhook Supabase juga tidak bisa
menghubungi `localhost`.

## Menguji PWA-nya

Manifest jalan di `next dev`, tapi **service worker sengaja hanya didaftarkan di
production**. Di pengembangan, service worker yang menyimpan aset membuat
perubahan kode tampak tidak berlaku — orang mengubah satu baris, memuat ulang,
melihat versi lama, lalu mencari bug yang tidak ada.

Untuk menguji PWA-nya utuh (install ke layar utama, halaman offline):

```bash
npm run build && npm start
```

Lalu buka `http://localhost:3000` di Chrome → DevTools → Application. Manifest
dan service worker harus terdaftar, dan mematikan jaringan di tab Network
harus memunculkan halaman offline, bukan layar dinosaurus.

Ikonnya dihasilkan, bukan diunduh: `node skrip/buat-ikon.mjs` menulis ulang
keempat berkas PNG di `public/`. Jalankan lagi kalau warna mereknya berubah.

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
- **Notifikasi ditulis trigger, bukan klien.** Klien tidak punya INSERT ke
  `notifikasi`; diuji dengan mencoba menyisipkan notifikasi palsu ke akun orang
  lain dan ditolak `permission denied`.
- **Klien tidak punya hak tulis apa pun ke tabel bukti.** `manifes_item`,
  `pemesanan_transisi`, `akses_log`, `serah_terima`, dan `pemesanan` cuma
  SELECT untuk `authenticated`; semua penulisan lewat fungsi SECURITY DEFINER.
  Diuji: insert langsung ke keempat tabel bukti ditolak `permission denied`.
- **Foto host diunggah langsung ke Storage dari peramban**, setelah digambar
  ulang lewat canvas — itu yang membuang EXIF berisi GPS. Berkasnya disimpan di
  `<profil_id>/<ruang_id>/`, dan policy Storage mengikat folder pertama ke
  pemiliknya.
