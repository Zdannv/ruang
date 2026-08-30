/**
 * Titik awal pencarian dan pilihan filternya.
 *
 * Isi demo seluruhnya Malang (lihat 02_seed.sql), jadi preset-nya patokan yang
 * dikenal orang Malang. Waktu presentasi, "Kampus UB" jauh lebih cepat dipilih
 * daripada mengetik koordinat — dan hasilnya pasti terisi, tidak bergantung
 * pada di mana laptop presenter sedang berada.
 */
export type Titik = { id: string; nama: string; lat: number; lng: number };

export const TITIK_PRESET: Titik[] = [
  { id: "ub", nama: "Kampus UB / Ketawanggede", lat: -7.9526, lng: 112.6142 },
  { id: "umm", nama: "Kampus UMM / Tlogomas", lat: -7.9217, lng: 112.5993 },
  { id: "dinoyo", nama: "Dinoyo / Merjosari", lat: -7.9389, lng: 112.6055 },
  { id: "blimbing", nama: "Blimbing / L.A. Sucipto", lat: -7.9415, lng: 112.6389 },
  { id: "klojen", nama: "Alun-alun / Klojen", lat: -7.9822, lng: 112.6308 },
  { id: "sukun", nama: "Sukun / Tanjungrejo", lat: -7.9805, lng: 112.6183 },
];

export const TITIK_BAWAAN = TITIK_PRESET[0];

/** Radius dalam km. 5 km menutup satu sisi kota Malang — cukup untuk bawaan. */
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
