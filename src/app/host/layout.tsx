import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, MessageCircle, Plus, Store } from "lucide-react";
import Lambang from "@/components/Lambang";
import { sesiSaya } from "@/lib/auth";

/**
 * Kerangka area pemilik lahan.
 *
 * **Sengaja tidak mirip sisi penyewa.** Yang membuka `/cari` sedang
 * melihat-lihat; yang membuka `/host` sedang bekerja, dan biasanya sudah tahu
 * apa yang ia cari. Jadi tidak ada hero, tidak ada bidang warna, dan
 * navigasinya tetap di tempat: bilah samping di laptop, bilah gulir mendatar
 * di telepon.
 *
 * Header publik, footer, dan navigasi bawah ikut disembunyikan, lewat
 * `TanpaDiHost` di layout akar. Ketiganya ada untuk menjelajah listing, dan
 * di sini ketiganya cuma mengambil ruang yang dibutuhkan pekerjaannya.
 *
 * Penjagaan sesinya di sini, sekali, bukan diulang di tiap halaman. Yang
 * benar-benar menahan tetap RLS di database; ini supaya orang yang belum
 * masuk mendarat di halaman masuk, bukan di daftar kosong tanpa penjelasan.
 */
const MENU = [
  { href: "/host", label: "Ringkasan", ikon: BarChart3 },
  { href: "/host/lahan", label: "Lahan saya", ikon: Store },
  { href: "/pesan", label: "Pesan", ikon: MessageCircle },
];

export default async function TataLetakHost({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/host");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Lambang className="h-7 w-7" />
            <span className="font-display text-base font-bold tracking-tight">
              Ada Tempat
            </span>
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper">
              Pemilik
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/host/lahan/baru"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Pasang lahan</span>
              <span className="sm:hidden">Pasang</span>
            </Link>
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              Ke aplikasi
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Bilah samping cuma dari `lg`; di bawah itu ia jadi barisan mendatar
            di atas isinya, karena kolom selebar 180px di layar telepon
            menyisakan lebar yang tidak cukup untuk tabel angka. */}
        <nav
          aria-label="Navigasi pemilik"
          className="hidden w-44 shrink-0 lg:block"
        >
          <ul className="sticky top-6 space-y-1">
            {MENU.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-ink"
                >
                  <m.ikon className="h-4 w-4" />
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          <nav
            aria-label="Navigasi pemilik"
            className="geser-x -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 lg:hidden"
          >
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-ink ring-1 ring-line"
              >
                <m.ikon className="h-4 w-4 text-muted" />
                {m.label}
              </Link>
            ))}
          </nav>

          {children}
        </div>
      </div>
    </div>
  );
}
