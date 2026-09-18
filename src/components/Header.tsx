import Link from "next/link";
import Lambang from "@/components/Lambang";
import { Suspense } from "react";
import { sesiSaya } from "@/lib/auth";
import LencanaHeader, { LencanaKosong } from "@/components/LencanaHeader";

/**
 * Bilah atas yang melayang di atas isi halaman — kartu putih membulat dengan
 * jarak dari tepi layar, bukan bilah yang menempel penuh selebar viewport.
 *
 * Server Component supaya keadaan masuk sudah benar pada render pertama. Kalau
 * sesinya dibaca di klien, tombol "Masuk" sempat berkedip muncul untuk orang
 * yang sebetulnya sudah masuk.
 *
 * **Satu akun untuk kedua sisi, bukan dua.** Ditanyakan 18 September 2026:
 * apakah masuk sebagai pemilik lahan sebaiknya dipisah dari masuk sebagai
 * pencari. Jawabannya tidak, dan alasannya orangnya sendiri: yang menyewakan
 * halaman depannya bulan ini adalah orang yang bulan depan mencari lapak buat
 * anaknya. Dua akun berarti ia punya dua email, dua kotak masuk chat, dan satu
 * pesan yang masuk ke akun yang sedang tidak ia buka. Itu kerugian yang pasti.
 *
 * Yang dipisah PINTU MASUKNYA, bukan akunnya: tombol di bawah, dan seluruh
 * `/host` yang punya kerangka sendiri tanpa header maupun navigasi publik.
 * Pola yang sama dipakai OLX ("+ Jual"), Tokopedia, dan Airbnb.
 *
 * Dari sisi keamanan pemisahan akun juga tidak memberi apa-apa: yang menahan
 * siapa boleh mengubah lahan siapa adalah RLS per profil, dan itu sudah
 * berlaku sama saja apakah akunnya satu atau dua.
 */
export default async function Header() {
  const sesi = await sesiSaya();
  const nama = sesi?.profil?.nama ?? sesi?.email ?? null;


  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="naik mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-line bg-card/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1 sm:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Lambang className="h-8 w-8 text-brand" />
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Ada Tempat
            </span>
          </Link>

          {/*
            "Cari lahan" dibuang dari navigasi: sejak 18 September 2026 halaman
            utamanya SENDIRI adalah halaman pencarian, jadi tautan itu menunjuk
            ke tempat yang sama dengan lambang di sebelahnya. Dua tautan ke satu
            halaman bukan kemudahan, ia pertanyaan "bedanya apa" yang tidak
            dijawab layar.

            Yang tersisa cuma pintu masuk pemilik lahan, dan ia dibuat MENONJOL
            alih-alih jadi tautan teks biasa, mengikuti pola "+ Jual" di OLX.
            Alasannya bukan tampilan: dua sisi pasar ini tidak datang dengan
            niat yang sama beratnya. Pedagang datang sendiri lewat pencarian,
            sedangkan pemilik lahan harus DISADARKAN bahwa halaman depannya
            bisa disewakan, dan itu tidak terjadi lewat tautan abu-abu.

            Akunnya tetap SATU, dan itu keputusan. Lihat catatan di bawah.
          */}
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/host"
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-brand ring-1 ring-brand/30 transition-colors hover:bg-brand-soft"
            >
              Sewakan lahan
            </Link>
          </nav>
        </div>

        {sesi ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Di HP tautan ini sudah ada di bilah bawah; menampilkannya dua
                kali cuma menyempitkan header yang sama. */}

            {/* Angka lencana butuh dua kueri; keduanya dikeluarkan dari jalur
                kritis supaya header tampil lebih dulu dan angkanya menyusul. */}
            <Suspense fallback={<LencanaKosong />}>
              <LencanaHeader />
            </Suspense>


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
