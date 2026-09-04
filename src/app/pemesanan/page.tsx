import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Inbox, MapPin } from "lucide-react";
import LencanaStatus from "@/components/LencanaStatus";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { daftarPemesanan, type PemesananRingkas } from "@/lib/pemesanan";
import { LABEL_TIPE, rupiah, tanggalPendek } from "@/lib/label";

export const metadata: Metadata = { title: "Pemesanan — Ruang" };

/**
 * Daftar pemesanan, dua sisi dalam satu halaman.
 *
 * Satu akun bisa sekaligus menyewa dan menyewakan — itu memang bentuk produknya
 * ("siapa pun yang punya ruang kosong bisa menyewakannya"). Jadi tidak ada
 * pemilihan peran di awal; yang ada dua bagian, dan bagian host disembunyikan
 * kalau orangnya belum punya ruang yang dipesan siapa pun.
 */
export default async function HalamanPemesanan() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/pemesanan");

  const db = await klienServer();
  const semua = await daftarPemesanan(db);
  const sayaId = sesi.profil?.id ?? null;

  const sebagaiPenyewa = semua.filter((p) => p.penyewa_id === sayaId);
  const sebagaiHost = semua.filter((p) => p.host_id === sayaId);
  const perluDitindak = sebagaiHost.filter((p) => p.status === "menunggu_konfirmasi").length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Pemesanan
      </h1>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold tracking-tight">Sewa saya</h2>
        {sebagaiPenyewa.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-card p-5 text-sm text-muted ring-1 ring-line">
            Belum ada.{" "}
            <Link href="/" className="font-semibold text-brand hover:text-brand-dark">
              Cari ruang
            </Link>{" "}
            dulu.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sebagaiPenyewa.map((p) => (
              <li key={p.id}>
                <Kartu p={p} peran="penyewa" />
              </li>
            ))}
          </ul>
        )}
      </section>

      {sebagaiHost.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Permintaan ke ruang saya
            </h2>
            {perluDitindak > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
                <Inbox className="h-3.5 w-3.5" />
                {perluDitindak} menunggu jawabanmu
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-3">
            {sebagaiHost.map((p) => (
              <li key={p.id}>
                <Kartu p={p} peran="host" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Kartu({ p, peran }: { p: PemesananRingkas; peran: "penyewa" | "host" }) {
  return (
    <Link
      href={`/pemesanan/${p.id}`}
      className="flex gap-4 rounded-2xl bg-card p-3 ring-1 ring-line transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-line sm:h-24 sm:w-32">
        {p.foto && (
          <Image src={p.foto} alt="" fill sizes="128px" className="object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">{p.judul}</p>
          <LencanaStatus status={p.status} />
        </div>

        <p className="angka mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {LABEL_TIPE[p.tipe as keyof typeof LABEL_TIPE] ?? p.tipe} · {p.kecamatan}
        </p>

        <p className="angka mt-2 text-xs text-muted">
          {tanggalPendek(p.mulai)} – {tanggalPendek(p.selesai)}
        </p>
        <p className="angka mt-0.5 text-sm font-semibold">
          {rupiah(p.total)}
          {peran === "host" && (
            <span className="ml-1 text-xs font-medium text-muted">masuk ke kamu</span>
          )}
        </p>
      </div>
    </Link>
  );
}
