"use client";

import { usePathname } from "next/navigation";

/**
 * Menyembunyikan kerangka sisi penyewa di area pemilik lahan.
 *
 * Header, footer, dan navigasi bawah semuanya ada untuk menjelajah listing;
 * di `/host` orangnya sedang bekerja, dan ketiganya cuma mengambil ruang.
 * Area itu punya kerangkanya sendiri di `app/host/layout.tsx`.
 *
 * Dipilih ini, bukan route group `(publik)`, karena route group berarti
 * memindahkan lima belas direktori rute demi satu perbedaan tampilan. Isinya
 * tetap dirender di server dan dioper sebagai `children`; `sesiSaya()`
 * dibungkus `cache()` per request, jadi header yang tidak jadi tampil tidak
 * menambah satu pun kueri.
 */
export default function TanpaDiHost({ children }: { children: React.ReactNode }) {
  const jalur = usePathname();
  if (jalur?.startsWith("/host")) return null;
  return <>{children}</>;
}
