/**
 * Terjemahan nilai enum database ke kalimat yang dibaca orang.
 *
 * Ditulis sekali di sini supaya kartu hasil, halaman detail, dan dasbor host
 * tidak berbeda menyebut hal yang sama. Seluruh UI berbahasa Indonesia, sesuai
 * CLAUDE.md.
 */

import type {
  AksesMasuk,
  Berbagi,
  Kelembapan,
  Kepemilikan,
  KondisiBangunan,
  JarakParkir,
  Penguncian,
  PosisiLantai,
  RiwayatBanjir,
  TipeRuang,
} from "@/lib/ruang";

/*
  Dua kelompok, dan urutannya bukan selera. Lahan terbuka lebih dulu karena
  itulah fokus produknya sejak 7 September 2026; ruang tertutup tetap ada
  karena penyimpanan bukan salah, ia cuma bukan lagi yang di depan.

  Bedanya bukan cuma nama: lahan terbuka diukur dengan LUAS (m2) dan ruang
  tertutup dengan VOLUME (m3). Lihat `pakaiLuas()`.
*/
export const LABEL_TIPE: Record<TipeRuang, string> = {
  halaman_depan: "Halaman depan",
  lahan_kosong: "Lahan kosong",
  teras: "Teras",
  kios: "Kios",
  kamar: "Kamar",
  garasi: "Garasi",
  gudang: "Gudang",
  lantai_ruko: "Lantai ruko",
  mezanin: "Mezanin",
  bawah_tangga: "Bawah tangga",
  loteng: "Loteng",
  kontainer: "Kontainer",
};

/** Tipe yang disewa permukaannya, bukan isinya. */
export const TIPE_LAHAN: TipeRuang[] = [
  "halaman_depan",
  "lahan_kosong",
  "teras",
  "kios",
];

/**
 * Benar kalau ukuran yang berarti untuk tipe ini adalah luas, bukan volume.
 *
 * "18 m3" untuk sebuah halaman depan adalah angka yang benar secara
 * aritmatika dan tidak berarti apa-apa bagi yang membacanya — pedagang
 * memikirkan berapa meter muka jalannya, bukan berapa kubik udara di atasnya.
 */
export function pakaiLuas(tipe: TipeRuang): boolean {
  return (TIPE_LAHAN as string[]).includes(tipe);
}

export const LABEL_AKSES: Record<AksesMasuk, string> = {
  truk_engkel: "Muat truk engkel",
  mobil_pikap: "Muat mobil pikap",
  hanya_motor: "Hanya motor",
  jalan_kaki: "Jalan kaki",
};

export const LABEL_PENGUNCIAN: Record<Penguncian, string> = {
  kunci_penyewa: "Kunci dipegang penyewa",
  kunci_host: "Kunci dipegang host",
  tanpa_kunci: "Tanpa kunci",
};

export const LABEL_BANJIR: Record<RiwayatBanjir, string> = {
  tidak_pernah: "Tidak pernah banjir",
  lebih_5_tahun: "Banjir >5 tahun lalu",
  dalam_5_tahun: "Pernah banjir dalam 5 tahun",
};

export const LABEL_POSISI: Record<PosisiLantai, string> = {
  dasar_rata: "Lantai dasar, rata tanpa tangga",
  dasar_tangga: "Lantai dasar, ada tangga",
  lantai_2: "Lantai 2",
  lantai_3_plus: "Lantai 3 atau lebih",
};

export const LABEL_PARKIR: Record<JarakParkir, string> = {
  lt10m: "Kurang dari 10 m dari parkir",
  "10_30m": "10-30 m dari parkir",
  gt30m: "Lebih dari 30 m dari parkir",
};

export const LABEL_BANGUNAN: Record<KondisiBangunan, string> = {
  dinding_atap: "Berdinding dan beratap",
  atap_saja: "Beratap, tanpa dinding penuh",
  terbuka: "Terbuka",
};

export const LABEL_BERBAGI: Record<Berbagi, string> = {
  eksklusif: "Dipakai sendiri",
  dengan_penyewa_lain: "Berbagi dengan penyewa lain",
  dengan_barang_host: "Berbagi dengan barang host",
};

export const LABEL_KELEMBAPAN: Record<Kelembapan, string> = {
  kering_ventilasi: "Kering, ada ventilasi",
  kering_tanpa_ventilasi: "Kering, tanpa ventilasi",
  cenderung_lembap: "Cenderung lembap",
};

export const LABEL_KEPEMILIKAN: Record<Kepemilikan, string> = {
  milik_sendiri: "Milik host sendiri",
  menyewa: "Host menyewa dari pemilik",
};

/**
 * Isi kolom `text[]`. Nilai yang belum ada di sini tetap ditampilkan apa adanya
 * lewat `labelDaftar()` — lebih baik user melihat "kunci_ganda" daripada
 * fasilitas itu hilang tanpa jejak karena kami lupa menerjemahkannya.
 */
export const LABEL_PENGAWASAN: Record<string, string> = {
  cctv: "CCTV",
  penghuni_24jam: "Ada penghuni 24 jam",
  satpam: "Satpam",
  pagar: "Berpagar",
};

export const LABEL_FASILITAS: Record<string, string> = {
  rak: "Rak",
  palet: "Palet",
  listrik: "Listrik",
  lampu: "Lampu",
  troli: "Troli",
};

export const LABEL_KATEGORI: Record<string, string> = {
  kardus: "Kardus",
  perabot: "Perabot",
  dokumen: "Dokumen",
  elektronik: "Elektronik",
  stok_dagangan: "Stok dagangan",
  sepeda_motor: "Sepeda motor",
  alat_musik: "Alat musik",
  ban_perkakas: "Ban & perkakas",
};

/*
  Rubrik lahan usaha, ditambahkan migrasi 19. Kelimanya hanya berarti untuk
  tipe lahan terbuka — lihat `pakaiLuas()` dan `TIPE_LAHAN` di atas.
*/

/**
 * Jenis usaha yang pemilik izinkan.
 *
 * `masak_berminyak` sengaja dipisah dari `makanan`, dan itu bukan
 * kerapian: "boleh menggoreng atau tidak" adalah pertanyaan yang jawabannya
 * membatalkan sewa. Asap dan minyak yang menempel di dinding rumah orang
 * adalah alasan penolakan paling sering di lahan pinggir jalan.
 *
 * **Dipangkas 10 Sep 2026.** Daftar pertama memuat `laundry` dan `pangkas`,
 * dan keduanya salah tempat: keduanya butuh ruangan berdinding, listrik
 * tetap, dan pelanggan yang duduk menunggu — bukan sepetak halaman depan.
 * Menawarkannya membuat daftarnya terbaca seolah disusun tanpa melihat
 * lahannya. `cuci_motor` dan `bengkel` tetap: keduanya justru khas halaman
 * depan yang menghadap jalan.
 *
 * Daftarnya juga TIDAK tertutup — `KotakCentangGanda` mengizinkan isian
 * sendiri, dan yang diketik pemilik masuk apa adanya ke `usaha_diizinkan`.
 * Pencocokan di `buat_pemesanan` membandingkan teksnya, jadi pedagang tetap
 * bisa memilihnya dari kartu lahannya.
 */
export const LABEL_USAHA: Record<string, string> = {
  makanan: "Makanan (tanpa menggoreng)",
  masak_berminyak: "Menggoreng / masak berminyak",
  minuman: "Minuman / es",
  jajanan: "Jajanan & kue",
  buah_sayur: "Buah & sayur",
  kelontong: "Kelontong / sembako",
  cuci_motor: "Cuci motor",
  bengkel: "Tambal ban / bengkel kecil",
};

export const LABEL_LISTRIK: Record<string, string> = {
  tidak_ada: "Tidak ada listrik",
  berbagi: "Nyambung dari rumah pemilik",
  meteran_sendiri: "Meteran sendiri",
};

export const LABEL_AIR: Record<string, string> = {
  tidak_ada: "Tidak ada air",
  boleh_pakai: "Boleh pakai air pemilik",
};

export const LABEL_ATAP: Record<string, string> = {
  tidak_ada: "Tanpa atap",
  kanopi: "Kanopi / tenda",
  permanen: "Atap permanen",
};

export const LABEL_KELAS_JALAN: Record<string, string> = {
  jalan_raya: "Jalan raya",
  jalan_kolektor: "Jalan kolektor",
  perumahan: "Jalan perumahan",
  dalam_gang: "Dalam gang",
};

/**
 * Versi pendek `LABEL_LISTRIK`, untuk lencana di kartu hasil.
 *
 * "Nyambung dari rumah pemilik" benar dan tidak muat: lencananya sekitar 80px
 * di kartu dua kolom. Yang perlu dijawab di daftar hasil cuma ada atau tidak.
 */
export const LABEL_LISTRIK_PENDEK: Record<string, string> = {
  tidak_ada: "Tanpa listrik",
  berbagi: "Ada listrik",
  meteran_sendiri: "Meteran sendiri",
};

/** "3,0 m muka jalan", atau "muka 3,0 m" kalau `pendek`. */
export function lebarMuka(m: number | string | null, pendek = false): string | null {
  if (m == null) return null;
  const n = typeof m === "string" ? Number(m) : m;
  if (!Number.isFinite(n) || n <= 0) return null;
  const angka = n.toFixed(1).replace(".", ",");
  return pendek ? `muka ${angka} m` : `${angka} m muka jalan`;
}

/**
 * "4x per bulan", atau "Tanpa batas" kalau kuotanya NULL.
 *
 * NULL bukan data yang hilang — sejak migrasi 19 ia berarti tanpa batas, dan
 * itu keadaan yang WAJAR untuk lahan usaha: pedagang ada di lahannya setiap
 * hari, bukan datang beberapa kali sebulan. Tanpa fungsi ini layar menulis
 * "nullx / bulan".
 */
export function kuotaAkses(n: number | null, pendek = false): string {
  if (n == null) return "Tanpa batas";
  return pendek ? `${n}x / bulan` : `${n}x per bulan`;
}

/** Terjemahkan isi kolom array; yang tidak dikenal dirapikan, bukan dibuang. */
export function labelDaftar(nilai: string[], peta: Record<string, string>): string[] {
  return nilai.map((v) => peta[v] ?? v.replace(/_/g, " "));
}

/** "8,0 x 5,0 x 3,2 m". */
export function dimensi(p: number | string, l: number | string, t: number | string): string {
  const n = (v: number | string) =>
    (typeof v === "string" ? Number(v) : v).toFixed(1).replace(".", ",");
  return `${n(p)} x ${n(l)} x ${n(t)} m`;
}

/** "40,0 m2", luas datang sebagai numeric, jadi bisa berupa string. */
export function luas(m2: number | string): string {
  const n = typeof m2 === "string" ? Number(m2) : m2;
  return `${n.toFixed(1).replace(".", ",")} m²`;
}

/** "15 Juli 2026", tanggal ditampilkan waktu Jakarta, sesuai aturan di CLAUDE.md. */
export function tanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** "Juli 2026", untuk "bergabung sejak". */
export function bulanTahun(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** Riwayat banjir yang perlu ditonjolkan, bukan disembunyikan di antara chip lain. */
export function banjirPerluPerhatian(nilai: RiwayatBanjir): boolean {
  return nilai === "dalam_5_tahun";
}

export const LABEL_STATUS_AKSES: Record<string, string> = {
  diminta: "Menunggu jawaban host",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  selesai: "Sudah datang",
};

export const LABEL_FREKUENSI: Record<string, string> = {
  jarang: "Jarang, beberapa bulan sekali",
  bulanan: "Bulanan",
  mingguan: "Mingguan",
  harian: "Hampir setiap hari",
};

export const LABEL_STATUS: Record<string, string> = {
  draf: "Draf",
  menunggu_konfirmasi: "Menunggu konfirmasi host",
  menunggu_pembayaran: "Menunggu pembayaran",
  menunggu_serah_terima: "Menunggu serah terima",
  aktif: "Sewa berjalan",
  menunggu_serah_terima_keluar: "Menunggu serah terima keluar",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  tunggakan: "Tunggakan",
  sengketa: "Sengketa",
};

/** Warna lencana status. Hanya yang perlu ditindaki yang diberi warna. */
export function nadaStatus(status: string): "netral" | "proses" | "baik" | "waspada" {
  if (status === "aktif") return "baik";
  if (status === "tunggakan" || status === "sengketa") return "waspada";
  if (status.startsWith("menunggu")) return "proses";
  return "netral";
}

/** "11 Sep 2026", lebih pendek dari `tanggal()`, untuk baris rapat. */
export function tanggalPendek(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** "11 Sep 2026, 14.05", untuk jejak transisi, yang butuh jamnya. */
export function tanggalJam(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** "Rp450.000". Rupiah penuh, tanpa desimal, uang disimpan bigint. */
export function rupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

/**
 * "1,2 km" atau "850 m" — di bawah 1 km, meter lebih mudah dibayangkan.
 *
 * Titik preset bisa kebetulan persis menimpa koordinat sebuah ruang (titik UB
 * memang begitu di data demo), dan "0 m dari titikmu" terbaca seperti bug.
 * Lagi pula koordinat yang ditampilkan sudah digeser ±200 m, jadi menyebut
 * angka setepat itu memang bukan klaim yang bisa dipertanggungjawabkan.
 */
export function jarak(km: number): string {
  if (km < 0.05) return "kurang dari 50 m";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/** "13,5 m³". `volume_m3` datang sebagai numeric, jadi bisa berupa string. */
export function volume(m3: number | string): string {
  const n = typeof m3 === "string" ? Number(m3) : m3;
  return `${n.toFixed(1).replace(".", ",")} m³`;
}
