import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/supabase/env";

/**
 * Yang boleh dan tidak boleh diindeks mesin pencari.
 *
 * Yang dilarang bukan rahasia, dan bukan itu alasannya: seluruh rute di daftar
 * `disallow` menampilkan isi yang bergantung pada siapa yang sedang masuk, jadi
 * yang dilihat perayap selalu halaman masuk. Membiarkannya berarti hasil
 * pencarian penuh dengan salinan halaman masuk yang sama, dan anggaran rayapan
 * habis di situ alih-alih di halaman lahan.
 *
 * `/api/` dilarang karena ia bukan halaman sama sekali.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/host", "/pesan", "/profil", "/notifikasi", "/auth/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
