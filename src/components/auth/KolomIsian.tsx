"use client";

import React from "react";

/**
 * Satu baris isian berlabel.
 *
 * Label sungguhan yang tertaut ke input, bukan placeholder sebagai label:
 * placeholder hilang begitu orang mulai mengetik, dan pembaca layar tidak
 * mengumumkannya sebagai nama kolom.
 */
export default function KolomIsian({
  id,
  label,
  bantuan,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  bantuan?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="mt-1.5 w-full rounded-xl bg-card px-3.5 py-2.5 text-sm text-ink ring-1 ring-line placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      {bantuan && <p className="mt-1.5 text-xs text-muted">{bantuan}</p>}
    </div>
  );
}
