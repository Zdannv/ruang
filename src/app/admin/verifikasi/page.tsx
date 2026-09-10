import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import AntreanVerifikasi from "./AntreanVerifikasi";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { antreanVerifikasi, sayaAdmin } from "@/lib/verifikasi";

export const metadata: Metadata = { title: "Verifikasi lahan, Cari Ruang" };

/**
 * Antrean petugas.
 *
 * Gerbangnya ada di DATABASE, bukan di sini: `antrean_verifikasi()` dan
 * `putuskan_verifikasi()` menolak siapa pun yang bukan admin. Pemeriksaan di
 * halaman ini cuma supaya yang bukan petugas mendapat 404 alih-alih layar
 * galat — menyembunyikan halaman bukan pengamanan.
 *
 * Admin dinyalakan tangan lewat SQL Editor (`update profil set admin = true`).
 * Tidak ada layar yang bisa mengangkat admin, karena layar seperti itu bisa
 * dipakai mengangkat diri sendiri.
 */
export default async function HalamanVerifikasi() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/admin/verifikasi");

  const db = await klienServer();
  /*
    Profilnya sudah dimuat `sesiSaya()`; RPC-nya cuma dipakai kalau kolom
    `admin` belum ada di database itu (migrasi 20 belum jalan), dan di sana
    ia menjawab false — halamannya tertutup, seperti seharusnya.

    Ini cuma memutuskan APA YANG DITAMPILKAN. Yang benar-benar menahan ada di
    dalam `antrean_verifikasi()` dan `putuskan_verifikasi()`.
  */
  if (!(sesi.profil?.admin === true || (await sayaAdmin(db)))) redirect("/");

  const antrean = await antreanVerifikasi(db);
  const menunggu = antrean.filter((a) => a.verifikasi === "diajukan");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        <ShieldCheck className="h-7 w-7 text-brand" />
        Verifikasi lahan
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {menunggu.length > 0
          ? `${menunggu.length} lahan menunggu dikunjungi.`
          : "Tidak ada yang menunggu kunjungan."}{" "}
        Yang dicek cuma satu hal: apakah keterangan di listing cocok dengan
        keadaan di lokasi. Kalau ada yang tidak cocok, tolak dan tulis apa yang
        harus diperbaiki, itu yang dibaca pemiliknya.
      </p>

      <div className="mt-4 rounded-2xl bg-warn-soft px-4 py-3 text-xs leading-relaxed text-warn">
        Alamat lengkap dan nomor pemilik di halaman ini cuma untuk keperluan
        kunjungan. Lencana &ldquo;terverifikasi&rdquo; menyatakan keterangannya cocok pada
        hari kunjungan, bukan jaminan keamanan, dan bukan asuransi.
      </div>

      <AntreanVerifikasi awal={antrean} />
    </div>
  );
}
