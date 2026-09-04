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
  jendela_akses: string;
  kuota_akses_bulanan: number;
  durasi_min_hari: number;
  harga_bulanan: number;
  deposit: number;
  status: StatusRuang;
};

export type RuangSaya = IsiRuang & {
  id: string;
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

const LEBAR_MAKS = 1600;

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
export async function tanpaExif(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const skala = Math.min(1, LEBAR_MAKS / Math.max(bitmap.width, bitmap.height));
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(bitmap.width * skala);
  kanvas.height = Math.round(bitmap.height * skala);

  const ctx = kanvas.getContext("2d");
  if (!ctx) throw new Error("Peramban ini tidak bisa memproses gambar.");
  ctx.drawImage(bitmap, 0, 0, kanvas.width, kanvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((selesai) =>
    kanvas.toBlob(selesai, "image/jpeg", 0.85)
  );
  if (!blob) throw new Error("Gambarnya gagal diproses.");
  return blob;
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
  const bersih = await tanpaExif(opsi.file);
  // Folder pertama WAJIB id profil — policy storage mengikatnya ke situ.
  const nama = `${opsi.hostId}/${opsi.ruangId}/${crypto.randomUUID()}.jpg`;

  const unggah = await db.storage
    .from(BUCKET_FOTO)
    .upload(nama, bersih, { contentType: "image/jpeg", upsert: false });
  if (unggah.error) throw unggah.error;

  const { data } = db.storage.from(BUCKET_FOTO).getPublicUrl(nama);

  const { error } = await db.from("ruang_foto").insert({
    ruang_id: opsi.ruangId,
    url: data.publicUrl,
    urutan: opsi.urutan,
    keterangan: opsi.keterangan,
  });
  if (error) throw error;
}

export type FotoMilikSaya = {
  id: string;
  url: string;
  urutan: number;
  keterangan: string;
};

export async function daftarFoto(
  db: SupabaseClient,
  ruangId: string
): Promise<FotoMilikSaya[]> {
  const { data, error } = await db
    .from("ruang_foto")
    .select("id, url, urutan, keterangan")
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
  foto: { id: string; url: string }
): Promise<void> {
  const { error } = await db.from("ruang_foto").delete().eq("id", foto.id);
  if (error) throw error;

  const tanda = `/${BUCKET_FOTO}/`;
  const posisi = foto.url.indexOf(tanda);
  if (posisi === -1) return;
  const jalur = foto.url.slice(posisi + tanda.length);
  await db.storage.from(BUCKET_FOTO).remove([jalur]);
}
