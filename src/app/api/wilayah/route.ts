import { NextResponse } from "next/server";

/**
 * Perantara ke wilayah.id — daftar wilayah administratif Indonesia.
 *
 * Kenapa lewat server sendiri, bukan dipanggil langsung dari peramban:
 * wilayah.id tidak mengirim header `Access-Control-Allow-Origin`, jadi
 * peramban menolak jawabannya. Yang mengirim header itu (emsifa) menuliskan
 * seluruh namanya HURUF BESAR — dan nama wilayah masuk ke `ruang.kecamatan`
 * yang dikelompokkan sebagai teks oleh `permintaan_kecamatan` dan facet
 * pencarian. "LOWOKWARU" dan "Lowokwaru" akan terhitung dua wilayah berbeda.
 *
 * Datanya bersumber dari Kemendagri (Permendagri 72/2019) dan praktis tidak
 * pernah berubah, jadi ia disimpan 30 hari di sisi kita. Upstream-nya gratis
 * dan tanpa kunci; menahannya di cache adalah bentuk sopan memakainya.
 */

const TINGKAT = {
  provinsi: "provinces",
  kabupaten: "regencies",
  kecamatan: "districts",
  kelurahan: "villages",
} as const;

type Tingkat = keyof typeof TINGKAT;

/**
 * Kode wilayah: "35", "35.73", "35.73.05". Diperiksa ketat, dan itu bukan
 * kerapian — nilainya disambung ke URL upstream, jadi apa pun yang lolos dari
 * sini bisa mengarahkan permintaan server kita ke tempat lain.
 */
const KODE = /^\d{2}(\.\d{2}){0,2}$/;

const SEHARI = 60 * 60 * 24;

export async function GET(permintaan: Request) {
  const url = new URL(permintaan.url);
  const tingkat = url.searchParams.get("tingkat") ?? "";
  const kode = url.searchParams.get("kode") ?? "";

  if (!(tingkat in TINGKAT)) {
    return NextResponse.json({ galat: "tingkat tidak dikenal" }, { status: 400 });
  }
  const jenis = TINGKAT[tingkat as Tingkat];
  const perluKode = jenis !== "provinces";
  if (perluKode && !KODE.test(kode)) {
    return NextResponse.json({ galat: "kode wilayah tidak sah" }, { status: 400 });
  }

  const sumber = perluKode
    ? `https://wilayah.id/api/${jenis}/${kode}.json`
    : `https://wilayah.id/api/${jenis}.json`;

  try {
    const jawab = await fetch(sumber, {
      headers: { accept: "application/json" },
      next: { revalidate: SEHARI * 30 },
    });
    if (!jawab.ok) throw new Error(`upstream ${jawab.status}`);

    const isi = (await jawab.json()) as {
      data?: { code: string; name: string }[];
    };
    const daftar = (isi.data ?? []).map((w) => ({ kode: w.code, nama: w.name }));

    return NextResponse.json(
      { daftar },
      {
        headers: {
          // Peramban menyimpan sehari, CDN sebulan. Host mengisi formulir ini
          // sekali per ruang; tanpa cache, tiap ketukan pada select memanggil
          // ulang sesuatu yang jawabannya sama sepanjang tahun.
          "cache-control": `public, max-age=${SEHARI}, s-maxage=${SEHARI * 30}, stale-while-revalidate=${SEHARI}`,
        },
      }
    );
  } catch {
    // Tidak dipura-purakan berhasil dengan daftar kosong: formulirnya harus
    // tahu bedanya, supaya ia bisa berpindah ke pengisian manual.
    return NextResponse.json(
      { galat: "daftar wilayah sedang tidak bisa diambil" },
      { status: 502 }
    );
  }
}
