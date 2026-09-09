/**
 * Memasang gambar sorotan halaman depan.
 *
 * Pakai:  node skrip/pasang-sorotan.mjs gambar-1.png gambar-2.png
 *
 * Urutannya menentukan urutan tampil, jadi yang pertama harus yang memuat
 * slogan utama. Hasilnya `public/promo/sorotan-1.webp`, `-2.webp`, dan
 * seterusnya — nama itu yang dibaca `SorotanPromo`.
 *
 * Kenapa dikonversi dan tidak dipakai apa adanya:
 *
 *   1. WebP. Ilustrasi berwarna rata seperti ini biasanya turun 60-75% dari
 *      PNG tanpa perbedaan yang terlihat.
 *   2. Lebar dibatasi 1400px. Kartunya tampil paling lebar sekitar 700px di
 *      laptop, jadi 1400 sudah cukup untuk layar 2x; menyimpan 2000px berarti
 *      mengirim piksel yang tidak pernah dilihat siapa pun.
 *   3. RASIONYA DISERAGAMKAN. Kalau kedua gambar beda rasio, tinggi kartu
 *      melompat setiap kali digeser — dan di strip snap itu terasa seperti
 *      cacat, bukan variasi.
 *
 *      Caranya BUKAN memangkas. Versi pertama skrip ini memangkas dari tengah
 *      ke rasio yang paling lebar, dan itu memotong judul di atas serta
 *      lambang di bawah — persis dua bagian yang paling penting. Ketahuan saat
 *      diuji dengan gambar berbingkai, bukan dari membaca kodenya.
 *
 *      Yang dipakai: rasio bersama = RATA-RATA GEOMETRIS dari rasio semua
 *      gambar, dan setiap gambar diberi bingkai `contain` ke sana. Warna
 *      bingkainya diambil dari piksel sudut gambar itu sendiri, jadi tidak
 *      terlihat sebagai bingkai.
 *
 *      Kenapa rata-rata dan bukan yang paling tinggi: dengan 1,31 dan 1,79,
 *      menyeragamkan ke 1,31 memberi bingkai 18% pada gambar yang lebar —
 *      cukup besar untuk terbaca sebagai kesalahan. Rata-rata geometris
 *      (1,53) membagi bebannya: keduanya cuma dapat sekitar 8-9%, dan tidak
 *      satu piksel pun dibuang.
 *
 * Angka sebelum-sesudahnya dicetak, karena gambar sorotan diunduh di SETIAP
 * kunjungan halaman depan — kalau ia membengkak, itu harus terlihat di sini
 * dan bukan ditemukan dari tagihan bandwidth.
 */
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const LEBAR_MAKS = 1400;
const MUTU = 80;
const KELUAR = path.join(process.cwd(), "public", "promo");

const masuk = process.argv.slice(2);
if (masuk.length === 0) {
  console.error("Pakai: node skrip/pasang-sorotan.mjs <gambar...>");
  process.exit(1);
}

await mkdir(KELUAR, { recursive: true });

// Warna sudut kiri-atas tiap gambar — dipakai sebagai warna bingkai, supaya
// bingkainya menyatu dengan latar gambarnya sendiri.
async function warnaSudut(f) {
  const { data } = await sharp(f)
    .extract({ left: 0, top: 0, width: 8, height: 8 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { r: data[0], g: data[1], b: data[2], alpha: 1 };
}

const asli = await Promise.all(
  masuk.map(async (f) => {
    const m = await sharp(f).metadata();
    return { f, w: m.width ?? 0, h: m.height ?? 0, latar: await warnaSudut(f) };
  })
);

// Rata-rata geometris — lihat catatan 3.
const rasio = Math.exp(
  asli.reduce((t, a) => t + Math.log(a.w / a.h), 0) / asli.length
);
console.log(
  `Rasio bersama: ${rasio.toFixed(3)}  (dari ${asli.map((a) => (a.w / a.h).toFixed(3)).join(", ")})\n`
);

const lebar = Math.min(LEBAR_MAKS, Math.max(...asli.map((a) => a.w)));
const tinggi = Math.round(lebar / rasio);

for (const [i, a] of asli.entries()) {
  const nama = `sorotan-${i + 1}.webp`;
  const tujuan = path.join(KELUAR, nama);
  await sharp(a.f)
    // `contain`, bukan `cover`: tidak ada satu piksel pun yang dibuang.
    .resize(lebar, tinggi, { fit: "contain", background: a.latar })
    .webp({ quality: MUTU })
    .toFile(tujuan);

  const sebelum = (await stat(a.f)).size;
  const sesudah = (await stat(tujuan)).size;
  console.log(
    `${path.basename(a.f)}  ${a.w}×${a.h} ${(sebelum / 1024).toFixed(0)} KB` +
      `  →  ${nama}  ${lebar}×${tinggi} ${(sesudah / 1024).toFixed(0)} KB` +
      `  (${(100 - (sesudah / sebelum) * 100).toFixed(0)}% lebih kecil)`
  );
}

console.log(`\nRasio kartu untuk SorotanPromo: ${lebar} / ${tinggi}`);
