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

export type RuangSorotan = {
  id: string;
  judul: string;
  kecamatan: string;
  harga_bulanan: number;
  foto: string | null;
};

/**
 * Beberapa ruang untuk dipajang di halaman depan.
 *
 * Ruang sungguhan dari database, bukan gambar hiasan. Halaman depan yang
 * memajang foto stok tidak memberi tahu apa pun tentang isi platformnya;
 * memajang tiga ruang yang benar-benar tayang langsung menjawab pertanyaan
 * pertama setiap pengunjung — "ada apa saja di sini?".
 */
export async function ruangSorotan(
  db: SupabaseClient,
  jumlah = 3
): Promise<RuangSorotan[]> {
  try {
    const { data, error } = await db
      .from("ruang_publik")
      .select("id, judul, kecamatan, harga_bulanan")
      .order("dibuat_pada", { ascending: false })
      .limit(jumlah);
    if (error || !data || data.length === 0) return [];

    const ids = (data as { id: string }[]).map((r) => r.id);
    const { data: foto } = await db
      .from("ruang_foto_publik")
      .select("ruang_id, url, urutan")
      .in("ruang_id", ids)
      .order("urutan");

    const peta = new Map<string, string>();
    for (const f of (foto ?? []) as { ruang_id: string; url: string }[]) {
      if (!peta.has(f.ruang_id)) peta.set(f.ruang_id, f.url);
    }

    return (data as Omit<RuangSorotan, "foto">[]).map((r) => ({
      ...r,
      foto: peta.get(r.id) ?? null,
    }));
  } catch {
    return [];
  }
}
