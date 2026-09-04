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
export type PosisiLantai = "dasar_rata" | "dasar_tangga" | "lantai_2" | "lantai_3_plus";
export type JarakParkir = "lt10m" | "10_30m" | "gt30m";
export type KondisiBangunan = "dinding_atap" | "atap_saja" | "terbuka";
export type Berbagi = "eksklusif" | "dengan_penyewa_lain" | "dengan_barang_host";
export type Kelembapan = "kering_ventilasi" | "kering_tanpa_ventilasi" | "cenderung_lembap";
export type Kepemilikan = "milik_sendiri" | "menyewa";

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
  penulis: { nama: string; foto_url: string | null } | null;
};

/**
 * Satu ruang, kolom publik saja.
 *
 * `alamat`, `patokan`, `lat`, dan `lng` sengaja tidak ikut: keduanya baru
 * terbuka di tingkat 2 (setelah jadwal survei disetujui) dan tingkat 3
 * (setelah dibayar).
 *
 * PERINGATAN: sekarang yang menahannya cuma daftar kolom di kueri ini, bukan
 * database. RLS masih permisif, jadi siapa pun yang menembak REST API langsung
 * masih bisa membaca alamatnya. Tercatat sebagai utang nomor 2 di CLAUDE.md dan
 * ditutup bersamaan dengan langkah auth.
 */
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
};

export type DetailRuang = {
  ruang: RuangPublik;
  host: HostRingkas | null;
  foto: FotoRuang[];
  ulasan: UlasanRuang[];
  /** Pemesanan yang sedang berjalan, kalau ada — menentukan tanggal kosongnya. */
  tersewaSampai: string | null;
};

const KOLOM_PUBLIK = [
  "id", "judul", "tipe", "kelurahan", "kecamatan", "kota",
  "lat_publik", "lng_publik",
  "panjang_m", "lebar_m", "tinggi_m", "luas_m2", "volume_m3",
  "akses_masuk", "posisi_lantai", "lebar_pintu_cm", "jarak_parkir",
  "kondisi_bangunan", "penguncian", "berbagi", "kelembapan",
  "riwayat_banjir", "tinggi_lantai_cm", "pengawasan", "fasilitas",
  "kategori_diterima", "jendela_akses", "kuota_akses_bulanan",
  "durasi_min_hari", "harga_bulanan", "deposit", "kepemilikan",
  "terbuka_alamat", "status", "dibuat_pada",
].join(", ");

/** Status pemesanan yang berarti ruangnya sedang tidak bisa disewa orang lain. */
const STATUS_TERPAKAI = [
  "menunggu_pembayaran",
  "menunggu_serah_terima",
  "aktif",
  "menunggu_serah_terima_keluar",
];

/**
 * Semua yang dibutuhkan halaman detail, dalam empat kueri paralel.
 *
 * Mengembalikan `null` kalau ruangnya tidak ada atau tidak tayang — halaman
 * memakai itu untuk `notFound()`. Ruang berstatus draf atau ditangguhkan tidak
 * boleh bisa dibuka lewat menebak URL.
 */
export async function getDetailRuang(id: string): Promise<DetailRuang | null> {
  const db = klien();

  const [r, f, u, p] = await Promise.all([
    db
      .from("ruang")
      .select(`${KOLOM_PUBLIK}, host:profil(nama, foto_url, terverifikasi, bergabung, kota)`)
      .eq("id", id)
      .eq("status", "tayang")
      .maybeSingle(),
    db
      .from("ruang_foto")
      .select("id, url, urutan, keterangan")
      .eq("ruang_id", id)
      .order("urutan"),
    // Ulasan menempel ke pemesanan, bukan ke ruang, jadi penyaringannya lewat
    // embed `!inner` — tanpa `!inner` PostgREST mengembalikan seluruh ulasan.
    db
      .from("ulasan")
      .select("id, skor, akurasi, komentar, pada, penulis:profil(nama, foto_url), pemesanan!inner(ruang_id)")
      .eq("pemesanan.ruang_id", id)
      .eq("arah", "untuk_host")
      .order("pada", { ascending: false }),
    db
      .from("pemesanan")
      .select("selesai, status")
      .eq("ruang_id", id)
      .in("status", STATUS_TERPAKAI)
      .order("selesai", { ascending: false })
      .limit(1),
  ]);

  if (r.error) throw r.error;
  if (f.error) throw f.error;
  if (u.error) throw u.error;
  if (p.error) throw p.error;
  if (!r.data) return null;

  const { host, ...ruang } = r.data as unknown as RuangPublik & {
    host: HostRingkas | HostRingkas[] | null;
  };

  return {
    ruang,
    // PostgREST mengembalikan objek untuk relasi many-to-one, tapi bentuknya
    // pernah berupa array di versi lama — dua-duanya ditangani.
    host: Array.isArray(host) ? (host[0] ?? null) : host,
    foto: (f.data ?? []) as FotoRuang[],
    ulasan: (u.data ?? []) as unknown as UlasanRuang[],
    tersewaSampai: (p.data?.[0] as { selesai: string } | undefined)?.selesai ?? null,
  };
}
