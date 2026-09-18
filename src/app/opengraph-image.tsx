import { ImageResponse } from "next/og";

export const alt = "Ada Tempat, sewa tempat usaha jadi gampang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Gambar pratinjau saat tautan aplikasi ini dibagikan.
 *
 * **Penyebarannya lewat grup WhatsApp, dan itu yang menentukan
 * rancangannya.** Tautan tanpa gambar tampil sebagai satu baris teks kecil di
 * antara puluhan pesan lain; tautan bergambar memakan seperempat layar. Untuk
 * aplikasi yang belum punya iklan dan belum punya SEO, satu-satunya jalur
 * masuk yang tersedia adalah orang yang meneruskan tautannya ke grup.
 *
 * Dibuat `next/og` alih-alih berkas PNG di `public/`: PNG statis berarti satu
 * berkas lagi yang harus diingat orang saat sloganya berubah, dan ia sudah
 * pernah terjadi di lambang (lihat CLAUDE.md nomor 29, geometri yang hidup di
 * tiga tempat). Di sini teksnya cuma ada di satu tempat, yaitu di bawah ini.
 *
 * Lambangnya digambar ulang sebagai elemen `<svg>` dan BUKAN diimpor dari
 * `public/ikon.svg`: satori merender di server tanpa memuat berkas luar, dan
 * jalur yang salah akan menghasilkan gambar kosong tanpa satu pun galat.
 * Kalau geometri lambangnya berubah, berkas ini ikut keempat tempat lain.
 */
export default function GambarOg() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#a93b20",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14.1" fill="#fff" />
            <path
              fill="#a93b20"
              d="M19.8 16 H44.2 L51 30.3 A6.33 4.85 0 0 1 38.33 30.3 A6.33 4.85 0 0 1 25.67 30.3 A6.33 4.85 0 0 1 13 30.3 Z"
            />
            <rect x="10.9" y="43" width="42.2" height="3.8" fill="#a93b20" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>
            Ada Tempat
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#fff",
              letterSpacing: -2,
            }}
          >
            Sewa tempat usaha
          </span>
          <span
            style={{
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#fdeee8",
              letterSpacing: -2,
            }}
          >
            jadi gampang.
          </span>
        </div>

        <span style={{ fontSize: 30, color: "#fdeee8" }}>
          Halaman depan, teras, atau lahan kosong. Bulanan, langsung dari pemiliknya.
        </span>
      </div>
    ),
    size
  );
}
