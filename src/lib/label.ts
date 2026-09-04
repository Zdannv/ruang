/**
 * Terjemahan nilai enum database ke kalimat yang dibaca orang.
 *
 * Ditulis sekali di sini supaya kartu hasil, halaman detail, dan dasbor host
 * tidak berbeda menyebut hal yang sama. Seluruh UI berbahasa Indonesia, sesuai
 * CLAUDE.md.
 */

import type {
  AksesMasuk,
  Berbagi,
  Kelembapan,
  Kepemilikan,
  KondisiBangunan,
  JarakParkir,
  Penguncian,
  PosisiLantai,
  RiwayatBanjir,
  TipeRuang,
} from "@/lib/ruang";

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

export const LABEL_POSISI: Record<PosisiLantai, string> = {
  dasar_rata: "Lantai dasar, rata tanpa tangga",
  dasar_tangga: "Lantai dasar, ada tangga",
  lantai_2: "Lantai 2",
  lantai_3_plus: "Lantai 3 atau lebih",
};

export const LABEL_PARKIR: Record<JarakParkir, string> = {
  lt10m: "Kurang dari 10 m dari parkir",
  "10_30m": "10-30 m dari parkir",
  gt30m: "Lebih dari 30 m dari parkir",
};

export const LABEL_BANGUNAN: Record<KondisiBangunan, string> = {
  dinding_atap: "Berdinding dan beratap",
  atap_saja: "Beratap, tanpa dinding penuh",
  terbuka: "Terbuka",
};

export const LABEL_BERBAGI: Record<Berbagi, string> = {
  eksklusif: "Dipakai sendiri",
  dengan_penyewa_lain: "Berbagi dengan penyewa lain",
  dengan_barang_host: "Berbagi dengan barang host",
};

export const LABEL_KELEMBAPAN: Record<Kelembapan, string> = {
  kering_ventilasi: "Kering, ada ventilasi",
  kering_tanpa_ventilasi: "Kering, tanpa ventilasi",
  cenderung_lembap: "Cenderung lembap",
};

export const LABEL_KEPEMILIKAN: Record<Kepemilikan, string> = {
  milik_sendiri: "Milik host sendiri",
  menyewa: "Host menyewa dari pemilik",
};

/**
 * Isi kolom `text[]`. Nilai yang belum ada di sini tetap ditampilkan apa adanya
 * lewat `labelDaftar()` — lebih baik user melihat "kunci_ganda" daripada
 * fasilitas itu hilang tanpa jejak karena kami lupa menerjemahkannya.
 */
export const LABEL_PENGAWASAN: Record<string, string> = {
  cctv: "CCTV",
  penghuni_24jam: "Ada penghuni 24 jam",
  satpam: "Satpam",
  pagar: "Berpagar",
};

export const LABEL_FASILITAS: Record<string, string> = {
  rak: "Rak",
  palet: "Palet",
  listrik: "Listrik",
  lampu: "Lampu",
  troli: "Troli",
};

export const LABEL_KATEGORI: Record<string, string> = {
  kardus: "Kardus",
  perabot: "Perabot",
  dokumen: "Dokumen",
  elektronik: "Elektronik",
  stok_dagangan: "Stok dagangan",
  sepeda_motor: "Sepeda motor",
  alat_musik: "Alat musik",
  ban_perkakas: "Ban & perkakas",
};

/** Terjemahkan isi kolom array; yang tidak dikenal dirapikan, bukan dibuang. */
export function labelDaftar(nilai: string[], peta: Record<string, string>): string[] {
  return nilai.map((v) => peta[v] ?? v.replace(/_/g, " "));
}

/** "8,0 x 5,0 x 3,2 m". */
export function dimensi(p: number | string, l: number | string, t: number | string): string {
  const n = (v: number | string) =>
    (typeof v === "string" ? Number(v) : v).toFixed(1).replace(".", ",");
  return `${n(p)} x ${n(l)} x ${n(t)} m`;
}

/** "40,0 m2" — luas datang sebagai numeric, jadi bisa berupa string. */
export function luas(m2: number | string): string {
  const n = typeof m2 === "string" ? Number(m2) : m2;
  return `${n.toFixed(1).replace(".", ",")} m²`;
}

/** "15 Juli 2026" — tanggal ditampilkan waktu Jakarta, sesuai aturan di CLAUDE.md. */
export function tanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** "Juli 2026" — untuk "bergabung sejak". */
export function bulanTahun(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

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
