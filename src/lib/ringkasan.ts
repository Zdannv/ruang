/**
 * Angka-angka untuk landing page.
 *
 * Semuanya dari view publik, jadi halaman depan tidak butuh sesi dan bisa
 * dibuka siapa pun. Kalau salah satu kueri gagal, yang dikembalikan nol —
 * beranda tetap tampil, cuma tanpa angkanya. Halaman depan yang kosong karena
 * satu kueri gagal jauh lebih buruk daripada halaman depan tanpa statistik.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type RingkasanPasar = {
  jumlahRuang: number;
  jumlahKecamatan: number;
  hargaTermurah: number | null;
  /** Total permintaan ruang yang belum terlayani, dari `permintaan_kecamatan`. */
  jumlahPencari: number;
  kecamatanTeratas: { kecamatan: string; kota: string; jumlah: number }[];
};

export async function getRingkasanPasar(db: SupabaseClient): Promise<RingkasanPasar> {
  const kosong: RingkasanPasar = {
    jumlahRuang: 0,
    jumlahKecamatan: 0,
    hargaTermurah: null,
    jumlahPencari: 0,
    kecamatanTeratas: [],
  };

  try {
    const [ruang, permintaan] = await Promise.all([
      db.from("ruang_publik").select("kecamatan, kota, harga_bulanan"),
      db.from("permintaan_kecamatan").select("kota, kecamatan, jumlah"),
    ]);
    if (ruang.error || permintaan.error) return kosong;

    const baris = (ruang.data ?? []) as { kecamatan: string; harga_bulanan: number }[];
    const minta = (permintaan.data ?? []) as {
      kota: string;
      kecamatan: string;
      jumlah: number;
    }[];

    return {
      jumlahRuang: baris.length,
      jumlahKecamatan: new Set(baris.map((r) => r.kecamatan)).size,
      hargaTermurah:
        baris.length > 0 ? Math.min(...baris.map((r) => r.harga_bulanan)) : null,
      jumlahPencari: minta.reduce((t, m) => t + m.jumlah, 0),
      kecamatanTeratas: [...minta].sort((a, b) => b.jumlah - a.jumlah).slice(0, 4),
    };
  } catch {
    return kosong;
  }
}
