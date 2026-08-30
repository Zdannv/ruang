import Link from "next/link";
import { House } from "lucide-react";

/**
 * Bilah atas yang melayang di atas isi halaman — kartu putih membulat dengan
 * jarak dari tepi layar, bukan bilah yang menempel penuh selebar viewport.
 *
 * Isinya sengaja tipis. Demo ini belum punya login (keputusan "switcher peran,
 * bukan auth"), jadi tidak ada tombol Masuk/Daftar yang tidak ke mana-mana.
 * Yang ada di kanan justru penanda jujur bahwa ini prototipe berdata contoh.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl bg-card/95 px-4 py-3 shadow-sm ring-1 ring-line backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
            <House className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            Ruang
          </span>
        </Link>

        <p className="hidden text-xs text-muted sm:block">
          Prototipe · data contoh kota Malang
        </p>
      </div>
    </header>
  );
}
