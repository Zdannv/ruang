/**
 * Lapisan data untuk pencarian ruang.
 *
 * Semua tabel demo berstatus public-read lewat RLS, jadi pencarian jalan
 * dengan anon key tanpa login — sesuai keputusan "switcher peran, bukan auth".
 */

import { klien } from "@/lib/supabase";

export type TipeRuang =
  | "kamar"
  | "garasi"
  | "gudang"
  | "lantai_ruko"
  | "mezanin"
  | "bawah_tangga"
  | "loteng"
  | "kontainer";

export type AksesMasuk = "truk_engkel" | "mobil_pikap" | "hanya_motor" | "jalan_kaki";
export type Penguncian = "kunci_penyewa" | "kunci_host" | "tanpa_kunci";
export type RiwayatBanjir = "tidak_pernah" | "lebih_5_tahun" | "dalam_5_tahun";

/**
 * Satu baris hasil `ruang_terdekat()`.
 *
 * Perhatikan yang TIDAK ada di sini: `alamat`, `patokan`, `lat`, `lng`. Fungsi
 * di database memang tidak mengembalikannya — keterbukaan alamat tingkat 2
 * baru terbuka setelah jadwal survei disetujui host, dan aturan itu ditegakkan
 * di sisi database, bukan dengan berjanji tidak merendernya di sini.
 */
export type HasilRuang = {
  id: string;
  judul: string;
  tipe: TipeRuang;
  kecamatan: string;
  kota: string;
  /** Titik yang digeser tetap ±200 m — ini yang boleh dipetakan. */
  lat_publik: number;
  lng_publik: number;
  volume_m3: number;
  harga_bulanan: number;
  akses_masuk: AksesMasuk;
  riwayat_banjir: RiwayatBanjir;
  penguncian: Penguncian;
  /**
   * Dihitung dari koordinat asli, bukan dari titik publik. Penyamaran lokasi
   * tidak boleh mengurangi kualitas pencarian terdekat.
   */
  jarak_km: number;
};

export type FilterPencarian = {
  lat: number;
  lng: number;
  radiusKm: number;
  /** m³; 0 berarti tanpa batas bawah. */
  volumeMin: number;
  /** rupiah penuh; 0 berarti tanpa batas atas. */
  hargaMaks: number;
};

/** Sama dengan nilai bawaan `p_harga_maks` di `ruang_terdekat()`. */
const HARGA_TANPA_BATAS = 999999999;

export type RuangDenganFoto = HasilRuang & { foto: string | null };

/**
 * Cari ruang terdekat, lalu lengkapi dengan satu foto per ruang.
 *
 * `ruang_terdekat()` sengaja tidak ikut mengembalikan foto — ia mengembalikan
 * satu baris per ruang, sedangkan foto ada banyak per ruang. Menggabungkannya
 * di SQL berarti mengulang tiap baris hasil sebanyak jumlah fotonya. Jadi
 * fotonya diambil di kueri kedua, sekali untuk seluruh halaman hasil.
 */
export async function cariRuang(filter: FilterPencarian): Promise<RuangDenganFoto[]> {
  const db = klien();

  const { data, error } = await db.rpc("ruang_terdekat", {
    p_lat: filter.lat,
    p_lng: filter.lng,
    p_radius_km: filter.radiusKm,
    p_volume_min: filter.volumeMin,
    p_harga_maks: filter.hargaMaks > 0 ? filter.hargaMaks : HARGA_TANPA_BATAS,
  });
  if (error) throw error;

  const hasil = (data ?? []) as HasilRuang[];
  if (hasil.length === 0) return [];

  const foto = await fotoPertama(hasil.map((r) => r.id));
  return hasil.map((r) => ({ ...r, foto: foto.get(r.id) ?? null }));
}

/**
 * Foto bernomor urut terkecil untuk tiap ruang.
 *
 * Diambil semua lalu dipilih yang pertama per ruang di sini: PostgREST tidak
 * punya "ambil satu baris per grup", dan `urutan = 0` tidak dijamin ada kalau
 * nanti foto pertama dihapus host.
 */
async function fotoPertama(ruangIds: string[]): Promise<Map<string, string>> {
  const db = klien();
  const { data, error } = await db
    .from("ruang_foto")
    .select("ruang_id, url, urutan")
    .in("ruang_id", ruangIds)
    .order("urutan");
  if (error) throw error;

  const peta = new Map<string, string>();
  for (const row of (data ?? []) as { ruang_id: string; url: string }[]) {
    if (!peta.has(row.ruang_id)) peta.set(row.ruang_id, row.url);
  }
  return peta;
}
