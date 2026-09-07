/**
 * Titik awal pencarian dan pilihan filternya.
 *
 * Patokannya Sidoarjo dan Surabaya Selatan — wilayah tempat aplikasi ini
 * benar-benar akan diisi lebih dulu (diputuskan 7 September 2026, menggantikan
 * preset Malang yang berasal dari data contoh `02_seed.sql` dan sudah dibuang).
 * Preset bukan hiasan: ia satu-satunya cara orang memulai pencarian sebelum
 * memberi izin lokasi, jadi kota yang salah di sini berarti hasil kosong pada
 * kunjungan pertama.
 *
 * Bobotnya sengaja ke Sidoarjo, bukan dibagi rata dengan Surabaya. Kepadatan
 * yang membuat "1 km dari rumahmu" benar, dan satu wilayah yang terisi lebih
 * berguna daripada dua wilayah yang setengah-setengah.
 *
 * Koordinatnya diambil dari Nominatim, bukan ditebak.
 */
export type Titik = { id: string; nama: string; lat: number; lng: number };

export const TITIK_PRESET: Titik[] = [
  { id: "waru", nama: "Waru / Aloha", lat: -7.3527, lng: 112.7294 },
  { id: "gedangan", nama: "Gedangan", lat: -7.389, lng: 112.7286 },
  { id: "sidoarjo", nama: "Kota Sidoarjo", lat: -7.454, lng: 112.6594 },
  { id: "sepanjang", nama: "Sepanjang / Taman", lat: -7.3469, lng: 112.6984 },
  { id: "krian", nama: "Krian", lat: -7.403, lng: 112.5895 },
  { id: "rungkut", nama: "Rungkut / Surabaya Timur", lat: -7.3197, lng: 112.7905 },
];

export const TITIK_BAWAAN = TITIK_PRESET[0];

/**
 * Radius dalam km. 5 km menutup satu kecamatan beserta tetangganya di
 * Sidoarjo — cukup untuk bawaan, dan masih terasa "dekat rumah".
 */
export const RADIUS_PILIHAN = [1, 3, 5, 10, 15];
export const RADIUS_BAWAAN = 5;

/**
 * Volume disertai padanan sehari-hari. Orang tidak tahu 10 m³ itu seberapa,
 * tapi tahu persis seberapa banyak isi kamar kos.
 */
export const VOLUME_PILIHAN = [
  { nilai: 0, label: "Semua ukuran", bantuan: null },
  { nilai: 3, label: "≥ 3 m³", bantuan: "setumpuk kardus" },
  { nilai: 10, label: "≥ 10 m³", bantuan: "isi kamar kos" },
  { nilai: 20, label: "≥ 20 m³", bantuan: "isi rumah kecil" },
  { nilai: 40, label: "≥ 40 m³", bantuan: "stok dagangan" },
];

export const HARGA_PILIHAN = [
  { nilai: 0, label: "Semua harga" },
  { nilai: 300_000, label: "≤ Rp300rb" },
  { nilai: 500_000, label: "≤ Rp500rb" },
  { nilai: 1_000_000, label: "≤ Rp1 jt" },
  { nilai: 2_000_000, label: "≤ Rp2 jt" },
];

/** Preset yang koordinatnya sama persis dengan titik ini, kalau ada. */
export function presetDari(lat: number, lng: number): Titik | null {
  return (
    TITIK_PRESET.find(
      (t) => Math.abs(t.lat - lat) < 1e-6 && Math.abs(t.lng - lng) < 1e-6
    ) ?? null
  );
}
