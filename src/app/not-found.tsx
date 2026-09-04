import Link from "next/link";
import { SearchX } from "lucide-react";

export default function TidakDitemukan() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <SearchX className="h-10 w-10 text-muted" />
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Halaman ini tidak ada
      </h1>
      <p className="text-sm leading-relaxed text-muted">
        Ruangnya mungkin sudah ditarik host, atau tautannya salah. Ruang yang masih
        berstatus draf dan yang ditangguhkan juga tidak bisa dibuka dari luar.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        Cari ruang lain
      </Link>
    </div>
  );
}
