import Link from "next/link";

/** Bingkai bersama layar masuk dan daftar. */
export default function KartuAuth({
  judul,
  keterangan,
  children,
  kaki,
}: {
  judul: string;
  keterangan: string;
  children: React.ReactNode;
  kaki: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-2xl bg-card p-6 ring-1 ring-line sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">{judul}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{keterangan}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-4 text-center text-sm text-muted">{kaki}</p>
      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          Kembali ke pencarian ruang
        </Link>
      </p>
    </div>
  );
}
