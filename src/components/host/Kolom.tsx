"use client";

import React from "react";

const DASAR =
  "mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm text-ink ring-1 ring-line " +
  "placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function Kolom({
  id,
  label,
  bantuan,
  satuan,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  bantuan?: string;
  satuan?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input id={id} {...props} className={DASAR} />
        {satuan && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">
            {satuan}
          </span>
        )}
      </div>
      {bantuan && <p className="mt-1.5 text-xs leading-relaxed text-muted">{bantuan}</p>}
    </div>
  );
}

export function Pilihan({
  id,
  label,
  bantuan,
  opsi,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  bantuan?: string;
  /** [nilai, label] — biasanya `Object.entries(LABEL_*)`. */
  opsi: [string, string][];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select id={id} {...props} className={`${DASAR} cursor-pointer`}>
        {opsi.map(([nilai, teks]) => (
          <option key={nilai} value={nilai}>
            {teks}
          </option>
        ))}
      </select>
      {bantuan && <p className="mt-1.5 text-xs leading-relaxed text-muted">{bantuan}</p>}
    </div>
  );
}

/**
 * Pilihan ganda untuk kolom `text[]`.
 *
 * Dibangun dari checkbox sungguhan, bukan tombol: pembaca layar mengumumkan
 * keadaan tercentangnya, dan keyboard bisa menyalakannya dengan spasi tanpa
 * perlu ditulis manual.
 */
export function KotakCentangGanda({
  label,
  bantuan,
  opsi,
  nilai,
  onChange,
}: {
  label: string;
  bantuan?: string;
  opsi: [string, string][];
  nilai: string[];
  onChange: (nilai: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      {bantuan && <p className="mt-1 text-xs leading-relaxed text-muted">{bantuan}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {opsi.map(([kode, teks]) => {
          const aktif = nilai.includes(kode);
          return (
            <label
              key={kode}
              className={`cursor-pointer select-none rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand ${
                aktif
                  ? "bg-brand-soft text-brand-dark ring-brand/30"
                  : "bg-card text-ink ring-line hover:bg-paper"
              }`}
            >
              <input
                type="checkbox"
                checked={aktif}
                onChange={() =>
                  onChange(aktif ? nilai.filter((v) => v !== kode) : [...nilai, kode])
                }
                className="sr-only"
              />
              {teks}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Bagian({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-bold tracking-tight">{judul}</h2>
      {keterangan && (
        <p className="mt-1 text-xs leading-relaxed text-muted">{keterangan}</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
