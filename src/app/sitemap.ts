import type { MetadataRoute } from "next";
import { klienServer } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";

/** Peta situs dihitung ulang paling sering sejam sekali. */
export const revalidate = 3600;

const STATIS: { path: string; prioritas: number; ubah: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", prioritas: 1, ubah: "daily" },
  { path: "/cari", prioritas: 0.9, ubah: "daily" },
  { path: "/permintaan", prioritas: 0.6, ubah: "weekly" },
  { path: "/masuk", prioritas: 0.3, ubah: "monthly" },
  { path: "/daftar", prioritas: 0.4, ubah: "monthly" },
  { path: "/syarat", prioritas: 0.2, ubah: "monthly" },
  { path: "/privasi", prioritas: 0.2, ubah: "monthly" },
];

/**
 * Peta situs, berisi halaman umum plus setiap lahan yang sedang tayang.
 *
 * **Halaman lahan yang paling penting ada di sini, bukan halaman depannya.**
 * Orang tidak mencari "aplikasi sewa lahan"; ia mencari "sewa tempat jualan
 * Waru" dan yang menjawabnya adalah listing itu sendiri. Tanpa peta situs,
 * halaman lahan cuma bisa ditemukan lewat `/cari`, yang isinya dirender di
 * peramban dan tidak menyediakan satu pun tautan untuk diikuti perayap.
 *
 * Diambil dari `ruang_publik`, jadi yang masuk hanya yang statusnya tayang,
 * dan tidak ada satu pun kolom rahasia yang bisa ikut terbawa.
 *
 * Gagalnya dijawab daftar statis, bukan galat. Peta situs yang kosong sehari
 * cuma menunda perayapan; peta situs yang menjawab 500 membuat mesin pencari
 * berhenti memintanya.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dasar: MetadataRoute.Sitemap = STATIS.map((s) => ({
    url: siteUrl(s.path),
    changeFrequency: s.ubah,
    priority: s.prioritas,
  }));

  try {
    const db = await klienServer();
    const { data, error } = await db
      .from("ruang_publik")
      .select("id, dibuat_pada")
      .limit(5000);
    if (error) throw error;

    return [
      ...dasar,
      ...(data ?? []).map((r) => ({
        url: siteUrl(`/ruang/${r.id}`),
        // `ruang_publik` tidak memuat waktu ubah, cuma waktu dibuat. Itu yang
        // dipakai: tanggal yang salah arah lebih baik daripada tidak ada
        // tanggal sama sekali, dan perayap tetap datang lagi lewat
        // changeFrequency.
        lastModified: r.dibuat_pada ? new Date(r.dibuat_pada) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return dasar;
  }
}
