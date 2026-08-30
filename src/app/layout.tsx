import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
