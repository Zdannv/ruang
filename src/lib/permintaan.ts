/**
 * Permintaan ruang (waitlist).
 *
 * Gunanya dua arah: penyewa yang tidak menemukan ruang cocok menitipkan
 * kriterianya, dan host melihat ada berapa orang yang mencari di kecamatannya.
 * Sisi host dibaca dari `permintaan_kecamatan`, yang hanya memuat hitungan —
 * dan rata-rata anggaran baru muncul kalau satu kecamatan punya minimal tiga
 * permintaan, supaya "rata-rata" tidak pernah berarti angka satu orang.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type FrekuensiAkses = "jarang" | "bulanan" | "mingguan" | "harian";

export type PermintaanRuang = {
  id: string;
  kecamatan: string;
  kota: string;
  volume_m3: number;
  harga_maks: number;
  mulai: string;
  frekuensi_akses: FrekuensiAkses;
  dibuat_pada: string;
};

export type IsiPermintaan = {
  kecamatan: string;
  kota: string;
  volume_m3: number;
  harga_maks: number;
  mulai: string;
  frekuensi_akses: FrekuensiAkses;
};

export type PermintaanKecamatan = {
  kota: string;
  kecamatan: string;
  jumlah: number;
  harga_maks_rata: number | null;
  volume_rata: number | null;
};

export async function daftarPermintaanSaya(
  db: SupabaseClient
): Promise<PermintaanRuang[]> {
  const { data, error } = await db
    .from("permintaan_ruang")
    .select("id, kecamatan, kota, volume_m3, harga_maks, mulai, frekuensi_akses, dibuat_pada")
    .order("dibuat_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PermintaanRuang[];
}

export async function buatPermintaan(
  db: SupabaseClient,
  penyewaId: string,
  isi: IsiPermintaan
): Promise<void> {
  const { error } = await db
    .from("permintaan_ruang")
    .insert({ ...isi, penyewa_id: penyewaId });
  if (error) throw error;
}

export async function hapusPermintaan(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("permintaan_ruang").delete().eq("id", id);
  if (error) throw error;
}

/** Hitungan permintaan per kecamatan — boleh dibaca siapa pun. */
export async function getPermintaanKecamatan(
  db: SupabaseClient
): Promise<PermintaanKecamatan[]> {
  const { data, error } = await db
    .from("permintaan_kecamatan")
    .select("*")
    .order("jumlah", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PermintaanKecamatan[];
}
