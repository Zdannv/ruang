"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, MapPin, Phone, X } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  LABEL_VERIFIKASI,
  putuskanVerifikasi,
  type BarisVerifikasi,
} from "@/lib/verifikasi";
import { LABEL_TIPE, tanggalJam } from "@/lib/label";

/**
 * Satu kartu per pengajuan, dengan alamat lengkap dan nomor pemiliknya.
 *
 * Keduanya memang dibutuhkan petugas untuk datang, dan keduanya TIDAK ADA di
 * permukaan publik mana pun — sumbernya `antrean_verifikasi()`, fungsi
 * SECURITY DEFINER yang menolak siapa pun yang bukan admin di baris pertama.
 */
export default function AntreanVerifikasi({ awal }: { awal: BarisVerifikasi[] }) {
  const router = useRouter();
  const [proses, setProses] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  /** Catatan yang sedang diketik, per lahan. */
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  const putuskan = async (id: string, setujui: boolean) => {
    setProses(id);
    setGalat(null);
    try {
      await putuskanVerifikasi(klienBrowser(), id, setujui, catatan[id]);
      setCatatan((c) => ({ ...c, [id]: "" }));
      router.refresh();
    } catch (e: unknown) {
      // Pesan galat dari RPC memang ditulis untuk dibaca orang ("Tulis alasan
      // penolakannya…"), jadi diteruskan apa adanya.
      setGalat(e instanceof Error ? e.message : "Gagal menyimpan keputusan.");
    } finally {
      setProses(null);
    }
  };

  if (awal.length === 0) {
    return (
      <p className="mt-6 rounded-2xl bg-card p-6 text-sm text-muted ring-1 ring-line">
        Belum ada pengajuan sama sekali. Pemilik mengajukannya dari halaman kelola
        lahannya masing-masing.
      </p>
    );
  }

  return (
    <>
      {galat && (
        <p className="mt-4 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}

      <ul className="mt-6 space-y-4">
        {awal.map((a) => {
          const menunggu = a.verifikasi === "diajukan";
          return (
            <li
              key={a.id}
              className={`rounded-2xl p-5 ring-1 ${
                menunggu ? "bg-card ring-brand/30" : "bg-paper ring-line"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug">{a.judul}</p>
                  <p className="mt-1 text-xs text-muted">
                    {LABEL_TIPE[a.tipe as keyof typeof LABEL_TIPE] ?? a.tipe} ·{" "}
                    {a.jumlah_foto} foto · listing {a.status}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    a.verifikasi === "terverifikasi"
                      ? "bg-good-soft text-good"
                      : a.verifikasi === "ditolak"
                        ? "bg-warn-soft text-warn"
                        : "bg-brand-soft text-brand-dark"
                  }`}
                >
                  {LABEL_VERIFIKASI[a.verifikasi]}
                </span>
              </div>

              <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="sr-only">Alamat</span>
                  </dt>
                  <dd className="min-w-0">
                    {a.alamat}
                    {a.patokan ? ` (${a.patokan})` : ""} — {a.kelurahan}, {a.kecamatan},{" "}
                    {a.kota}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1.5 inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark"
                    >
                      peta
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="sr-only">Pemilik</span>
                  </dt>
                  <dd className="angka">
                    {a.host_nama} · {a.host_telepon}
                  </dd>
                </div>
                {a.verifikasi_diajukan_pada && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted">Diajukan</dt>
                    <dd className="angka">{tanggalJam(a.verifikasi_diajukan_pada)}</dd>
                  </div>
                )}
                {a.verifikasi_pada && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted">Diputuskan</dt>
                    <dd className="angka">{tanggalJam(a.verifikasi_pada)}</dd>
                  </div>
                )}
                {a.verifikasi_catatan && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted">Catatan</dt>
                    <dd>{a.verifikasi_catatan}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/ruang/${a.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-xs font-semibold text-ink ring-1 ring-line hover:bg-paper"
                >
                  Lihat listingnya
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {menunggu && (
                <div className="mt-3 border-t border-line pt-3">
                  <label htmlFor={`catatan-${a.id}`} className="text-xs font-medium">
                    Catatan {""}
                    <span className="font-normal text-muted">
                      (wajib kalau menolak — ini yang dibaca pemiliknya)
                    </span>
                  </label>
                  <textarea
                    id={`catatan-${a.id}`}
                    rows={2}
                    value={catatan[a.id] ?? ""}
                    onChange={(e) =>
                      setCatatan((c) => ({ ...c, [a.id]: e.target.value }))
                    }
                    placeholder="mis. lebar mukanya 2 m, di listing tertulis 4 m"
                    className="mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={proses !== null}
                      onClick={() => putuskan(a.id, true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-good px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {proses === a.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Sesuai — verifikasi
                    </button>
                    <button
                      type="button"
                      disabled={proses !== null}
                      onClick={() => putuskan(a.id, false)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-warn px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                      Tidak sesuai
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
