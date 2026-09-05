"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan service worker.
 *
 * Hanya di production, dan itu disengaja. Di pengembangan, service worker yang
 * menyimpan aset membuat perubahan kode tampak tidak berlaku — orang mengubah
 * satu baris, memuat ulang, dan melihat versi lama, lalu menghabiskan waktu
 * mencari bug yang tidak ada. Di produksi aset Next.js namanya mengandung hash
 * isi, jadi masalah itu tidak muncul.
 */
export default function DaftarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Gagal mendaftar bukan alasan merusak halaman: aplikasinya tetap jalan
      // penuh tanpa service worker, cuma tanpa halaman offline.
    });
  }, []);

  return null;
}
