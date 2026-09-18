/**
 * Umur cache untuk setiap berkas yang diunggah ke Supabase Storage.
 *
 * **Setahun, dan itu aman karena berkasnya tidak pernah berubah.** Tiap nama
 * berkas memuat `crypto.randomUUID()` dan tiap unggahan memakai
 * `upsert: false`, jadi satu nama selamanya menunjuk isi yang sama persis.
 * Foto yang diganti host adalah berkas BARU dengan nama baru, bukan berkas
 * lama yang ditimpa. Cache panjang untuk berkas yang bisa ditimpa akan
 * menyajikan isi basi; di sini keadaan itu tidak bisa terjadi.
 *
 * **Bawaan Supabase Storage cuma 3600 detik, satu jam**, dan itu yang selama
 * ini berlaku. Akibatnya tiap foto diunduh ULANG dari Supabase setiap jam,
 * per pengunjung, dan tiap unduhan itu memotong kuota egress 5 GB/bulan yang
 * jadi langit-langit paling sempit di paket gratis.
 *
 * Nilainya juga menentukan berapa lama Vercel menahan salinan hasil
 * optimasinya: umur yang dipakai adalah yang TERBESAR antara `minimumCacheTTL`
 * di `next.config.ts` dan header ini. Jadi keduanya harus panjang, bukan salah
 * satu.
 */
export const CACHE_SETAHUN = "31536000";
