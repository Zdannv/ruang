/**
 * Kontak pemilik lahan.
 *
 * Berkas ini dulu berisi seluruh alur verifikasi petugas (migrasi 20). Alurnya
 * dibuang 18 September 2026: tidak ada karyawan lapangan yang bisa datang
 * memeriksa, jadi lencana "terverifikasi" tidak punya siapa pun di belakangnya.
 * Tabelnya masih ada di database; yang dibuang layarnya. Lihat nomor 45 di
 * CLAUDE.md.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Nama dan nomor pemilik lahan. Menolak pemanggil yang belum masuk. */
export type KontakLahan = { nama: string; telepon: string | null };

/**
 * Nomor yang bisa dihubungi, dari `kontak_lahan()`.
 *
 * Lewat RPC, bukan kolom di `ruang_publik`, supaya nomor pemilik lahan tidak
 * bisa dipanen satu permintaan oleh siapa pun tanpa akun. Mengembalikan null
 * kalau pemanggilnya belum masuk, dan layar menawarkan tombol masuk di situ.
 */
export async function kontakLahan(
  db: SupabaseClient,
  ruangId: string
): Promise<KontakLahan | null> {
  const { data, error } = await db.rpc("kontak_lahan", { p_ruang: ruangId });
  if (error) return null;
  const baris = (data ?? []) as KontakLahan[];
  return baris[0] ?? null;
}

/** Jenis peristiwa yang dihitung untuk pemilik lahan. */
export type JenisStatistik = "dibuka" | "kontak" | "chat";

/**
 * Catat satu peristiwa ke statistik listing.
 *
 * Galatnya sengaja ditelan: database yang belum menjalankan migrasi 22 tidak
 * punya fungsinya, dan halaman listing tidak boleh mati karena pencatatan
 * yang gagal. Angka yang kurang satu jauh lebih murah daripada halaman yang
 * tidak terbuka.
 */
export async function catatStatistik(
  db: SupabaseClient,
  ruangId: string,
  jenis: JenisStatistik
): Promise<void> {
  await db.rpc("catat_statistik", { p_ruang: ruangId, p_jenis: jenis });
}

export type StatistikLahan = {
  ruang_id: string;
  judul: string;
  status: string;
  dibuka: number;
  kontak: number;
  chat: number;
};

export type StatistikHari = {
  tanggal: string;
  dibuka: number;
  kontak: number;
  chat: number;
};

export async function statistikSaya(
  db: SupabaseClient,
  hari = 30
): Promise<StatistikLahan[]> {
  const { data, error } = await db.rpc("statistik_saya", { p_hari: hari });
  if (error) return [];
  return (data ?? []) as StatistikLahan[];
}

export async function statistikHarianSaya(
  db: SupabaseClient,
  hari = 30
): Promise<StatistikHari[]> {
  const { data, error } = await db.rpc("statistik_harian_saya", { p_hari: hari });
  if (error) return [];
  return (data ?? []) as StatistikHari[];
}
