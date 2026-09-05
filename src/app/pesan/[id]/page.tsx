import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPinned } from "lucide-react";
import Utas from "./Utas";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { getPercakapan, tandaiUtasDibaca } from "@/lib/percakapan";

export const metadata: Metadata = { title: "Percakapan — Ruang" };

export default async function HalamanUtas({ params }: PageProps<"/pesan/[id]">) {
  const { id } = await params;
  const sesi = await sesiSaya();
  if (!sesi) redirect(`/masuk?lanjut=/pesan/${id}`);

  const db = await klienServer();
  const data = await getPercakapan(db, id);
  // `null` berarti utasnya tidak ada ATAU bukan milik pemanggil — RLS
  // menyaringnya lebih dulu, dan dua-duanya dijawab 404 yang sama.
  if (!data) notFound();

  const { utas, pesan } = data;
  const sayaId = sesi.profil?.id ?? "";
  const sayaHost = sayaId === utas.host_id;

  // Ditandai dibaca saat halamannya dibuka. Menandainya dari klien setelah
  // render akan membuat lencana berkedip sekali sebelum hilang.
  await tandaiUtasDibaca(db, id, sayaHost ? "host" : "penyewa");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href="/pesan"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Semua pesan
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          {utas.judul}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {utas.kecamatan}, {utas.kota} ·{" "}
          {sayaHost ? "kamu host di sini" : `Host: ${utas.host_nama}`} ·{" "}
          <Link
            href={`/ruang/${utas.ruang_id}`}
            className="font-semibold text-brand hover:text-brand-dark"
          >
            Lihat ruangnya
          </Link>
        </p>
      </header>

      {utas.alamat_dibuka_pada && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-good-soft px-4 py-3 text-sm leading-relaxed text-good">
          <MapPinned className="mt-0.5 h-4 w-4 shrink-0" />
          {sayaHost
            ? "Kamu sudah membuka alamat untuk penyewa ini."
            : "Host sudah membuka alamatnya. Alamat lengkap dan patokan terlihat di halaman ruang."}
        </p>
      )}

      <Utas
        percakapanId={utas.id}
        pesanAwal={pesan}
        sayaId={sayaId}
        sayaHost={sayaHost}
        alamatSudahDibuka={utas.alamat_dibuka_pada !== null}
      />
    </div>
  );
}
