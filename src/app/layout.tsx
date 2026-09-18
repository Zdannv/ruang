import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavBawah from "@/components/NavBawah";
import TanpaDiHost from "@/components/TanpaDiHost";
import DaftarSW from "@/components/DaftarSW";
import { sesiSaya } from "@/lib/auth";
import { siteUrl } from "@/lib/supabase/env";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

/** Heading memakai serif; teks antarmuka tetap sans supaya tetap terbaca kecil. */
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const JUDUL = "Ada Tempat · sewa tempat usaha jadi gampang";
const RINGKASAN =
  "Sewa tempat usaha di pinggir jalan: halaman depan rumah, teras, lahan kosong, atau kios. Bulanan, langsung dari pemiliknya. Punya lahan nganggur? Sewakan.";

export const metadata: Metadata = {
  /*
    `metadataBase` menentukan alamat absolut gambar pratinjau. Tanpa itu Next
    memancarkan `og:image` relatif, dan WhatsApp maupun Facebook mengabaikan
    yang relatif tanpa mengeluh sama sekali: pratinjaunya cuma tampil tanpa
    gambar, persis seperti kalau `opengraph-image` tidak pernah dibuat.

    `siteUrl()` bisa mengembalikan string kosong di server yang env-nya belum
    lengkap, dan `new URL("")` melempar saat build. Jadi ada cadangan
    localhost: pratinjau yang salah alamat di pengembangan lokal tidak
    merugikan siapa pun, build yang gagal merugikan.
  */
  metadataBase: new URL(siteUrl("/") || "http://localhost:3000"),
  title: JUDUL,
  description: RINGKASAN,
  applicationName: "Ada Tempat",
  openGraph: {
    type: "website",
    siteName: "Ada Tempat",
    locale: "id_ID",
    title: JUDUL,
    description: RINGKASAN,
  },
  twitter: { card: "summary_large_image", title: JUDUL, description: RINGKASAN },
  // Safari tidak membaca manifest untuk ikon layar utama; ia mencari
  // apple-touch-icon sendiri.
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    title: "Ada Tempat",
    // Bilah status iOS memakai warna latar halaman, bukan warna merek —
    // "black-translucent" akan membuat isi halaman menyusup ke belakang jam.
    statusBarStyle: "default",
  },
};

/**
 * `themeColor` mewarnai bilah atas peramban di Android dan bilah alamat di
 * beberapa peramban desktop. Nilainya sama dengan --color-brand.
 *
 * `viewportFit: "cover"` diperlukan supaya bilah navigasi bawah bisa menghitung
 * area aman di perangkat berponi.
 */
export const viewport: Viewport = {
  themeColor: "#a93b20",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Dibaca sekali di layout: bilah bawah cuma perlu tahu sudah masuk atau belum.
  const sesi = await sesiSaya();

  return (
    <html
      lang="id"
      className={`${inter.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <TanpaDiHost>
          <Header />
        </TanpaDiHost>
        {/* Ruang bawah untuk bilah navigasi mobile yang melayang di atas isi. */}
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <TanpaDiHost>
          <Footer />
          <NavBawah masuk={sesi !== null} />
        </TanpaDiHost>
        <DaftarSW />
      </body>
    </html>
  );
}
