/**
 * Verifikasi lahan oleh petugas aplikasi.
 *
 * Pemilik mengajukan, petugas datang dan mencocokkan keterangan listing
 * dengan keadaan di lokasi, lalu menyetujui atau menolak. Semua perpindahan
 * keadaannya lewat RPC — klien tidak punya jalan menulis kolomnya, dan
 * percobaannya dikembalikan diam-diam oleh trigger (lihat `20_verifikasi.sql`).
 *
 * **Batas yang dijamin lencana ini sempit, dan layar wajib menyebutkannya.**
 * Yang diperiksa cuma kecocokan keterangan dengan kenyataan pada satu hari
 * tertentu. Ia bukan jaminan keamanan, bukan asuransi, dan bukan janji soal
 * orangnya. Jangan pernah menulis "dijamin aman" di dekat lencana ini.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type StatusVerifikasi = "belum" | "diajukan" | "terverifikasi" | "ditolak";

export const LABEL_VERIFIKASI: Record<StatusVerifikasi, string> = {
  belum: "Belum diverifikasi",
  diajukan: "Menunggu kunjungan petugas",
  terverifikasi: "Terverifikasi",
  ditolak: "Perlu diperbaiki",
};

/** Satu baris antrean petugas. Memuat alamat lengkap — jangan bocor ke layar publik. */
export type BarisVerifikasi = {
  id: string;
  judul: string;
  tipe: string;
  status: string;
  alamat: string;
  patokan: string | null;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  lat: number;
  lng: number;
  verifikasi: StatusVerifikasi;
  verifikasi_diajukan_pada: string | null;
  verifikasi_pada: string | null;
  verifikasi_catatan: string | null;
  jumlah_foto: number;
  host_nama: string;
  host_telepon: string;
};

/**
 * Benar kalau pemanggilnya petugas aplikasi.
 *
 * Dipakai HANYA untuk memutuskan apa yang ditampilkan. Yang benar-benar
 * menahan adalah gerbang di dalam `antrean_verifikasi()` dan
 * `putuskan_verifikasi()`; menyembunyikan tautan bukan pengamanan.
 */
export async function sayaAdmin(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db.rpc("saya_admin");
  // Sebelum migrasi 20 dijalankan fungsinya belum ada, dan yang benar di situ
  // adalah "bukan admin" — bukan mematikan halaman yang memanggilnya.
  if (error) return false;
  return data === true;
}

export async function ajukanVerifikasi(db: SupabaseClient, ruangId: string): Promise<void> {
  const { error } = await db.rpc("ajukan_verifikasi", { p_ruang: ruangId });
  if (error) throw error;
}

export async function putuskanVerifikasi(
  db: SupabaseClient,
  ruangId: string,
  setujui: boolean,
  catatan?: string
): Promise<void> {
  const { error } = await db.rpc("putuskan_verifikasi", {
    p_ruang: ruangId,
    p_setujui: setujui,
    p_catatan: catatan?.trim() || null,
  });
  if (error) throw error;
}

export async function antreanVerifikasi(db: SupabaseClient): Promise<BarisVerifikasi[]> {
  const { data, error } = await db.rpc("antrean_verifikasi");
  if (error) throw error;
  return (data ?? []) as BarisVerifikasi[];
}
