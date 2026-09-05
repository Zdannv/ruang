import Link from "next/link";
import { Bell, House } from "lucide-react";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { jumlahBelumDibaca } from "@/lib/notifikasi";

/**
 * Bilah atas yang melayang di atas isi halaman — kartu putih membulat dengan
 * jarak dari tepi layar, bukan bilah yang menempel penuh selebar viewport.
 *
 * Server Component supaya keadaan masuk sudah benar pada render pertama. Kalau
 * sesinya dibaca di klien, tombol "Masuk" sempat berkedip muncul untuk orang
 * yang sebetulnya sudah masuk.
 */
export default async function Header() {
  const sesi = await sesiSaya();
  const nama = sesi?.profil?.nama ?? sesi?.email ?? null;
  const belumDibaca = sesi ? await jumlahBelumDibaca(await klienServer()) : 0;

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="naik mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-line bg-card/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1 sm:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
              <House className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Ruang
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/cari"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              Cari ruang
            </Link>
            <Link
              href="/host"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              Sewakan ruang
            </Link>
          </nav>
        </div>

        {sesi ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Di HP tautan ini sudah ada di bilah bawah; menampilkannya dua
                kali cuma menyempitkan header yang sama. */}
            <Link
              href="/pemesanan"
              className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper sm:block"
            >
              Pemesanan
            </Link>

            <Link
              href="/notifikasi"
              aria-label={
                belumDibaca > 0
                  ? `Notifikasi, ${belumDibaca} belum dibaca`
                  : "Notifikasi"
              }
              className="relative rounded-full p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              <Bell className="h-5 w-5" />
              {belumDibaca > 0 && (
                <span className="angka absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {belumDibaca > 9 ? "9+" : belumDibaca}
                </span>
              )}
            </Link>
            <Link
              href="/profil"
              className="hidden max-w-32 truncate rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink sm:block"
            >
              {nama}
            </Link>
            {/* Form POST, bukan tautan: lihat alasannya di app/keluar/route.ts */}
            <form action="/keluar" method="post">
              <button
                type="submit"
                className="cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:bg-paper hover:text-ink"
              >
                Keluar
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link
              href="/masuk"
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Daftar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
