import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavBawah from "@/components/NavBawah";
import DaftarSW from "@/components/DaftarSW";
import { sesiSaya } from "@/lib/auth";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

/** Heading memakai serif; teks antarmuka tetap sans supaya tetap terbaca kecil. */
const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ruang — sewa ruang kosong di dekatmu",
  description:
    "Marketplace ruang P2P. Cari ruang kosong terdekat berdasarkan titik, radius, ukuran, dan harga.",
  applicationName: "Ruang",
  // Safari tidak membaca manifest untuk ikon layar utama; ia mencari
  // apple-touch-icon sendiri.
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    title: "Ruang",
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
  themeColor: "#1f5fff",
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
        <Header />
        {/* Ruang bawah untuk bilah navigasi mobile yang melayang di atas isi. */}
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <Footer />
        <NavBawah masuk={sesi !== null} />
        <DaftarSW />
      </body>
    </html>
  );
}
