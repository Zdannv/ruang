import { redirect } from "next/navigation";
import type { Metadata } from "next";
import DaftarNotifikasi from "./DaftarNotifikasi";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { daftarNotifikasi } from "@/lib/notifikasi";

export const metadata: Metadata = { title: "Notifikasi — Ruang" };

export default async function HalamanNotifikasi() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/notifikasi");

  const db = await klienServer();
  const daftar = await daftarNotifikasi(db);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Notifikasi
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Email dan WhatsApp menyusul — keduanya menunggu penyedia di luar.
      </p>

      <DaftarNotifikasi awal={daftar} />
    </div>
  );
}
