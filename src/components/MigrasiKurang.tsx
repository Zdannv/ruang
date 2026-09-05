import Link from "next/link";
import { DatabaseZap } from "lucide-react";

/**
 * Ditampilkan saat sebuah fitur menunjuk tabel yang belum ada di database.
 *
 * Menyebut nama berkas migrasinya, karena itu satu-satunya hal yang bisa
 * ditindaklanjuti. "A server error occurred" tidak memberi tahu apa pun —
 * dan yang membuka layar ini biasanya justru orang yang bisa memperbaikinya.
 */
export default function MigrasiKurang({
  fitur,
  berkas,
}: {
  fitur: string;
  berkas: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-line bg-card p-6 text-center">
        <DatabaseZap className="mx-auto h-9 w-9 text-warn" />
        <h1 className="mt-4 font-display text-xl font-bold tracking-tight">
          {fitur} belum aktif di database ini
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tabelnya belum ada. Jalankan migrasi berikut di Supabase Dashboard →
          SQL Editor, lalu muat ulang halaman ini.
        </p>
        <ul className="mt-4 space-y-1.5">
          {berkas.map((b) => (
            <li
              key={b}
              className="rounded-lg bg-paper px-3 py-2 font-mono text-xs text-ink"
            >
              supabase/migrations/{b}
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
