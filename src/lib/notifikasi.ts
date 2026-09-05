/**
 * Notifikasi in-app.
 *
 * Ditulis seluruhnya oleh trigger di database (lihat `09_notifikasi.sql`);
 * klien tidak punya hak INSERT sama sekali. Kalau punya, siapa pun bisa
 * mengirim "Host menerima permintaanmu" palsu ke orang lain.
 *
 * WhatsApp dan email menunggu pihak luar. Yang ini tidak menunggu siapa-siapa.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type JenisNotifikasi = "pemesanan" | "akses";

export type Notifikasi = {
  id: string;
  jenis: JenisNotifikasi;
  judul: string;
  isi: string | null;
  tautan: string | null;
  dibaca_pada: string | null;
  dibuat_pada: string;
};

export async function daftarNotifikasi(
  db: SupabaseClient,
  batas = 50
): Promise<Notifikasi[]> {
  const { data, error } = await db
    .from("notifikasi")
    .select("id, jenis, judul, isi, tautan, dibaca_pada, dibuat_pada")
    .order("dibuat_pada", { ascending: false })
    .limit(batas);
  if (error) throw error;
  return (data ?? []) as Notifikasi[];
}

/**
 * Jumlah yang belum dibaca.
 *
 * Dipanggil di header, jadi ikut jalan di setiap pemuatan halaman. Kegagalannya
 * dijawab 0, bukan dilempar: lonceng yang salah hitung jauh lebih ringan
 * akibatnya daripada seluruh halaman gagal dirender karena satu kueri hiasan.
 */
export async function jumlahBelumDibaca(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc("notifikasi_belum_dibaca");
  if (error) return 0;
  return (data as number) ?? 0;
}

export async function tandaiSemuaDibaca(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc("tandai_semua_dibaca");
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function tandaiDibaca(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db
    .from("notifikasi")
    .update({ dibaca_pada: new Date().toISOString() })
    .eq("id", id)
    .is("dibaca_pada", null);
  if (error) throw error;
}
