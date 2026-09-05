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
