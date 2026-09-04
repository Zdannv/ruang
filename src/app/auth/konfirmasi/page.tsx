import { Suspense } from "react";
import type { Metadata } from "next";
import KonfirmasiIsi from "./KonfirmasiIsi";

export const metadata: Metadata = { title: "Konfirmasi email — Ruang" };

export default function HalamanKonfirmasi() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <KonfirmasiIsi />
    </Suspense>
  );
}
