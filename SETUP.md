# Ruang — cara memasang

Panduan menyiapkan lingkungan pengembangan.

Sejak 4 September 2026 repo ini bukan lagi prototipe presentasi, melainkan
pengembangan produk sungguhan — lihat "Tahap saat ini" di CLAUDE.md. Pembayaran,
e-KYC, dan notifikasi WhatsApp masih belum ada karena menunggu lisensi dan akun
pihak luar, bukan karena sengaja dipalsukan.

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
- **RLS aktif tapi masih permisif** (semua boleh baca dan tulis). Ini utang
  paling mendesak dan dibereskan bersama auth — jangan menaruh data sungguhan
  di database ini sebelum itu selesai.
