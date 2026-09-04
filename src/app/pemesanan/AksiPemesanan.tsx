"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  batalkanPemesanan,
  konfirmasiPemesanan,
  tolakPemesanan,
} from "@/lib/pemesanan";

type Aksi = "terima" | "tolak" | "batalkan";

/**
 * Tombol keputusan atas satu pemesanan.
 *
 * Semuanya memanggil RPC; tidak ada satu pun yang menyentuh kolom `status`
 * langsung, karena klien memang tidak punya haknya. Kalau RPC menolak — status
 * sudah berubah, tanggalnya sudah diambil orang lain — pesannya ditampilkan apa
 * adanya, karena pesan itu ditulis untuk dibaca orang.
 */
export default function AksiPemesanan({
  pemesananId,
  bolehTerima,
  bolehTolak,
  bolehBatalkan,
}: {
  pemesananId: string;
  bolehTerima: boolean;
  bolehTolak: boolean;
  bolehBatalkan: boolean;
}) {
  const router = useRouter();
  const [proses, setProses] = useState<Aksi | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [mintaCatatan, setMintaCatatan] = useState<Aksi | null>(null);

  const jalankan = async (aksi: Aksi) => {
    setProses(aksi);
    setGalat(null);
    const db = klienBrowser();
    try {
      if (aksi === "terima") await konfirmasiPemesanan(db, pemesananId);
      if (aksi === "tolak") await tolakPemesanan(db, pemesananId, catatan);
      if (aksi === "batalkan") await batalkanPemesanan(db, pemesananId, catatan);
      setMintaCatatan(null);
      setCatatan("");
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Aksinya gagal.");
    } finally {
      setProses(null);
    }
  };

  if (!bolehTerima && !bolehTolak && !bolehBatalkan) return null;

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-bold tracking-tight">Keputusan</h2>

      {mintaCatatan ? (
        <div className="mt-3">
          <label htmlFor="catatan" className="block text-sm font-medium">
            Alasan {mintaCatatan === "tolak" ? "penolakan" : "pembatalan"}
          </label>
          <textarea
            id="catatan"
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Opsional, tapi membantu pihak lain paham"
            className="mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <p className="mt-1.5 text-xs text-muted">
            Alasannya tersimpan di jejak pemesanan dan terlihat pihak lain.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => jalankan(mintaCatatan)}
              disabled={proses !== null}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-warn px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {proses && <Loader2 className="h-4 w-4 animate-spin" />}
              {mintaCatatan === "tolak" ? "Tolak permintaan" : "Batalkan pemesanan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMintaCatatan(null);
                setCatatan("");
              }}
              className="cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink"
            >
              Kembali
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {bolehTerima && (
            <button
              type="button"
              onClick={() => jalankan("terima")}
              disabled={proses !== null}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {proses === "terima" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Terima permintaan
            </button>
          )}
          {bolehTolak && (
            <button
              type="button"
              onClick={() => setMintaCatatan("tolak")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
            >
              <X className="h-4 w-4" />
              Tolak
            </button>
          )}
          {bolehBatalkan && (
            <button
              type="button"
              onClick={() => setMintaCatatan("batalkan")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
            >
              <X className="h-4 w-4" />
              Batalkan pemesanan
            </button>
          )}
        </div>
      )}

      {galat && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}
    </div>
  );
}
