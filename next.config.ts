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
