/**
 * Lapisan data sisi host.
 *
 * Tidak ada RPC di sini: policy `ruang_host_kelola` dan `foto_host_kelola`
 * sudah memberi host hak penuh atas barisnya sendiri, dan tiap operasinya
 * cukup satu baris — tidak ada validasi lintas tabel yang perlu dijalankan
 * sebagai pemilik. Yang tidak dipercayakan ke klien cuma `lat_publik` dan
 * `lng_publik`, dan itu diurus trigger `ruang_pin_publik`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AksesMasuk,
  Berbagi,
  JarakParkir,
  Kelembapan,
  Kepemilikan,
  KondisiBangunan,
  Penguncian,
  PosisiLantai,
  RiwayatBanjir,
  TipeRuang,
} from "@/lib/ruang";
import { AKHIRAN_KECIL } from "@/lib/ruang";

export type StatusRuang = "draf" | "moderasi" | "tayang" | "ditangguhkan";

/** Isi formulir ruang. Sama persis dengan kolom yang boleh ditulis host. */
export type IsiRuang = {
  judul: string;
  tipe: TipeRuang;
  kepemilikan: Kepemilikan;
  alamat: string;
  patokan: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  lat: number;
  lng: number;
  terbuka_alamat: boolean;
  panjang_m: number;
  lebar_m: number;
  tinggi_m: number;
  akses_masuk: AksesMasuk;
  posisi_lantai: PosisiLantai;
  lebar_pintu_cm: number;
  jarak_parkir: JarakParkir;
  kondisi_bangunan: KondisiBangunan;
  kelembapan: Kelembapan;
  riwayat_banjir: RiwayatBanjir;
  tinggi_lantai_cm: number;
  penguncian: Penguncian;
  berbagi: Berbagi;
  pengawasan: string[];
  fasilitas: string[];
  kategori_diterima: string[];
  kuota_akses_bulanan: number;
  durasi_min_hari: number;
  harga_bulanan: number;
  deposit: number;
  status: StatusRuang;
};

export type RuangSaya = IsiRuang & {
  id: string;
  /**
   * Label tampilan yang DIHASILKAN dari tabel `jendela_akses` oleh trigger.
   * Jangan pernah dikirim balik saat menyimpan — ia akan ditimpa.
   */
  jendela_akses: string;
  luas_m2: number;
  volume_m3: number;
  lat_publik: number;
  lng_publik: number;
  dibuat_pada: string;
  jumlah_foto: number;
  permintaan_baru: number;
  sedang_terpakai: number;
};

export async function daftarRuangSaya(db: SupabaseClient): Promise<RuangSaya[]> {
  const { data, error } = await db
    .from("ruang_saya")
    .select("*")
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RuangSaya[];
}

export async function getRuangSaya(
  db: SupabaseClient,
  id: string
): Promise<RuangSaya | null> {
  const { data, error } = await db.from("ruang_saya").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as RuangSaya) ?? null;
}

export async function buatRuang(
  db: SupabaseClient,
  hostId: string,
  isi: IsiRuang
): Promise<string> {
  const { data, error } = await db
    .from("ruang")
    .insert({ ...isi, host_id: hostId })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function ubahRuang(
  db: SupabaseClient,
  id: string,
  isi: IsiRuang
): Promise<void> {
  const { error } = await db.from("ruang").update(isi).eq("id", id);
  if (error) throw error;
}

export async function hapusRuang(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("ruang").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Foto
// ─────────────────────────────────────────────────────────────────────────────

export const BUCKET_FOTO = "ruang-foto";

/** Keterangan foto yang disarankan — sengaja spesifik, bukan "foto 1". */
export const KETERANGAN_FOTO = [
  "mulut gang",
  "tampak depan",
  "jalur akses",
  "sudut A",
  "sudut B",
  "kondisi kunci",
  "atap",
  "lantai",
];

/** Sisi terpanjang versi penuh — dipakai galeri di halaman detail. */
const LEBAR_MAKS = 1600;

/**
 * Sisi terpanjang versi kecil — dipakai kartu hasil pencarian.
 *
 * 800px, bukan 400px seperti lebar kartunya di layar: layar HP hampir semuanya
 * 2x atau 3x, dan gambar 400px di slot 360px akan terlihat lembek di sana.
 * Pada 800px WebP ukurannya masih sekitar 60 KB — seperlima versi penuh.
 */
const LEBAR_KECIL = 800;

type Gambar = { blob: Blob; mime: string; ekstensi: string };

/**
 * Encode canvas ke WebP, jatuh ke JPEG kalau peramban tidak bisa.
 *
 * `toBlob` dengan tipe yang tidak didukung TIDAK melempar galat — ia diam-diam
 * mengembalikan PNG, yang untuk foto justru jauh lebih besar daripada JPEG.
 * Jadi yang diperiksa adalah `blob.type`, bukan ada atau tidaknya hasil.
 */
async function encode(kanvas: HTMLCanvasElement, mutu: number): Promise<Gambar> {
  const webp = await new Promise<Blob | null>((selesai) =>
    kanvas.toBlob(selesai, "image/webp", mutu)
  );
  if (webp && webp.type === "image/webp") {
    return { blob: webp, mime: "image/webp", ekstensi: "webp" };
  }
  const jpeg = await new Promise<Blob | null>((selesai) =>
    kanvas.toBlob(selesai, "image/jpeg", mutu)
  );
  if (!jpeg) throw new Error("Gambarnya gagal diproses.");
  return { blob: jpeg, mime: "image/jpeg", ekstensi: "jpg" };
}

function gambarKe(
  bitmap: ImageBitmap,
  lebarMaks: number,
  mutu: number
): Promise<Gambar> {
  const skala = Math.min(1, lebarMaks / Math.max(bitmap.width, bitmap.height));
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(bitmap.width * skala);
  kanvas.height = Math.round(bitmap.height * skala);

  const ctx = kanvas.getContext("2d");
  if (!ctx) throw new Error("Peramban ini tidak bisa memproses gambar.");
  ctx.drawImage(bitmap, 0, 0, kanvas.width, kanvas.height);
  return encode(kanvas, mutu);
}

/**
 * Kompres ulang gambar lewat canvas sebelum diunggah.
 *
 * Ini bukan sekadar penghematan ukuran — ini yang membuang EXIF, dan EXIF foto
 * HP hampir selalu memuat koordinat GPS tempat foto itu diambil. Mengunggah
 * berkas aslinya berarti menerbitkan alamat persis ruangnya di metadata gambar
 * publik, dan seluruh aturan penyamaran pin jadi tidak ada gunanya.
 *
 * Menggambar ke canvas lalu meng-encode ulang menghasilkan berkas yang hanya
 * berisi piksel: tidak ada GPS, tidak ada merek kamera, tidak ada jam.
 */
export async function tanpaExif(
  file: File
): Promise<{ besar: Gambar; kecil: Gambar }> {
  const bitmap = await createImageBitmap(file);
  try {
    return {
      besar: await gambarKe(bitmap, LEBAR_MAKS, 0.82),
      kecil: await gambarKe(bitmap, LEBAR_KECIL, 0.75),
    };
  } finally {
    bitmap.close();
  }
}

/**
 * Unggah satu foto lalu catat barisnya.
 *
 * Berkasnya dikirim langsung ke Storage dari browser, bukan lewat route
 * aplikasi: melewati server berarti membayar bandwidth dua kali dan kena batas
 * waktu fungsi untuk berkas besar.
 */
export async function unggahFoto(
  db: SupabaseClient,
  opsi: {
    hostId: string;
    ruangId: string;
    file: File;
    keterangan: string;
    urutan: number;
  }
): Promise<void> {
  const { besar, kecil } = await tanpaExif(opsi.file);
  // Folder pertama WAJIB id profil — policy storage mengikatnya ke situ.
  const dasar = `${opsi.hostId}/${opsi.ruangId}/${crypto.randomUUID()}`;
  const namaBesar = `${dasar}.${besar.ekstensi}`;
  const namaKecil = `${dasar}${AKHIRAN_KECIL}.${kecil.ekstensi}`;

  const kirim = (nama: string, g: Gambar) =>
    db.storage
      .from(BUCKET_FOTO)
      .upload(nama, g.blob, { contentType: g.mime, upsert: false });

  const u1 = await kirim(namaBesar, besar);
  if (u1.error) throw u1.error;

  // Mulai dari sini setiap kegagalan harus membersihkan berkas yang sudah
  // telanjur naik. Berkas yatim tidak pernah tampil di mana pun, tapi tetap
  // menghabiskan kuota penyimpanan dan tidak ada satu pun layar yang bisa
  // menghapusnya — jejaknya cuma ada di Storage.
  const u2 = await kirim(namaKecil, kecil);
  if (u2.error) {
    await db.storage.from(BUCKET_FOTO).remove([namaBesar]);
    throw u2.error;
  }

  const { error } = await db.from("ruang_foto").insert({
    ruang_id: opsi.ruangId,
    url: db.storage.from(BUCKET_FOTO).getPublicUrl(namaBesar).data.publicUrl,
    url_kecil: db.storage.from(BUCKET_FOTO).getPublicUrl(namaKecil).data.publicUrl,
    urutan: opsi.urutan,
    keterangan: opsi.keterangan,
  });
  if (error) {
    await db.storage.from(BUCKET_FOTO).remove([namaBesar, namaKecil]);
    throw error;
  }
}

export type FotoMilikSaya = {
  id: string;
  url: string;
  url_kecil: string | null;
  urutan: number;
  keterangan: string;
};

export async function daftarFoto(
  db: SupabaseClient,
  ruangId: string
): Promise<FotoMilikSaya[]> {
  const { data, error } = await db
    .from("ruang_foto")
    .select("id, url, url_kecil, urutan, keterangan")
    .eq("ruang_id", ruangId)
    .order("urutan");
  if (error) throw error;
  return (data ?? []) as FotoMilikSaya[];
}

/**
 * Hapus baris fotonya, dan berkasnya kalau memang ada di Storage kita.
 *
 * Foto isi seed masih menunjuk picsum.photos, jadi tidak semua URL punya
 * berkas yang bisa dihapus. Kegagalan menghapus berkas tidak boleh menahan
 * penghapusan barisnya — yang terlihat pengguna adalah barisnya.
 */
export async function hapusFoto(
  db: SupabaseClient,
  foto: { id: string; url: string; url_kecil?: string | null }
): Promise<void> {
  const { error } = await db.from("ruang_foto").delete().eq("id", foto.id);
  if (error) throw error;

  // Kedua berkasnya sekaligus. Melewatkan yang kecil berarti setiap
  // penghapusan meninggalkan separuh gambar di Storage selamanya.
  const jalur = [foto.url, foto.url_kecil]
    .map((u) => (u ? jalurBucket(u) : null))
    .filter((j): j is string => j !== null);
  if (jalur.length > 0) await db.storage.from(BUCKET_FOTO).remove(jalur);
}

/** Jalur di dalam bucket dari URL publiknya, atau null kalau bukan milik kita. */
function jalurBucket(url: string): string | null {
  const tanda = `/${BUCKET_FOTO}/`;
  const posisi = url.indexOf(tanda);
  return posisi === -1 ? null : url.slice(posisi + tanda.length);
}
