# Ruang — starter demo

Fondasi untuk prototipe yang bisa ditunjukkan ke calon partner.
Bukan produk transaksi. Tidak ada pembayaran, e-KYC, atau escrow di sini.

## Cara pasang

1. Buat project Supabase baru (region **Southeast Asia / Singapore**).
2. SQL Editor → jalankan `01_schema.sql`, lalu `02_seed.sql`.
3. Isi Malang siap pakai: 6 host, 4 penyewa, 14 ruang, 84 foto,
   6 pemesanan di lima status berbeda, manifes, log akses, ulasan,
   dan 5 permintaan ruang.

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

Kerjakan berurutan. Jangan lompat.

1. **Halaman pencarian** — input titik + radius, panggil `ruang_terdekat`,
   tampilkan kartu. Ini layar yang paling menjual ide, kerjakan pertama.
2. **Detail ruang** — foto, rubrik kondisi lengkap, ulasan. Rubriknya jangan
   diringkas; justru kelengkapan itu yang membedakan dari OLX.
3. **Alur pesan** — pilih tanggal, isi manifes, konfirmasi. Pembayaran cukup
   tombol "Bayar (simulasi)" yang langsung mengubah status.
4. **Serah terima** — checklist manifes, ambil foto, dua tanda tangan,
   status jadi `aktif`. Ini momen "oh, gitu" saat presentasi.
5. **Dasbor host** — daftar ruang, pemesanan masuk, tombol terima/tolak.
6. **Permintaan ruang** — form waitlist + tampilan "7 orang mencari ruang di
   kecamatan Anda". Cepat dibuat, dan langsung menjelaskan strategi suplai.

## Yang sengaja palsu

| Bagian | Di demo | Di produk |
|---|---|---|
| Login | Switcher peran di pojok layar | OTP WhatsApp |
| Pembayaran | Tombol simulasi | Payment gateway berlisensi |
| Verifikasi identitas | Lencana statis | Vendor e-KYC |
| Notifikasi | Toast di layar | WhatsApp Business API |
| Kontrak | PDF contoh | Dibuat dari data pemesanan |

**Switcher peran, bukan auth.** Waktu presentasi Anda perlu lompat antara
sisi host dan sisi penyewa dalam sedetik. Auth asli menghabiskan dua sampai
tiga hari dan tidak menjelaskan apa pun ke calon partner.

## Catatan

- Uang disimpan `bigint` rupiah penuh. Jangan pernah float.
- Status pakai `text` + check constraint, bukan enum Postgres —
  enum menyakitkan diubah, dan daftar status Anda pasti bertambah.
- `pemesanan_transisi` sudah mencatat tiap perpindahan status. Di produk,
  tabel ini dan tabel bukti lainnya di-`REVOKE` update/delete-nya.
- Foto pakai `picsum.photos`. Tambahkan ke `images.remotePatterns` di
  `next.config.js`, atau pakai `<img>` biasa untuk demo.
- RLS aktif tapi permisif — demo saja. Pemisahan publik/privat menyusul.
