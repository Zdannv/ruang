import { Suspense } from "react";
import type { Metadata } from "next";
import FormMasuk from "./FormMasuk";

export const metadata: Metadata = { title: "Masuk — Ruang" };

/** `useSearchParams` di dalam form memaksa batas Suspense di atasnya. */
export default function HalamanMasuk() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 w-full max-w-md px-4 py-10" />}>
      <FormMasuk />
    </Suspense>
  );
}
