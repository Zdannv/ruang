/**
 * Titik awal pencarian dan pilihan filternya.
 *
 * **Bawaannya Jakarta sejak 18 September 2026**, diminta pemiliknya,
 * menggantikan Waru/Aloha. Sidoarjo dan Surabaya TIDAK dibuang, cuma turun
 * dari urutan pertama: lahan pertama aplikasi ini ada di sana dan pemiliknya
 * bisa mendatanginya sendiri.
 *
 * Preset bukan hiasan: ia satu-satunya cara orang memulai pencarian sebelum
 * memberi izin lokasi, jadi kota yang salah di sini berarti hasil kosong pada
 * kunjungan pertama. Konsekuensinya sekarang harus ditulis terang: selama
 * belum ada satu pun lahan di Jakarta, pengunjung pertama yang tidak menekan
 * "Lokasiku" akan mendarat di hasil kosong, dan bagian "di luar radius" pun
 * tidak menolongnya karena Sidoarjo 660 km dari sini, jauh di luar
 * `RADIUS_LUAS_KM` yang 150 km.
 *
 * Jadi urutan ini benar HANYA kalau Jakarta ikut diisi. Kalau tidak, yang
 * seharusnya diubah bukan copy melainkan baris pertama daftar di bawah.
 *
 * Koordinatnya diambil dari Nominatim, bukan ditebak.
 */
export type Titik = { id: string; nama: string; lat: number; lng: number };

export const TITIK_PRESET: Titik[] = [
  // Jakarta
  { id: "jakarta", nama: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { id: "jaksel", nama: "Jakarta Selatan", lat: -6.2615, lng: 106.8106 },
  { id: "jaktim", nama: "Jakarta Timur", lat: -6.2250, lng: 106.9004 },
  { id: "jakbar", nama: "Jakarta Barat", lat: -6.1683, lng: 106.7588 },
  { id: "jakut", nama: "Jakarta Utara", lat: -6.1214, lng: 106.8740 },
  { id: "jakpus", nama: "Jakarta Pusat", lat: -6.1805, lng: 106.8284 },
  { id: "bekasi", nama: "Bekasi", lat: -6.2383, lng: 106.9756 },
  { id: "depok", nama: "Depok", lat: -6.4025, lng: 106.7942 },
  { id: "tangerang", nama: "Tangerang", lat: -6.1783, lng: 106.6319 },
  // Sidoarjo dan Surabaya, tempat lahan pertamanya benar-benar ada
  { id: "waru", nama: "Waru / Aloha", lat: -7.3527, lng: 112.7294 },
  { id: "gedangan", nama: "Gedangan", lat: -7.389, lng: 112.7286 },
  { id: "sidoarjo", nama: "Kota Sidoarjo", lat: -7.454, lng: 112.6594 },
  { id: "sepanjang", nama: "Sepanjang / Taman", lat: -7.3469, lng: 112.6984 },
  { id: "krian", nama: "Krian", lat: -7.403, lng: 112.5895 },
  { id: "rungkut", nama: "Rungkut / Surabaya Timur", lat: -7.3197, lng: 112.7905 },
];

export const TITIK_BAWAAN = TITIK_PRESET[0];

/**
 * Radius dalam km. 5 km menutup satu kecamatan beserta tetangganya, cukup
 * untuk bawaan, dan masih terasa "dekat rumah".
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

/**
 * Lebar muka jalan, disertai apa yang muat di sana.
 *
 * Ini ukuran yang dipikirkan pedagang, dan ia menggantikan volume sebagai
 * penyaring utama untuk lahan terbuka: yang menentukan bukan berapa kubik
 * udara di atas lahannya, melainkan berapa meter yang menghadap jalan.
 */
export const MUKA_PILIHAN = [
  { nilai: 0, label: "Semua lebar", bantuan: null },
  { nilai: 2, label: "≥ 2 m", bantuan: "gerobak" },
  { nilai: 3, label: "≥ 3 m", bantuan: "gerobak + kursi" },
  { nilai: 4, label: "≥ 4 m", bantuan: "tenda kecil" },
  { nilai: 6, label: "≥ 6 m", bantuan: "warung tenda" },
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
