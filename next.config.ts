import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Foto demo berasal dari picsum.photos (lihat 02_seed.sql). Di produk,
    // foto diunggah lewat signed URL langsung ke Supabase Storage — ganti
    // pola ini dengan host storage-nya saat itu tiba.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
