"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Loader2, MapPinCheck, X } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  mintaKunjungan,
  setujuiKunjungan,
  tandaiTiba,
  tolakKunjungan,
  type Kunjungan,
} from "@/lib/akses";
import { LABEL_STATUS_AKSES, tanggalJam } from "@/lib/label";
import {
  HARI_URUT,
  NAMA_HARI_PENDEK,
  jam,
  type JendelaPublik,
} from "@/lib/jendela";

const warna: Record<string, string> = {
  diminta: "bg-brand-soft text-brand-dark",
  disetujui: "bg-good-soft text-good",
  ditolak: "bg-paper text-muted",
  selesai: "bg-paper text-muted",
};

/**
 * Kunjungan: penyewa meminta jadwal, host menjawab, kedatangan dicatat.
 *
 * Kedatangan boleh ditandai kedua pihak. Kalau hanya host yang boleh, host yang
 * lupa mencatat membuat kunjungan yang benar-benar terjadi hilang dari log —
 * dan log inilah yang jadi bukti kalau nanti ada sengketa soal siapa terakhir
 * masuk ruangan.
 */
export default function JadwalKunjungan({
  pemesananId,
  jendelaAkses,
  sisaKuotaBulanIni,
  kuotaBulanan,
  kunjungan,
  sayaPenyewa,
  sayaHost,
  waktuAwal,
  waktuMin,
  jendela,
}: {
  pemesananId: string;
  jendelaAkses: string;
  sisaKuotaBulanIni: number;
  kuotaBulanan: number;
  kunjungan: Kunjungan[];
  sayaPenyewa: boolean;
  sayaHost: boolean;
  /** Isian awal dan batas bawah, keduanya waktu Jakarta, dihitung di server. */
  waktuAwal: string;
  waktuMin: string;
  jendela: JendelaPublik[];
}) {
  const router = useRouter();
  const [waktu, setWaktu] = useState(waktuAwal);
  const [catatan, setCatatan] = useState("");
  const [proses, setProses] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const jalankan = async (kunci: string, kerja: () => Promise<void>) => {
    setProses(kunci);
    setGalat(null);
    try {
      await kerja();
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Gagal.");
    } finally {
      setProses(null);
    }
  };

  const minta = (e: React.FormEvent) => {
    e.preventDefault();
    jalankan("minta", async () => {
      await mintaKunjungan(klienBrowser(), pemesananId, waktu, catatan);
      setCatatan("");
    });
  };

  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-lg font-bold tracking-tight">Kunjungan</h2>
        <p className="angka text-xs text-muted">
          sisa {sisaKuotaBulanIni} dari {kuotaBulanan} bulan ini
        </p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Jendela akses yang ditetapkan host: <strong className="text-ink">{jendelaAkses}</strong>.
        Permintaan di luar jadwal itu ditolak sistem, bukan diteruskan ke host. Setiap
        kunjungan tercatat di sini — itu yang menggantikan segel pada penitipan biasa.
      </p>

      {/* Jadwalnya dijabarkan per hari, bukan cuma sebagai label. Label
          "Rab-Sab 07.00-19.00; Min 13.00-16.00" benar tapi harus dibaca dua kali;
          daftar per hari langsung bisa dicocokkan dengan rencana orangnya. */}
      {jendela.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {HARI_URUT.filter((h) => jendela.some((j) => j.hari === h)).map((h) => (
            <li
              key={h}
              className="angka rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink"
            >
              {NAMA_HARI_PENDEK[h]}{" "}
              {jendela
                .filter((j) => j.hari === h)
                .map((j) => `${jam(j.mulai)}–${jam(j.selesai)}`)
                .join(", ")}
            </li>
          ))}
        </ul>
      )}

      {sayaPenyewa && (
        <form onSubmit={minta} className="mt-4 rounded-xl bg-paper p-3.5">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <div>
              <label htmlFor="waktu" className="block text-xs font-medium">
                Kapan mau datang{" "}
                <span className="font-normal text-muted">(WIB)</span>
              </label>
              <input
                id="waktu"
                type="datetime-local"
                required
                min={waktuMin}
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="mt-1 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
            <div>
              <label htmlFor="catatan-akses" className="block text-xs font-medium">
                Keperluan (opsional)
              </label>
              <input
                id="catatan-akses"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Ambil dua kardus"
                className="mt-1 w-full rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={proses !== null || sisaKuotaBulanIni <= 0}
            className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {proses === "minta" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
            Ajukan jadwal
          </button>
          {sisaKuotaBulanIni <= 0 && (
            <p className="mt-2 text-xs text-muted">
              Kuota bulan ini sudah habis. Ajukan untuk bulan berikutnya, atau minta host
              menaikkan kuotanya.
            </p>
          )}
        </form>
      )}

      {galat && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}

      {kunjungan.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Belum ada kunjungan yang dijadwalkan.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {kunjungan.map((k) => (
            <li key={k.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="angka text-sm font-medium">{tanggalJam(k.diminta_untuk)}</p>
                {k.catatan && <p className="text-xs text-muted">{k.catatan}</p>}
                {k.tiba_pada && (
                  <p className="angka text-xs text-muted">
                    Tercatat tiba {tanggalJam(k.tiba_pada)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    warna[k.status] ?? "bg-paper text-muted"
                  }`}
                >
                  {LABEL_STATUS_AKSES[k.status] ?? k.status}
                </span>

                {sayaHost && k.status === "diminta" && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        jalankan(k.id, () => setujuiKunjungan(klienBrowser(), k.id))
                      }
                      disabled={proses !== null}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {proses === k.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={() => jalankan(k.id, () => tolakKunjungan(klienBrowser(), k.id))}
                      disabled={proses !== null}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line hover:bg-paper disabled:cursor-not-allowed"
                    >
                      <X className="h-3.5 w-3.5" />
                      Tolak
                    </button>
                  </>
                )}

                {k.status === "disetujui" && (
                  <button
                    type="button"
                    onClick={() => jalankan(k.id, () => tandaiTiba(klienBrowser(), k.id))}
                    disabled={proses !== null}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line hover:bg-paper disabled:cursor-not-allowed"
                  >
                    {proses === k.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MapPinCheck className="h-3.5 w-3.5" />
                    )}
                    Tandai sudah datang
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
