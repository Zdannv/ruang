/**
 * Angka-angka untuk landing page.
 *
 * Semuanya dari view publik, jadi halaman depan tidak butuh sesi dan bisa
 * dibuka siapa pun. Kalau salah satu kueri gagal, yang dikembalikan nol —
 * beranda tetap tampil, cuma tanpa angkanya. Halaman depan yang kosong karena
 * satu kueri gagal jauh lebih buruk daripada halaman depan tanpa statistik.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { fotoPertama, type RuangDenganFoto } from "@/lib/ruang";

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

/*
  `ruangSorotan()` dan `KolaseSorotan` dibuang 8 September 2026; sorotannya
  sekarang dua ilustrasi (lihat `SorotanPromo`).

  `ruangContoh()` di bawah bukan pengembaliannya. Yang dulu itu menumpuk foto
  jadi hero; yang ini menampilkan KARTU LISTING utuh di tengah halaman depan,
  supaya pengunjung tahu bentuk isinya sebelum menekan apa pun.
*/

/**
 * Beberapa lahan tayang untuk dipamerkan di halaman depan.
 *
 * Diambil acak, dan itu memang keputusan sementara: nanti pilihannya dikelola
 * dari CMS lewat kolom `unggulan`. Sampai itu ada, acak lebih baik daripada
 * "terbaru" — dengan lima belas lahan pertama, "terbaru" berarti halaman
 * depan menampilkan tiga lahan yang sama sepanjang minggu.
 *
 * Diacaknya di sini, bukan di database: PostgREST tidak punya `order by
 * random()`, dan menambah fungsi RPC demi ini berarti satu migrasi untuk
 * sesuatu yang akan diganti CMS.
 *
 * Tanpa `jarak_km`, karena halaman depan tidak tahu di mana pengunjungnya —
 * lihat prop `tanpaJarak` di `KartuRuang`. Menampilkan "0 m" akan jadi angka
 * yang salah, bukan angka yang kosong.
 */
export async function ruangContoh(
  db: SupabaseClient,
  jumlah = 4
): Promise<RuangDenganFoto[]> {
  try {
    const { data, error } = await db
      .from("ruang_publik")
      .select(
        "id, judul, tipe, kecamatan, kota, lat_publik, lng_publik, " +
          "luas_m2, volume_m3, harga_bulanan, akses_masuk, riwayat_banjir, " +
          "penguncian, kategori_diterima"
      )
      .order("dibuat_pada", { ascending: false })
      // Ambil sekumpulan dulu, baru diacak — supaya yang tampil tidak selalu
      // lahan terlama di database.
      .limit(24);
    if (error || !data || data.length === 0) return [];

    const acak = [...(data as unknown as Omit<RuangDenganFoto, "foto" | "jarak_km">[])];
    for (let i = acak.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [acak[i], acak[j]] = [acak[j], acak[i]];
    }
    const dipilih = acak.slice(0, jumlah);

    const foto = await fotoPertama(db, dipilih.map((r) => r.id));
    return dipilih.map((r) => ({
      ...r,
      luas_m2: r.luas_m2 ?? 0,
      kategori_diterima: r.kategori_diterima ?? [],
      jarak_km: 0,
      foto: foto.get(r.id) ?? null,
    })) as RuangDenganFoto[];
  } catch {
    return [];
  }
}