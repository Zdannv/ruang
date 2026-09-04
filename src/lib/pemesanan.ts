/**
 * Lapisan data alur pesan.
 *
 * Tidak ada satu pun fungsi di sini yang menulis `pemesanan.status` langsung —
 * klien memang tidak punya haknya. Semua perpindahan status lewat RPC yang
 * memvalidasi siapa pemanggilnya dan apakah transisinya sah (lihat
 * `04_pesan.sql`). Yang bisa dilakukan lapisan ini cuma memanggilnya dan
 * menyampaikan pesan galatnya apa adanya, karena pesan itu sudah ditulis untuk
 * dibaca orang.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type StatusPemesanan =
  | "draf"
  | "menunggu_konfirmasi"
  | "menunggu_pembayaran"
  | "menunggu_serah_terima"
  | "aktif"
  | "menunggu_serah_terima_keluar"
  | "selesai"
  | "dibatalkan"
  | "tunggakan"
  | "sengketa";

/** Satu baris `pemesanan_saya` — pemesanan plus ringkasan ruangnya. */
export type PemesananRingkas = {
  id: string;
  ruang_id: string;
  penyewa_id: string;
  mulai: string;
  selesai: string;
  harga_bulanan: number;
  total: number;
  status: StatusPemesanan;
  dibuat_pada: string;
  judul: string;
  tipe: string;
  kecamatan: string;
  kota: string;
  deposit: number;
  jendela_akses: string;
  kuota_akses_bulanan: number;
  host_id: string;
  host_nama: string;
  foto: string | null;
};

export type ManifesItem = {
  id: string;
  versi: number;
  nama: string;
  kategori: string;
  jumlah: number;
  taksiran_nilai: number;
  foto_url: string | null;
  dicatat_pada: string;
};

export type Transisi = {
  id: string;
  dari: StatusPemesanan | null;
  ke: StatusPemesanan;
  catatan: string | null;
  pada: string;
};

export type BarisManifesBaru = {
  nama: string;
  kategori: string;
  jumlah: number;
  taksiran_nilai: number;
};

/** Ruang seringkas yang dibutuhkan formulir pesan. */
export type RuangUntukPesan = {
  id: string;
  judul: string;
  tipe: string;
  kecamatan: string;
  kota: string;
  harga_bulanan: number;
  deposit: number;
  durasi_min_hari: number;
  kategori_diterima: string[];
  jendela_akses: string;
  kuota_akses_bulanan: number;
  host_id: string;
  host_nama: string;
  tersewa_sampai: string | null;
};

export async function getRuangUntukPesan(
  db: SupabaseClient,
  ruangId: string
): Promise<RuangUntukPesan | null> {
  const [r, k] = await Promise.all([
    db
      .from("ruang_publik")
      .select(
        "id, judul, tipe, kecamatan, kota, harga_bulanan, deposit, durasi_min_hari, " +
          "kategori_diterima, jendela_akses, kuota_akses_bulanan, host_id, host_nama"
      )
      .eq("id", ruangId)
      .maybeSingle(),
    db.from("ruang_ketersediaan").select("tersewa_sampai").eq("ruang_id", ruangId).maybeSingle(),
  ]);
  if (r.error) throw r.error;
  if (k.error) throw k.error;
  if (!r.data) return null;

  return {
    ...(r.data as unknown as Omit<RuangUntukPesan, "tersewa_sampai">),
    tersewa_sampai:
      (k.data as { tersewa_sampai: string | null } | null)?.tersewa_sampai ?? null,
  };
}

/**
 * Semua pemesanan yang boleh dilihat pemanggil — miliknya sebagai penyewa DAN
 * yang masuk ke ruangnya sebagai host. Dua-duanya datang dari satu view;
 * pemisahannya dilakukan di layar dengan membandingkan `penyewa_id` dan
 * `host_id` ke profil sendiri.
 */
export async function daftarPemesanan(db: SupabaseClient): Promise<PemesananRingkas[]> {
  const { data, error } = await db
    .from("pemesanan_saya")
    .select("*")
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PemesananRingkas[];
}

export type DetailPemesanan = {
  pemesanan: PemesananRingkas;
  manifes: ManifesItem[];
  riwayat: Transisi[];
  /**
   * Alamat lengkap — hanya terisi kalau RLS mengizinkan pemanggil membacanya:
   * host ruangnya, atau penyewa yang pemesanannya sudah dibayar (keterbukaan
   * tingkat 3). Kalau tidak, hasilnya `null` tanpa galat, karena RLS menyaring
   * baris, bukan menolak kuerinya.
   */
  alamatLengkap: { alamat: string; patokan: string | null } | null;
};

export async function getDetailPemesanan(
  db: SupabaseClient,
  id: string
): Promise<DetailPemesanan | null> {
  const [p, m, t] = await Promise.all([
    db.from("pemesanan_saya").select("*").eq("id", id).maybeSingle(),
    db
      .from("manifes_item")
      .select("id, versi, nama, kategori, jumlah, taksiran_nilai, foto_url, dicatat_pada")
      .eq("pemesanan_id", id)
      .order("versi", { ascending: false })
      .order("dicatat_pada"),
    db
      .from("pemesanan_transisi")
      .select("id, dari, ke, catatan, pada")
      .eq("pemesanan_id", id)
      .order("pada"),
  ]);
  if (p.error) throw p.error;
  if (m.error) throw m.error;
  if (t.error) throw t.error;
  if (!p.data) return null;

  const pemesanan = p.data as unknown as PemesananRingkas;

  const { data: alamat } = await db
    .from("ruang")
    .select("alamat, patokan")
    .eq("id", pemesanan.ruang_id)
    .maybeSingle();

  return {
    pemesanan,
    manifes: (m.data ?? []) as unknown as ManifesItem[],
    riwayat: (t.data ?? []) as unknown as Transisi[],
    alamatLengkap: (alamat as { alamat: string; patokan: string | null } | null) ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Perpindahan status — semuanya lewat RPC
// ─────────────────────────────────────────────────────────────────────────────

export async function buatPemesanan(
  db: SupabaseClient,
  input: { ruangId: string; mulai: string; selesai: string; manifes: BarisManifesBaru[] }
): Promise<string> {
  const { data, error } = await db.rpc("buat_pemesanan", {
    p_ruang: input.ruangId,
    p_mulai: input.mulai,
    p_selesai: input.selesai,
    p_manifes: input.manifes,
  });
  if (error) throw error;
  return data as string;
}

export async function konfirmasiPemesanan(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.rpc("konfirmasi_pemesanan", { p_pemesanan: id });
  if (error) throw error;
}

export async function tolakPemesanan(
  db: SupabaseClient,
  id: string,
  catatan?: string
): Promise<void> {
  const { error } = await db.rpc("tolak_pemesanan", {
    p_pemesanan: id,
    p_catatan: catatan ?? null,
  });
  if (error) throw error;
}

export async function batalkanPemesanan(
  db: SupabaseClient,
  id: string,
  catatan?: string
): Promise<void> {
  const { error } = await db.rpc("batalkan_pemesanan", {
    p_pemesanan: id,
    p_catatan: catatan ?? null,
  });
  if (error) throw error;
}

/** Jumlah bulan yang ditagih — dibulatkan ke atas, sama seperti di database. */
export function bulanSewa(mulai: string, selesai: string): number {
  const hari = Math.round(
    (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86_400_000
  );
  return hari > 0 ? Math.ceil(hari / 30) : 0;
}
