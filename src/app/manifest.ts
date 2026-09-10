import type { MetadataRoute } from "next";

/**
 * Manifest PWA.
 *
 * Web app / PWA adalah keputusan produk yang dikunci (nomor 4 di CLAUDE.md):
 * bukan native, dan mobile-first. Berkas inilah yang membuat "web app" itu
 * benar-benar bisa dipasang di layar utama, bukan cuma situs yang kebetulan
 * responsif.
 *
 * `display: "standalone"` menghilangkan bilah alamat peramban. Konsekuensinya
 * tombol back peramban ikut hilang, dan itu sudah tertangani: setiap layar
 * dalam punya tautan kembali sendiri.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cari Ruang · lahan nganggur jadi cuan",
    short_name: "Cari Ruang",
    description:
      "Sewa halaman depan atau lahan kosong di pinggir jalan buat jualan. Bulanan, langsung dari pemiliknya.",
    lang: "id",
    dir: "ltr",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Sama dengan --color-paper dan --color-brand di globals.css. Layar
    // pembuka memakai warna latar, jadi peralihannya tidak berkedip putih.
    background_color: "#eef2f9",
    theme_color: "#a93b20",
    categories: ["shopping", "business", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Ikon maskable dipotong sistem jadi lingkaran atau squircle; gambarnya
      // dikecilkan ke zona aman supaya atap rumahnya tidak terpangkas.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Cari lahan",
        short_name: "Cari",
        url: "/cari",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Pemesanan saya",
        short_name: "Pemesanan",
        url: "/pemesanan",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Lahan yang kusewakan",
        short_name: "Sewakan",
        url: "/host",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
