"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { RADIUS_BAWAAN, RADIUS_PILIHAN, TITIK_BAWAAN, TITIK_PRESET } from "@/lib/titik";

/**
 * Bilah pencarian di hero landing page.
 *
 * Tidak mengambil data apa pun — ia hanya menyusun URL lalu berpindah ke
 * `/cari`, tempat seluruh keadaan filter memang sudah hidup di query string.
 * Dengan begitu halaman depan tetap ringan dan hasil pencariannya tetap bisa
 * dibagikan lewat tautan.
 */
export default function CariCepat() {
  const router = useRouter();
  const [titik, setTitik] = useState(TITIK_BAWAAN.id);
  const [radius, setRadius] = useState(String(RADIUS_BAWAAN));

  const cari = (e: React.FormEvent) => {
    e.preventDefault();
    const t = TITIK_PRESET.find((x) => x.id === titik) ?? TITIK_BAWAAN;
    router.push(`/cari?lat=${t.lat}&lng=${t.lng}&radius=${radius}`);
  };

  return (
    <form
      onSubmit={cari}
      /* Di latar terang, kartu putih butuh garis tepi — bayangan saja tidak
         cukup memisahkannya dari halaman. */
      className="naik flex flex-col gap-2 rounded-2xl border border-line bg-card p-2 sm:flex-row sm:items-center sm:rounded-full sm:gap-0 sm:p-1.5"
    >
      <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-paper sm:rounded-full">
        <MapPin className="h-4.5 w-4.5 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Cari dari
          </span>
          <span className="relative flex items-center">
            <select
              value={titik}
              onChange={(e) => setTitik(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-semibold text-ink focus:outline-none"
            >
              {TITIK_PRESET.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-muted" />
          </span>
        </span>
      </label>

      <span className="hidden h-9 w-px bg-line sm:block" />

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 hover:bg-paper sm:rounded-full">
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Radius
          </span>
          <span className="relative flex items-center">
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="angka w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-semibold text-ink focus:outline-none"
            >
              {RADIUS_PILIHAN.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-muted" />
          </span>
        </span>
      </label>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:ml-2"
      >
        <Search className="h-4 w-4" />
        Cari ruang
      </button>
    </form>
  );
}
