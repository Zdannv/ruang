import { Suspense } from "react";
import { supabaseSiap } from "@/lib/supabase/env";
import PencarianRuang from "@/components/PencarianRuang";

export const metadata = {
  title: "Cari ruang — Ruang",
  description:
    "Telusuri ruang kosong terdekat: titik, radius, tipe, ukuran, dan harga.",
};

/** Halaman pencarian. Beranda (`/`) adalah landing page yang menaut ke sini. */
export default function HalamanCari() {
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

/**
 * Kerangka yang tampil sampai `PencarianRuang` terhidrasi — ia memakai
 * `useSearchParams()`, jadi di server ia selalu tertahan Suspense.
 *
 * Bentuknya harus menyerupai halaman jadinya: bilah kendali dulu, lalu kisi
 * kartu. Versi sebelumnya menaruh bidang gradien biru setinggi 420px di sini,
 * sisa dari tampilan yang sudah diganti 4 September 2026 — jadi setiap kali
 * `/cari` dibuka, hero yang sudah dihapus itu berkelip sekejap lebih dulu.
 * Ia juga menulis sendiri `-mt-[68px]`, angka yang sudah salah sejak tinggi
 * header diukur ulang dan dipindah ke `--tinggi-header`.
 */
function Kerangka() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
      <div className="h-7 w-56 max-w-full animate-pulse rounded-lg bg-line" />
      <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
      <div className="mt-8 h-7 w-40 max-w-full animate-pulse rounded-lg bg-line" />
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-card ring-1 ring-line" />
        ))}
      </div>
    </div>
  );
}
