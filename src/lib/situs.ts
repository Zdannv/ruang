/**
 * Keterangan penyelenggara, dipakai halaman syarat dan privasi.
 *
 * **Emailnya dari environment, dan boleh kosong.** Menuliskan alamat email
 * yang belum tentu ada di halaman kebijakan privasi lebih buruk daripada
 * tidak menuliskannya sama sekali: orang yang mau menghapus datanya akan
 * mengirim ke alamat itu dan tidak pernah dijawab. Selama belum disetel,
 * kedua halaman itu menunjuk jalur yang memang pasti sampai — percakapan di
 * dalam aplikasi.
 *
 * Setel `NEXT_PUBLIC_EMAIL_KONTAK` di Vercel begitu alamat resminya ada.
 */
export const EMAIL_KONTAK = process.env.NEXT_PUBLIC_EMAIL_KONTAK?.trim() || null;

/** Tempat aplikasinya dijalankan. Dipakai di kedua halaman ketentuan. */
export const DOMISILI = "Sidoarjo, Jawa Timur, Indonesia";

/**
 * Tanggal berlaku kedua halaman ketentuan.
 *
 * Ditulis tangan, bukan `new Date()`: tanggal yang berubah sendiri tiap
 * deployment membuat "terakhir diperbarui" jadi keterangan yang tidak berarti
 * apa-apa. Ubah saat isinya memang berubah.
 */
export const KETENTUAN_BERLAKU = "18 September 2026";
