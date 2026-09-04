"use client";

import { useState } from "react";
import Image from "next/image";
import type { FotoRuang } from "@/lib/ruang";

/**
 * Galeri foto ruang.
 *
 * Setiap foto punya `keterangan` — "mulut gang", "jalur akses", "kondisi
 * kunci" — dan keterangan itu ikut ditampilkan, bukan disembunyikan sebagai
 * alt text. Justru di situ nilainya: orang bisa menilai apakah motornya bisa
 * masuk gang sebelum berangkat ke sana. Galeri yang cuma memajang foto cantik
 * tanpa menyebut itu foto apa sama saja dengan iklan OLX.
 */
export default function GaleriFoto({ foto, judul }: { foto: FotoRuang[]; judul: string }) {
  const [aktif, setAktif] = useState(0);

  if (foto.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-card text-sm text-muted ring-1 ring-line">
        Host belum mengunggah foto
      </div>
    );
  }

  const utama = foto[Math.min(aktif, foto.length - 1)];

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-line">
        <Image
          src={utama.url}
          alt={`${judul} — ${utama.keterangan}`}
          fill
          sizes="(min-width: 1024px) 720px, 100vw"
          className="object-cover"
          priority
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          {utama.keterangan}
        </span>
        <span className="angka absolute bottom-3 right-3 rounded-full bg-ink/75 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
          {Math.min(aktif, foto.length - 1) + 1}/{foto.length}
        </span>
      </div>

      {foto.length > 1 && (
        <div className="geser-x -mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {foto.map((f, i) => {
              const dipilih = i === Math.min(aktif, foto.length - 1);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAktif(i)}
                  aria-pressed={dipilih}
                  aria-label={`Lihat foto ${f.keterangan}`}
                  className={`relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-2 transition-all ${
                    dipilih ? "ring-brand" : "ring-transparent hover:ring-line"
                  }`}
                >
                  <Image
                    src={f.url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
