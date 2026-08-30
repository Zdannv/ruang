/**
 * Terjemahan nilai enum database ke kalimat yang dibaca orang.
 *
 * Ditulis sekali di sini supaya kartu hasil, halaman detail, dan dasbor host
 * tidak berbeda menyebut hal yang sama. Seluruh UI berbahasa Indonesia, sesuai
 * CLAUDE.md.
 */

import type { AksesMasuk, Penguncian, RiwayatBanjir, TipeRuang } from "@/lib/ruang";

export const LABEL_TIPE: Record<TipeRuang, string> = {
  kamar: "Kamar",
  garasi: "Garasi",
  gudang: "Gudang",
  lantai_ruko: "Lantai ruko",
  mezanin: "Mezanin",
  bawah_tangga: "Bawah tangga",
  loteng: "Loteng",
  kontainer: "Kontainer",
};

export const LABEL_AKSES: Record<AksesMasuk, string> = {
  truk_engkel: "Muat truk engkel",
  mobil_pikap: "Muat mobil pikap",
  hanya_motor: "Hanya motor",
  jalan_kaki: "Jalan kaki",
};

export const LABEL_PENGUNCIAN: Record<Penguncian, string> = {
  kunci_penyewa: "Kunci dipegang penyewa",
  kunci_host: "Kunci dipegang host",
  tanpa_kunci: "Tanpa kunci",
};

export const LABEL_BANJIR: Record<RiwayatBanjir, string> = {
  tidak_pernah: "Tidak pernah banjir",
  lebih_5_tahun: "Banjir >5 tahun lalu",
  dalam_5_tahun: "Pernah banjir dalam 5 tahun",
};

/** Riwayat banjir yang perlu ditonjolkan, bukan disembunyikan di antara chip lain. */
export function banjirPerluPerhatian(nilai: RiwayatBanjir): boolean {
  return nilai === "dalam_5_tahun";
}

/** "Rp450.000". Rupiah penuh, tanpa desimal — uang disimpan bigint. */
export function rupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

/**
 * "1,2 km" atau "850 m" — di bawah 1 km, meter lebih mudah dibayangkan.
 *
 * Titik preset bisa kebetulan persis menimpa koordinat sebuah ruang (titik UB
 * memang begitu di data demo), dan "0 m dari titikmu" terbaca seperti bug.
 * Lagi pula koordinat yang ditampilkan sudah digeser ±200 m, jadi menyebut
 * angka setepat itu memang bukan klaim yang bisa dipertanggungjawabkan.
 */
export function jarak(km: number): string {
  if (km < 0.05) return "kurang dari 50 m";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/** "13,5 m³". `volume_m3` datang sebagai numeric, jadi bisa berupa string. */
export function volume(m3: number | string): string {
  const n = typeof m3 === "string" ? Number(m3) : m3;
  return `${n.toFixed(1).replace(".", ",")} m³`;
}
