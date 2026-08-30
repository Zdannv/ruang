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

**Tahap saat ini: prototipe untuk dipresentasikan ke calon partner.**
Bukan produk transaksi. Jangan bangun pembayaran asli, e-KYC, atau escrow.

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

1. Halaman pencarian — titik + radius + filter, kartu hasil. **Kerjakan pertama**,
   ini layar yang paling menjual ide.
2. Detail ruang — foto, rubrik kondisi lengkap, ulasan. Jangan ringkas
   rubriknya; kelengkapan itu yang membedakan dari OLX.
3. Alur pesan — tanggal, manifes, konfirmasi, tombol "Bayar (simulasi)".
4. Serah terima — checklist manifes, foto, dua tanda tangan, status jadi aktif.
   Ini momen paling meyakinkan saat presentasi.
5. Dasbor host.
6. Permintaan ruang (waitlist) + "7 orang mencari ruang di kecamatan Anda".

Kalau waktu mepet: nomor 1 dan 4 saja sudah cukup untuk presentasi.

## Yang sengaja palsu di demo

| Bagian | Demo | Produk nanti |
|---|---|---|
| Login | **Switcher peran di pojok layar** | OTP WhatsApp |
| Pembayaran | Tombol simulasi | Payment gateway berlisensi |
| Verifikasi | Lencana statis | Vendor e-KYC |
| Notifikasi | Toast | WhatsApp Business API |
| Kontrak | PDF contoh | Dibuat dari data pemesanan |

Switcher peran, bukan auth asli — saat presentasi harus bisa lompat antara
sisi host dan penyewa dalam sedetik.

## Stack

Next.js (App Router) di Vercel · Supabase (Postgres + Storage) region Singapura ·
Railway untuk worker & penjadwal (belum dibutuhkan di tahap demo).

Unggah foto lewat signed URL langsung ke Supabase Storage, jangan lewat
API route — mahal di bandwidth dan kena batas waktu fungsi.

## Bahasa

Seluruh UI dan copy dalam Bahasa Indonesia. Nama kolom database juga
Bahasa Indonesia (sudah begitu di schema) — konsisten, jangan campur.

@AGENTS.md
