import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import DaftarRuangBaru from "@/components/host/DaftarRuangBaru";
import { sesiSaya } from "@/lib/auth";

export const metadata: Metadata = { title: "Daftarkan ruang — Ruang" };

export default async function RuangBaru() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/host/ruang/baru");
  if (!sesi.profil) redirect("/host");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/host"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Dasbor host
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Daftarkan ruang
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Dua langkah: keterangan ruangnya dulu, lalu fotonya. Simpan sebagai draf
        kalau belum yakin — draf tidak terlihat siapa pun sampai kamu menayangkannya.
      </p>

      <DaftarRuangBaru hostId={sesi.profil.id} />
    </div>
  );
}
