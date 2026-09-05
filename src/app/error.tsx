"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

/**
 * Jaring pengaman untuk galat yang tidak tertangani.
 *
 * Tanpa berkas ini, kegagalan render di server menghasilkan halaman bawaan
 * Vercel — putih, berbahasa Inggris, dan tidak menyebutkan apa pun yang bisa
 * dilakukan. Yang melihatnya biasanya pengguna sungguhan, bukan pengembang.
 *
 * Pesan aslinya sengaja TIDAK ditampilkan: di production Next.js memang
 * menyembunyikannya, dan pesan galat server sering memuat nama tabel atau
 * kolom yang tidak perlu diketahui pengunjung. Yang ditampilkan `digest` —
 * cukup untuk mencocokkan dengan log Vercel kalau perlu ditelusuri.
 */
export default function Galat({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-line bg-card p-6 text-center">
        <TriangleAlert className="mx-auto h-9 w-9 text-warn" />
        <h1 className="mt-4 font-display text-xl font-bold tracking-tight">
          Halamannya gagal dimuat
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Ada yang salah di sisi kami, bukan di perangkatmu. Coba muat ulang — kalau
          masih sama, tunggu sebentar lalu coba lagi.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
          >
            Ke beranda
          </Link>
        </div>

        {error.digest && (
          <p className="angka mt-5 text-xs text-muted">Kode: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
