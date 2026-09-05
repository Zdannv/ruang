/**
 * Balasan cepat untuk host.
 *
 * Ada dua macam, dan bedanya penting:
 *
 * 1. **Disusun dari data ruangnya** — lebar pintu, jendela akses, sewa
 *    minimum. Tidak disimpan di mana pun; dihitung di sini setiap kali dari
 *    kolom yang sudah ada. Menyimpannya justru berbahaya: balasan tersimpan
 *    bisa menyebut lebar pintu lama setelah pintunya diganti.
 * 2. **Ditulis host sendiri** — untuk hal yang memang tidak ada di rubrik
 *    ("sebaiknya datang sore, pagi ramai"). Yang ini disimpan di tabel
 *    `balasan_cepat`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LABEL_AKSES,
  LABEL_BANJIR,
  LABEL_BERBAGI,
  LABEL_KATEGORI,
  LABEL_KELEMBAPAN,
  LABEL_PARKIR,
  LABEL_PENGUNCIAN,
  LABEL_POSISI,
  labelDaftar,
  rupiah,
} from "@/lib/label";

export type BalasanTersimpan = {
  id: string;
  isi: string;
};

export type BalasanSiap = {
  /** Teks pendek untuk chip. */
  label: string;
  /** Kalimat utuh yang dimasukkan ke kotak tulis. */
  isi: string;
};

/** Kolom ruang yang dibutuhkan untuk menyusun balasan. */
export type RuangUntukBalasan = {
  akses_masuk: string;
  lebar_pintu_cm: number;
  jarak_parkir: string;
  posisi_lantai: string;
  jendela_akses: string;
  kuota_akses_bulanan: number;
  durasi_min_hari: number;
  harga_bulanan: number;
  deposit: number;
  kategori_diterima: string[];
  penguncian: string;
  berbagi: string;
  kelembapan: string;
  riwayat_banjir: string;
};

/**
 * Menyusun jawaban dari data ruangnya sendiri.
 *
 * Semua kalimat di bawah hanya menyatakan ulang apa yang sudah diisi host di
 * rubrik. Tidak ada satu pun yang mengarang: kalau hostnya mengubah lebar
 * pintu, balasannya ikut berubah tanpa ada yang perlu menyuntingnya.
 */
export function balasanDariRuang(r: RuangUntukBalasan): BalasanSiap[] {
  const kategori = labelDaftar(r.kategori_diterima, LABEL_KATEGORI);

  return [
    {
      label: "Akses masuk",
      isi:
        `${LABEL_AKSES[r.akses_masuk as keyof typeof LABEL_AKSES] ?? r.akses_masuk}. ` +
        `Lebar pintunya ${r.lebar_pintu_cm} cm, ` +
        `${(LABEL_PARKIR[r.jarak_parkir as keyof typeof LABEL_PARKIR] ?? r.jarak_parkir).toLowerCase()}, ` +
        `dan posisinya ${(LABEL_POSISI[r.posisi_lantai as keyof typeof LABEL_POSISI] ?? r.posisi_lantai).toLowerCase()}.`,
    },
    {
      label: "Jam datang",
      isi:
        `Jam aksesnya ${r.jendela_akses}, dengan kuota ${r.kuota_akses_bulanan} kunjungan per bulan. ` +
        `Jadwalnya diatur lewat aplikasi ini supaya tercatat.`,
    },
    {
      label: "Harga & minimum",
      isi:
        `Sewanya ${rupiah(r.harga_bulanan)} per bulan` +
        (r.deposit > 0 ? `, deposit ${rupiah(r.deposit)} yang dikembalikan di akhir sewa` : ", tanpa deposit") +
        `. Minimal ${r.durasi_min_hari} hari.`,
    },
    {
      label: "Barang diterima",
      isi:
        kategori.length > 0
          ? `Yang saya terima: ${kategori.join(", ").toLowerCase()}. Di luar itu belum bisa ya.`
          : "Untuk jenis barangnya, boleh disebutkan dulu apa saja yang mau disimpan?",
    },
    {
      label: "Kondisi ruang",
      isi:
        `${LABEL_KELEMBAPAN[r.kelembapan as keyof typeof LABEL_KELEMBAPAN] ?? r.kelembapan}, ` +
        `${(LABEL_BANJIR[r.riwayat_banjir as keyof typeof LABEL_BANJIR] ?? r.riwayat_banjir).toLowerCase()}. ` +
        `${LABEL_PENGUNCIAN[r.penguncian as keyof typeof LABEL_PENGUNCIAN] ?? r.penguncian}, ` +
        `dan ruangannya ${(LABEL_BERBAGI[r.berbagi as keyof typeof LABEL_BERBAGI] ?? r.berbagi).toLowerCase()}.`,
    },
    {
      label: "Silakan lihat",
      isi:
        "Boleh, silakan datang lihat dulu sebelum memesan. Alamat lengkapnya saya buka " +
        "di percakapan ini ya.",
    },
  ];
}

/** Pertanyaan pembuka untuk penyewa, saat utasnya masih kosong. */
export const PERTANYAAN_PEMBUKA = [
  "Halo, ruangnya masih tersedia?",
  "Boleh saya lihat dulu sebelum memesan?",
  "Kira-kira muat berapa banyak barang ya?",
  "Bisa mulai sewa bulan depan?",
];

export async function daftarBalasan(db: SupabaseClient): Promise<BalasanTersimpan[]> {
  const { data, error } = await db
    .from("balasan_cepat")
    .select("id, isi")
    .order("dibuat_pada");
  if (error) return [];
  return (data ?? []) as BalasanTersimpan[];
}

export async function simpanBalasan(
  db: SupabaseClient,
  profilId: string,
  isi: string
): Promise<void> {
  const bersih = isi.trim();
  if (bersih === "") throw new Error("Balasannya kosong.");
  if (bersih.length > 500) throw new Error("Balasan cepat maksimal 500 karakter.");

  const { error } = await db
    .from("balasan_cepat")
    .insert({ profil_id: profilId, isi: bersih });
  if (error) throw error;
}

export async function hapusBalasan(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("balasan_cepat").delete().eq("id", id);
  if (error) throw error;
}
