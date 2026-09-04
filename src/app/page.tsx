import { Suspense } from "react";
import { supabaseSiap } from "@/lib/supabase/env";
import PencarianRuang from "@/components/PencarianRuang";

/**
 * Beranda demo langsung berupa halaman pencarian.
 *
 * Ini layar yang paling menjual idenya (lihat urutan bangun di CLAUDE.md), jadi
 * ia yang dibuka pertama saat presentasi — tanpa halaman pengantar di depannya.
 */
export default function Beranda() {
  if (!supabaseSiap) return <PetunjukPemasangan />;

  return (
    <Suspense fallback={<Kerangka />}>
      <PencarianRuang />
    </Suspense>
  );
}

/**
 * Tanpa kredensial Supabase, layar ini yang muncul — bukan layar putih atau
 * error jaringan. Demo ini akan dibuka di laptop lain sebelum presentasi.
 */
function PetunjukPemasangan() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-xl font-bold">Ruang belum tersambung ke Supabase</h1>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
        <li>
          Salin <code className="font-mono text-ink">.env.example</code> menjadi{" "}
          <code className="font-mono text-ink">.env.local</code>.
        </li>
        <li>
          Isi <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dari
          Project Settings di Supabase. Wajib anon key, bukan service role.
        </li>
        <li>
          Pastikan <code className="font-mono text-ink">01_schema.sql</code> dan{" "}
          <code className="font-mono text-ink">02_seed.sql</code> sudah dijalankan.
        </li>
        <li>Jalankan ulang server pengembangan.</li>
      </ol>
    </div>
  );
}

function Kerangka() {
  return (
    <>
      <div className="-mt-[68px] h-[420px] bg-gradient-to-br from-[#0d2a6b] via-brand to-[#3f7bff]" />
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="h-7 w-56 max-w-full animate-pulse rounded-lg bg-line" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
          ))}
        </div>
      </div>
    </>
  );
}
