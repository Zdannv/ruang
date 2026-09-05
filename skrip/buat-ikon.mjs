/**
 * Membuat ikon PWA tanpa dependensi apa pun.
 *
 * Kenapa digambar sendiri alih-alih memakai pustaka: satu-satunya bentuk yang
 * dibutuhkan adalah persegi membulat + siluet rumah, dan itu bisa dihitung per
 * piksel. Menambah pustaka pengolah gambar ke dependensi produksi demi empat
 * berkas statis yang tidak pernah berubah adalah harga yang tidak sepadan.
 *
 * Jalankan ulang kalau warnanya berubah:  node skrip/buat-ikon.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const BRAND = [0x1f, 0x5f, 0xff]; // --color-brand
const PUTIH = [0xff, 0xff, 0xff];

// ── PNG ──────────────────────────────────────────────────────────────────────
const tabelCrc = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (const b of buf) c = tabelCrc[(c ^ b) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(jenis, data) {
  const panjang = Buffer.alloc(4);
  panjang.writeUInt32BE(data.length);
  const isi = Buffer.concat([Buffer.from(jenis, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(isi));
  return Buffer.concat([panjang, isi, crc]);
}

function png(lebar, tinggi, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lebar, 0);
  ihdr.writeUInt32BE(tinggi, 4);
  ihdr[8] = 8; // kedalaman bit
  ihdr[9] = 6; // RGBA
  const baris = Buffer.alloc((lebar * 4 + 1) * tinggi);
  for (let y = 0; y < tinggi; y++) {
    baris[y * (lebar * 4 + 1)] = 0; // filter: none
    rgba.copy(baris, y * (lebar * 4 + 1) + 1, y * lebar * 4, (y + 1) * lebar * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(baris, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── gambar ───────────────────────────────────────────────────────────────────

/** Jarak ke persegi membulat; negatif berarti di dalam. */
function persegiMembulat(x, y, kiri, atas, kanan, bawah, jari) {
  const dx = Math.max(kiri + jari - x, 0, x - (kanan - jari));
  const dy = Math.max(atas + jari - y, 0, y - (bawah - jari));
  return Math.hypot(dx, dy) - jari;
}

/**
 * Siluet rumah: atap segitiga + badan persegi.
 *
 * Bentuknya sengaja sama dengan lambang di header aplikasi, supaya ikon di
 * layar utama dan lambang di dalam aplikasi terbaca sebagai satu hal.
 */
function didalamRumah(x, y, cx, cy, ukuran) {
  const u = ukuran;
  const px = (x - cx) / u;
  const py = (y - cy) / u;

  // Atap: segitiga dari puncak (0, -0.5) ke dua sudut (±0.5, -0.05).
  if (py >= -0.5 && py <= -0.05) {
    const lebarDiSini = ((py + 0.5) / 0.45) * 0.5;
    if (Math.abs(px) <= lebarDiSini) return true;
  }
  // Badan.
  if (py > -0.05 && py <= 0.42 && Math.abs(px) <= 0.34) {
    // Pintu dilubangi supaya siluetnya terbaca sebagai rumah, bukan panah.
    const pintu = py > 0.1 && Math.abs(px) <= 0.12;
    return !pintu;
  }
  return false;
}

function buat(ukuran, { maskable = false } = {}) {
  const SS = 4; // supersampling, supaya tepinya tidak bergerigi
  const buf = Buffer.alloc(ukuran * ukuran * 4);

  // Ikon maskable dipotong sistem jadi lingkaran/squircle, jadi latarnya penuh
  // dan gambarnya dikecilkan ke zona aman 80%.
  const jariSudut = maskable ? 0 : ukuran * 0.22;
  const ukuranRumah = ukuran * (maskable ? 0.46 : 0.58);

  for (let y = 0; y < ukuran; y++) {
    for (let x = 0; x < ukuran; x++) {
      let latar = 0;
      let rumah = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (maskable || persegiMembulat(px, py, 0, 0, ukuran, ukuran, jariSudut) <= 0) {
            latar++;
          }
          if (didalamRumah(px, py, ukuran / 2, ukuran / 2, ukuranRumah)) rumah++;
        }
      }
      const total = SS * SS;
      const aLatar = latar / total;
      const aRumah = (rumah / total) * aLatar;

      const i = (y * ukuran + x) * 4;
      for (let k = 0; k < 3; k++) {
        buf[i + k] = Math.round(BRAND[k] * (1 - aRumah) + PUTIH[k] * aRumah);
      }
      buf[i + 3] = Math.round(aLatar * 255);
    }
  }
  return png(ukuran, ukuran, buf);
}

const berkas = [
  ["public/icon-192.png", buat(192)],
  ["public/icon-512.png", buat(512)],
  ["public/icon-maskable-512.png", buat(512, { maskable: true })],
  // Safari tidak memakai manifest untuk ikon layar utama; ia mencari
  // apple-touch-icon, dan ikon itu tidak boleh transparan karena iOS tidak
  // menambahkan latar sendiri.
  ["public/apple-touch-icon.png", buat(180, { maskable: true })],
];

for (const [jalur, isi] of berkas) {
  writeFileSync(jalur, isi);
  console.log(`${jalur} — ${(isi.length / 1024).toFixed(1)} KB`);
}
