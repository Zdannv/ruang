import type { NextConfig } from "next";

/**
 * Host penyimpanan foto diturunkan dari URL Supabase, bukan ditulis tangan.
 *
 * Foto yang diunggah host mendarat di
 * `https://<ref>.supabase.co/storage/v1/object/public/ruang-foto/...`, dan
 * `next/image` menolak host yang tidak terdaftar. Menuliskannya manual berarti
 * project yang berbeda (staging, milik orang lain yang meng-clone repo ini)
 * gambarnya diam-diam tidak muncul.
 */
const hostSupabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Service worker tidak boleh di-cache: kalau versi lamanya menempel,
        // perbaikan di dalamnya tidak pernah sampai ke perangkat orang.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  images: {
    /*
      31 hari, jauh di atas bawaan 4 jam.

      Ini yang menentukan seberapa sering Vercel menarik ULANG berkas aslinya
      dari Supabase. Tiap tarikan itu memotong kuota egress 5 GB/bulan, yang
      merupakan langit-langit paling sempit di paket gratis, dan dengan bawaan
      4 jam satu foto yang sama ditarik enam kali sehari.

      Aman karena berkasnya immutable: tiap nama memuat UUID dan tidak pernah
      ditimpa (lihat `src/lib/cacheBerkas.ts`). Dokumentasi Next memperingatkan
      agar nilainya tetap rendah karena cache-nya tidak bisa dibatalkan, dan
      peringatan itu berlaku untuk sumber yang isinya bisa berubah di alamat
      yang sama. Di sini foto yang diganti host selalu punya alamat baru.
    */
    minimumCacheTTL: 2_678_400,
    remotePatterns: [
      // Foto isi seed (lihat 02_seed.sql). Bisa dicabut begitu seluruh isinya
      // diganti foto sungguhan.
      { protocol: "https", hostname: "picsum.photos" },
      ...(hostSupabase
        ? [{ protocol: "https" as const, hostname: hostSupabase, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
};

export default nextConfig;
