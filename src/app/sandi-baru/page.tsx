import { Suspense } from "react";
import type { Metadata } from "next";
import FormSandiBaru from "./FormSandiBaru";

export const metadata: Metadata = { title: "Sandi baru — Ruang" };

export default function HalamanSandiBaru() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <FormSandiBaru />
    </Suspense>
  );
}
