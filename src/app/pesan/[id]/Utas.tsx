"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPinned, Send, ShieldAlert } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import { bukaAlamat, kirimPesan, type Pesan } from "@/lib/percakapan";
import { tanggalJam } from "@/lib/label";

/**
 * Isi percakapan.
 *
 * Pesan tidak bisa diubah atau dihapus — bukan kelalaian, melainkan syarat
 * supaya utasnya berguna saat ada sengketa. Platform memutuskan siapa yang
 * benar, dan keputusan itu butuh catatan yang tidak bisa disunting belakangan.
 */
export default function Utas({
  percakapanId,
  pesanAwal,
  sayaId,
  sayaHost,
  alamatSudahDibuka,
}: {
  percakapanId: string;
  pesanAwal: Pesan[];
  sayaId: string;
  sayaHost: boolean;
  alamatSudahDibuka: boolean;
}) {
  const router = useRouter();
  const [isi, setIsi] = useState("");
  const [kirim, setKirim] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const bawah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bawah.current?.scrollIntoView({ block: "end" });
  }, [pesanAwal.length]);

  const kirimkan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isi.trim() === "") return;
    setKirim(true);
    setGalat(null);
    try {
      await kirimPesan(klienBrowser(), percakapanId, isi);
      setIsi("");
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Pesan gagal terkirim.");
    } finally {
      setKirim(false);
    }
  };

  const buka = async () => {
    setProses(true);
    setGalat(null);
    try {
      await bukaAlamat(klienBrowser(), percakapanId);
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Gagal membuka alamat.");
    } finally {
      setProses(false);
    }
  };

  return (
    <>
      {sayaHost && !alamatSudahDibuka && (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <MapPinned className="h-4 w-4 text-brand" />
            Buka alamat untuk penyewa ini
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Supaya ia bisa datang melihat sebelum memesan. Hanya berlaku untuk orang
            ini, dan <strong className="text-ink">tidak bisa ditutup lagi</strong> —
            alamat yang sudah dilihat tidak bisa ditarik kembali.
          </p>
          <button
            type="button"
            onClick={buka}
            disabled={proses}
            className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {proses && <Loader2 className="h-4 w-4 animate-spin" />}
            Buka alamat
          </button>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {pesanAwal.map((p) => {
          const punyaku = p.pengirim_id === sayaId;
          return (
            <li key={p.id} className={punyaku ? "flex justify-end" : "flex"}>
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    punyaku
                      ? "rounded-br-sm bg-brand text-white"
                      : "rounded-bl-sm border border-line bg-card text-ink"
                  }`}
                >
                  {p.isi}
                </div>
                <p
                  className={`angka mt-1 text-[11px] text-muted ${
                    punyaku ? "text-right" : ""
                  }`}
                >
                  {tanggalJam(p.pada)}
                  {p.disamarkan && " · kontak disamarkan"}
                </p>
              </div>
            </li>
          );
        })}
        <div ref={bawah} />
      </ul>

      <form onSubmit={kirimkan} className="mt-5">
        <div className="flex items-end gap-2">
          <label htmlFor="pesan" className="sr-only">
            Tulis pesan
          </label>
          <textarea
            id="pesan"
            rows={2}
            maxLength={2000}
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder="Tulis pertanyaanmu…"
            className="min-h-11 flex-1 resize-y rounded-2xl border border-line bg-card px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <button
            type="submit"
            disabled={kirim || isi.trim() === ""}
            aria-label="Kirim pesan"
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {kirim ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Nomor telepon dan email disamarkan otomatis. Sewa yang diurus di luar
          aplikasi tidak punya manifes, log akses, maupun penengah saat bersengketa.
        </p>

        {galat && (
          <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
            {galat}
          </p>
        )}
      </form>
    </>
  );
}
