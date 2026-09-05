"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, House, Inbox, Search, UserRound } from "lucide-react";

/**
 * Navigasi bawah untuk layar kecil.
 *
 * Produk ini mobile-first, tapi bilah atasnya cuma punya ruang untuk logo dan
 * satu tombol — akibatnya "Cari ruang" dan "Sewakan ruang" tidak bisa dijangkau
 * dari HP kecuali lewat beranda. Bilah bawah menyelesaikannya tanpa menyembunyikan
 * apa pun di balik menu hamburger, yang selalu satu ketukan lebih jauh.
 *
 * Disembunyikan dari `sm` ke atas — di sana nav-nya sudah ada di header.
 */
export default function NavBawah({ masuk }: { masuk: boolean }) {
  const path = usePathname();

  // Saat sudah masuk, item keempat jadi notifikasi — bukan "Akun" yang dulu
  // menunjuk tujuan yang sama dengan Pemesanan.
  const tampil = masuk
    ? [
        { href: "/cari", label: "Cari", ikon: Search },
        { href: "/pemesanan", label: "Pemesanan", ikon: Inbox },
        { href: "/host", label: "Sewakan", ikon: House },
        { href: "/notifikasi", label: "Notifikasi", ikon: Bell },
      ]
    : [
        { href: "/cari", label: "Cari", ikon: Search },
        { href: "/pemesanan", label: "Pemesanan", ikon: Inbox },
        { href: "/host", label: "Sewakan", ikon: House },
        { href: "/masuk", label: "Masuk", ikon: UserRound },
      ];

  return (
    <nav
      aria-label="Navigasi utama"
      /* pb-[env(safe-area-inset-bottom)]: saat dipasang sebagai PWA di iPhone,
         bilah ini berada tepat di area gestur home indicator. Tanpa padding
         itu, ikonnya tertimpa garis home. */
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {tampil.map((x) => {
          const aktif = path === x.href || path.startsWith(`${x.href}/`);
          return (
            <li key={x.label} className="flex-1">
              <Link
                href={x.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  aktif ? "text-brand" : "text-muted"
                }`}
              >
                <x.ikon className="h-5 w-5" />
                {x.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
