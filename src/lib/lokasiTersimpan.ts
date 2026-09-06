/**
 * Titik pencarian terakhir yang dipakai orang ini, disimpan di perambannya.
 *
 * Gunanya menutup kasus yang paling sering: orang membuka `/cari` tanpa
 * parameter apa pun — dari menu, dari ikon aplikasi, dari tab yang dibuka
 * ulang — dan mendapati pencarian dimulai dari Kampus UB, bukan dari tempat
 * yang barusan ia pakai.
 *
 * Sengaja `localStorage`, bukan kolom di database: ini kenyamanan per
 * perangkat, bukan data yang harus ikut berpindah antar perangkat, dan
 * menyimpannya di server berarti satu kueri lagi di jalur kritis tiap kali
 * halaman ini dibuka.
 *
 * Setiap akses dibungkus try/catch. Di jendela privat, di peramban yang
 * menolak penyimpanan situs, dan saat kuotanya penuh, `localStorage` bukan
 * cuma kosong — ia MELEMPAR. Pencarian tidak boleh mati karena itu.
 */

const KUNCI = "ruang.titik-terakhir";

export type TitikTersimpan = { lat: number; lng: number; radiusKm: number };

export function bacaTitik(): TitikTersimpan | null {
  try {
    const mentah = localStorage.getItem(KUNCI);
    if (!mentah) return null;
    const isi = JSON.parse(mentah) as Partial<TitikTersimpan>;
    if (
      typeof isi.lat !== "number" ||
      typeof isi.lng !== "number" ||
      typeof isi.radiusKm !== "number" ||
      !Number.isFinite(isi.lat) ||
      !Number.isFinite(isi.lng)
    ) {
      return null;
    }
    // Di luar rentang koordinat yang mungkin berarti isinya rusak atau ditulis
    // versi lain. Dibuang, bukan dipakai — titik ngawur menghasilkan halaman
    // hasil kosong yang tidak bisa dijelaskan siapa pun.
    if (Math.abs(isi.lat) > 90 || Math.abs(isi.lng) > 180) return null;
    return { lat: isi.lat, lng: isi.lng, radiusKm: isi.radiusKm };
  } catch {
    return null;
  }
}

export function simpanTitik(t: TitikTersimpan): void {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(t));
  } catch {
    // Tidak bisa disimpan bukan kegagalan yang perlu diberitahukan: yang
    // hilang cuma kenyamanan kunjungan berikutnya.
  }
}

/**
 * Apakah izin lokasi SUDAH diberikan sebelumnya.
 *
 * Ini yang membuat deteksi otomatis mungkin tanpa mengganggu. Memanggil
 * `getCurrentPosition()` begitu halaman terbuka akan memunculkan dialog izin
 * tanpa orangnya melakukan apa pun — praktik yang ditekan peramban (Chrome
 * meredam dialog yang muncul tanpa interaksi), dan yang lebih buruk: penolakan
 * itu MELEKAT. Sekali ditolak, tombol "Lokasiku" pun tidak bisa lagi bertanya.
 *
 * Jadi urutannya: minta izin hanya lewat tombol, tapi kalau izinnya sudah ada,
 * pakai langsung tanpa bertanya lagi.
 *
 * `navigator.permissions` tidak ada di sebagian peramban lama; di sana
 * jawabannya "tidak tahu" dan deteksi otomatisnya dilewati.
 */
export async function izinLokasiSudahAda(): Promise<boolean> {
  try {
    if (!navigator.permissions?.query) return false;
    const izin = await navigator.permissions.query({ name: "geolocation" });
    return izin.state === "granted";
  } catch {
    return false;
  }
}

/**
 * Titik dari wilayah yang orangnya sebut saat mendaftar.
 *
 * Dipakai sebagai cadangan sebelum titik bawaan: untuk orang Malang, "Kampus
 * UB" kebetulan masuk akal, tapi untuk orang Surabaya ia salah — padahal
 * wilayahnya sudah ditanyakan waktu mendaftar.
 *
 * Mengembalikan null untuk siapa pun yang belum masuk, dan untuk profil yang
 * wilayahnya tidak bisa dikenali. Pemanggilnya jatuh ke titik bawaan.
 */
export async function titikProfil(): Promise<
  { lat: number; lng: number; nama: string } | null
> {
  try {
    const jawab = await fetch("/api/titik-saya");
    if (!jawab.ok) return null;
    const isi = (await jawab.json()) as {
      titik?: { lat: number; lng: number; nama: string } | null;
    };
    return isi.titik ?? null;
  } catch {
    return null;
  }
}
