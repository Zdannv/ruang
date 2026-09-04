"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  HARI_URUT,
  NAMA_HARI,
  NAMA_HARI_PENDEK,
  hapusJendela,
  jam,
  tambahJendela,
  type Jendela,
} from "@/lib/jendela";

/**
 * Pengelola jendela akses.
 *
 * Jendela ini bukan keterangan — ia ditegakkan database. Permintaan kunjungan
 * di luar jam dan hari yang terdaftar di sini ditolak `minta_akses`, jadi
 * mengisinya asal-asalan berarti penyewa tidak bisa mengambil barangnya di
 * waktu yang sebetulnya kamu izinkan.
 *
 * Kalau tidak ada satu baris pun, kunjungan justru DIBOLEHKAN kapan saja —
 * bukan ditolak semuanya. Penyewa tidak boleh terkurung dari barangnya sendiri
 * hanya karena host belum mengisi jadwal.
 */
export default function KelolaJendela({
  ruangId,
  jendela,
}: {
  ruangId: string;
  jendela: Jendela[];
}) {
  const router = useRouter();
  const [hari, setHari] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [mulai, setMulai] = useState("08:00");
  const [selesai, setSelesai] = useState("17:00");
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

  const perHari = HARI_URUT.map((h) => ({
    hari: h,
    rentang: jendela.filter((j) => j.hari === h),
  }));

  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-bold tracking-tight">Jendela akses</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Jam saat penyewa boleh datang. Ini ditegakkan sistem: permintaan kunjungan di
        luar jadwal ini ditolak otomatis, jadi penyewa tidak perlu menebak dan kamu
        tidak perlu menolak satu-satu.
      </p>

      {jendela.length === 0 && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
          Belum ada jadwal. Selama kosong, kunjungan boleh diminta kapan saja — supaya
          penyewa tidak terkurung dari barangnya. Isi jadwalnya supaya batasnya jelas.
        </p>
      )}

      {jendela.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {perHari
            .filter((x) => x.rentang.length > 0)
            .map((x) => (
              <li key={x.hari} className="flex items-start justify-between gap-3 py-2.5">
                <p className="w-20 shrink-0 text-sm font-medium">{NAMA_HARI[x.hari]}</p>
                <ul className="flex flex-1 flex-wrap gap-2">
                  {x.rentang.map((j) => (
                    <li
                      key={j.id}
                      className="angka inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-xs font-medium"
                    >
                      <Clock className="h-3 w-3 text-muted" />
                      {jam(j.mulai)}–{jam(j.selesai)}
                      <button
                        type="button"
                        onClick={() => jalankan(j.id, () => hapusJendela(klienBrowser(), j.id))}
                        disabled={proses !== null}
                        aria-label={`Hapus ${NAMA_HARI[x.hari]} ${jam(j.mulai)}`}
                        className="cursor-pointer text-muted transition-colors hover:text-warn disabled:cursor-not-allowed"
                      >
                        {proses === j.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      )}

      <div className="mt-4 rounded-xl bg-paper p-3.5">
        <fieldset>
          <legend className="text-xs font-medium">Hari</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HARI_URUT.map((h) => {
              const aktif = hari.includes(h);
              return (
                <label
                  key={h}
                  className={`cursor-pointer select-none rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${
                    aktif
                      ? "bg-brand text-white ring-brand"
                      : "bg-card text-ink ring-line hover:bg-brand-soft"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={aktif}
                    onChange={() =>
                      setHari((v) => (aktif ? v.filter((x) => x !== h) : [...v, h]))
                    }
                    className="sr-only"
                  />
                  {NAMA_HARI_PENDEK[h]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="jam-mulai" className="block text-xs font-medium">
              Mulai
            </label>
            <input
              id="jam-mulai"
              type="time"
              value={mulai}
              onChange={(e) => setMulai(e.target.value)}
              className="angka mt-1 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
          <div>
            <label htmlFor="jam-selesai" className="block text-xs font-medium">
              Selesai
            </label>
            <input
              id="jam-selesai"
              type="time"
              value={selesai}
              onChange={(e) => setSelesai(e.target.value)}
              className="angka mt-1 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              jalankan("tambah", () =>
                tambahJendela(klienBrowser(), ruangId, hari, mulai, selesai)
              )
            }
            disabled={proses !== null}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {proses === "tambah" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Tambah
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Jam ditulis waktu Jakarta. Satu hari boleh punya dua rentang, misalnya pagi
          dan sore — tambahkan dua kali.
        </p>
      </div>

      {galat && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}
    </section>
  );
}
