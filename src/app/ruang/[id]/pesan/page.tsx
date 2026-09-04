import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import FormPesan from "./FormPesan";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { getRuangUntukPesan } from "@/lib/pemesanan";

export const metadata: Metadata = { title: "Ajukan sewa — Ruang" };

/**
 * Formulir pengajuan sewa.
 *
 * Wajib masuk, dan pengalihannya membawa `lanjut` supaya orang kembali ke
 * formulir ini setelah login — bukan mendarat di beranda dan harus mencari
 * ruangnya lagi dari awal.
 */
export default async function HalamanPesan({ params }: PageProps<"/ruang/[id]/pesan">) {
  const { id } = await params;
  const sesi = await sesiSaya();
  if (!sesi) redirect(`/masuk?lanjut=/ruang/${id}/pesan`);

  const db = await klienServer();
  const ruang = await getRuangUntukPesan(db, id);
  if (!ruang) notFound();

  const ruangSendiri = sesi.profil?.id === ruang.host_id;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href={`/ruang/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke detail ruang
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Ajukan sewa
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Pilih tanggalnya dan daftarkan barang yang akan disimpan. Permintaan ini masih
        bisa ditolak host, dan belum ada pembayaran di langkah ini.
      </p>

      <div className="mt-6">
        {ruangSendiri ? (
          <div className="rounded-2xl bg-card p-6 ring-1 ring-line">
            <p className="text-sm font-semibold">Ini ruangmu sendiri</p>
            <p className="mt-1.5 text-sm text-muted">
              Host tidak bisa menyewa ruangnya sendiri. Kelola permintaan yang masuk di{" "}
              <Link href="/pemesanan" className="font-semibold text-brand hover:text-brand-dark">
                daftar pemesanan
              </Link>
              .
            </p>
          </div>
        ) : (
          <FormPesan ruang={ruang} />
        )}
      </div>
    </div>
  );
}
