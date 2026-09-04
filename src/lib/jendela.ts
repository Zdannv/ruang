/**
 * Jendela akses — jam saat penyewa boleh datang.
 *
 * Sejak `08_jendela.sql` ini data terstruktur, bukan teks bebas. Label yang
 * tampil di kartu dan halaman detail (`ruang.jendela_akses`) DIHASILKAN dari
 * baris-baris ini oleh trigger, jadi jangan pernah menulis label itu dari
 * aplikasi — ia akan ditimpa, dan sementara itu keduanya berbeda pendapat.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Mengikuti `extract(dow)` Postgres: 0 = Minggu ... 6 = Sabtu. */
export type Jendela = {
  id: string;
  hari: number;
  mulai: string;
  selesai: string;
};

export type JendelaPublik = Pick<Jendela, "hari" | "mulai" | "selesai">;

/** Urutan tampilan mulai Senin — itu cara orang di sini menyebut minggu kerja. */
export const HARI_URUT = [1, 2, 3, 4, 5, 6, 0];

export const NAMA_HARI: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

export const NAMA_HARI_PENDEK: Record<number, string> = {
  0: "Min",
  1: "Sen",
  2: "Sel",
  3: "Rab",
  4: "Kam",
  5: "Jum",
  6: "Sab",
};

/** "07:00:00" -> "07.00", sesuai cara jam ditulis di UI Indonesia. */
export function jam(nilai: string): string {
  return nilai.slice(0, 5).replace(":", ".");
}

export async function daftarJendela(
  db: SupabaseClient,
  ruangId: string
): Promise<Jendela[]> {
  const { data, error } = await db
    .from("jendela_akses")
    .select("id, hari, mulai, selesai")
    .eq("ruang_id", ruangId)
    .order("hari")
    .order("mulai");
  if (error) throw error;
  return (data ?? []) as Jendela[];
}

/** Versi publik: dipakai layar yang tidak dimiliki host ruangnya. */
export async function daftarJendelaPublik(
  db: SupabaseClient,
  ruangId: string
): Promise<JendelaPublik[]> {
  const { data, error } = await db
    .from("jendela_akses_publik")
    .select("hari, mulai, selesai")
    .eq("ruang_id", ruangId)
    .order("hari")
    .order("mulai");
  if (error) throw error;
  return (data ?? []) as JendelaPublik[];
}

/**
 * Tambah satu rentang untuk beberapa hari sekaligus.
 *
 * Baris yang sudah ada dengan hari + jam mulai yang sama dilewati, bukan
 * digagalkan: host yang menambah "Sen-Sab 08.00" dua kali tidak perlu melihat
 * pesan galat untuk sesuatu yang hasilnya sudah benar.
 */
export async function tambahJendela(
  db: SupabaseClient,
  ruangId: string,
  hari: number[],
  mulai: string,
  selesai: string
): Promise<void> {
  if (hari.length === 0) throw new Error("Pilih minimal satu hari.");
  if (selesai <= mulai) throw new Error("Jam selesai harus setelah jam mulai.");

  const { error } = await db
    .from("jendela_akses")
    .upsert(
      hari.map((h) => ({ ruang_id: ruangId, hari: h, mulai, selesai })),
      { onConflict: "ruang_id,hari,mulai", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function hapusJendela(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("jendela_akses").delete().eq("id", id);
  if (error) throw error;
}
