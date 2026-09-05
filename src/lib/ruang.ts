/**
 * Lapisan data untuk ruang.
 *
 * Semua bacaan publik lewat view (`ruang_publik`, `ruang_foto_publik`,
 * `ulasan_publik`, `ruang_ketersediaan`) dan satu fungsi (`ruang_terdekat`),
 * bukan langsung ke tabel. Itu yang menegakkan keterbukaan alamat tiga
 * tingkat: `alamat`, `patokan`, `lat`, dan `lng` tidak ada di view mana pun,
 * dan anon tidak punya hak select ke tabel `ruang` sama sekali. Jadi bukan
 * kode ini yang menahannya — kode ini bahkan tidak bisa mengambilnya.
 *
 * Setiap fungsi menerima klien secara eksplisit: `klienBrowser()` dari
 * komponen klien, `await klienServer()` dari Server Component. Sengaja tanpa
 * nilai bawaan — klien browser yang terpakai di server akan gagal dengan
 * pesan yang membingungkan.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

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
export type PosisiLantai = "dasar_rata" | "dasar_tangga" | "lantai_2" | "lantai_3_plus";
export type JarakParkir = "lt10m" | "10_30m" | "gt30m";
export type KondisiBangunan = "dinding_atap" | "atap_saja" | "terbuka";
export type Berbagi = "eksklusif" | "dengan_penyewa_lain" | "dengan_barang_host";
export type Kelembapan = "kering_ventilasi" | "kering_tanpa_ventilasi" | "cenderung_lembap";
export type Kepemilikan = "milik_sendiri" | "menyewa";

// ─────────────────────────────────────────────────────────────────────────────
// Pencarian
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Satu baris hasil `ruang_terdekat()`.
 *
 * `jarak_km` dihitung dari koordinat asli di dalam fungsi (yang berjalan
 * SECURITY DEFINER), sedangkan yang dikembalikan cuma titik publik yang sudah
 * digeser ±200 m. Penyamaran lokasi tidak mengurangi kualitas pencarian
 * terdekat, tapi juga tidak bisa dibalik dari hasilnya.
 */
export type HasilRuang = {
  id: string;
  judul: string;
  tipe: TipeRuang;
  kecamatan: string;
  kota: string;
  lat_publik: number;
  lng_publik: number;
  volume_m3: number;
  harga_bulanan: number;
  akses_masuk: AksesMasuk;
  riwayat_banjir: RiwayatBanjir;
  penguncian: Penguncian;
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
 * Fotonya diambil di kueri kedua, bukan digabung di SQL: `ruang_terdekat()`
 * mengembalikan satu baris per ruang sedangkan fotonya banyak per ruang, jadi
 * join-nya akan mengulang tiap baris hasil sebanyak jumlah fotonya.
 */
export async function cariRuang(
  db: SupabaseClient,
  filter: FilterPencarian
): Promise<RuangDenganFoto[]> {
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

  const foto = await fotoPertama(db, hasil.map((r) => r.id));
  return hasil.map((r) => ({ ...r, foto: foto.get(r.id) ?? null }));
}

/**
 * Foto bernomor urut terkecil untuk tiap ruang.
 *
 * Diambil semua lalu dipilih yang pertama per ruang di sini: PostgREST tidak
 * punya "ambil satu baris per grup", dan `urutan = 0` tidak dijamin ada kalau
 * foto pertamanya dihapus host.
 */
async function fotoPertama(
  db: SupabaseClient,
  ruangIds: string[]
): Promise<Map<string, string>> {
  const { data, error } = await db
    .from("ruang_foto_publik")
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

// ─────────────────────────────────────────────────────────────────────────────
// Detail satu ruang
// ─────────────────────────────────────────────────────────────────────────────

export type FotoRuang = {
  id: string;
  url: string;
  urutan: number;
  /** "mulut gang" | "tampak depan" | "jalur akses" | "sudut A" | ... */
  keterangan: string;
};

export type HostRingkas = {
  nama: string;
  foto_url: string | null;
  terverifikasi: boolean;
  bergabung: string;
  kota: string;
};

export type UlasanRuang = {
  id: string;
  skor: number;
  /** Kesesuaian rubrik dengan kenyataan di lapangan; boleh kosong. */
  akurasi: number | null;
  komentar: string | null;
  pada: string;
  penulis_nama: string;
  penulis_foto_url: string | null;
};

/** Satu baris `ruang_publik` — kolom publik, plus data host yang sudah ikut. */
export type RuangPublik = {
  id: string;
  judul: string;
  tipe: TipeRuang;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  lat_publik: number;
  lng_publik: number;
  panjang_m: number;
  lebar_m: number;
  tinggi_m: number;
  luas_m2: number;
  volume_m3: number;
  akses_masuk: AksesMasuk;
  posisi_lantai: PosisiLantai;
  lebar_pintu_cm: number;
  jarak_parkir: JarakParkir;
  kondisi_bangunan: KondisiBangunan;
  penguncian: Penguncian;
  berbagi: Berbagi;
  kelembapan: Kelembapan;
  riwayat_banjir: RiwayatBanjir;
  tinggi_lantai_cm: number;
  pengawasan: string[];
  fasilitas: string[];
  kategori_diterima: string[];
  jendela_akses: string;
  kuota_akses_bulanan: number;
  durasi_min_hari: number;
  harga_bulanan: number;
  deposit: number;
  kepemilikan: Kepemilikan;
  terbuka_alamat: boolean;
  status: string;
  dibuat_pada: string;
  host_id: string;
  host_nama: string;
  host_foto_url: string | null;
  host_terverifikasi: boolean;
  host_bergabung: string;
  host_kota: string;
};

export type DetailRuang = {
  ruang: RuangPublik;
  /**
   * Alamat lengkap — hanya terisi kalau RLS mengizinkan pemanggil membacanya:
   * host ruangnya, penyewa yang alamatnya dibuka lewat percakapan (tingkat 2),
   * atau penyewa yang pemesanannya sudah dibayar (tingkat 3). Kalau tidak,
   * hasilnya `null` tanpa galat — RLS menyaring baris, bukan menolak kuerinya.
   */
  alamatLengkap: { alamat: string; patokan: string | null } | null;
  host: HostRingkas;
  foto: FotoRuang[];
  ulasan: UlasanRuang[];
  /** Tanggal ruangnya kosong lagi, kalau sedang tersewa. Tanpa menyebut siapa. */
  tersewaSampai: string | null;
};

/**
 * Semua yang dibutuhkan halaman detail, dalam empat kueri paralel.
 *
 * Mengembalikan `null` kalau ruangnya tidak ada — termasuk kalau statusnya draf
 * atau ditangguhkan, karena `ruang_publik` sudah menyaring `status = 'tayang'`
 * di dalam view. Jadi ruang yang belum siap tidak bisa dibuka lewat menebak
 * URL, dan itu ditegakkan di database, bukan di sini.
 */
export async function getDetailRuang(
  db: SupabaseClient,
  id: string
): Promise<DetailRuang | null> {
  const [r, f, u, k] = await Promise.all([
    db.from("ruang_publik").select("*").eq("id", id).maybeSingle(),
    db
      .from("ruang_foto_publik")
      .select("id, url, urutan, keterangan")
      .eq("ruang_id", id)
      .order("urutan"),
    db
      .from("ulasan_publik")
      .select("id, skor, akurasi, komentar, pada, penulis_nama, penulis_foto_url")
      .eq("ruang_id", id)
      .eq("arah", "untuk_host")
      .order("pada", { ascending: false }),
    db.from("ruang_ketersediaan").select("tersewa_sampai").eq("ruang_id", id).maybeSingle(),
  ]);

  if (r.error) throw r.error;
  if (f.error) throw f.error;
  if (u.error) throw u.error;
  if (k.error) throw k.error;
  if (!r.data) return null;

  const ruang = r.data as unknown as RuangPublik;

  const { data: alamat } = await db
    .from("ruang")
    .select("alamat, patokan")
    .eq("id", id)
    .maybeSingle();

  return {
    ruang,
    alamatLengkap: (alamat as { alamat: string; patokan: string | null } | null) ?? null,
    host: {
      nama: ruang.host_nama,
      foto_url: ruang.host_foto_url,
      terverifikasi: ruang.host_terverifikasi,
      bergabung: ruang.host_bergabung,
      kota: ruang.host_kota,
    },
    foto: (f.data ?? []) as FotoRuang[],
    ulasan: (u.data ?? []) as unknown as UlasanRuang[],
    tersewaSampai:
      (k.data as { tersewa_sampai: string | null } | null)?.tersewa_sampai ?? null,
  };
}
