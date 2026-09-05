/**
 * Percakapan penyewa dan host.
 *
 * Klien tidak punya hak tulis ke `pesan` sama sekali — semua pengiriman lewat
 * `kirim_pesan`, yang menyamarkan nomor telepon dan email di database. Kalau
 * penyamarannya dikerjakan di layar, ia bisa dilewati siapa pun yang memanggil
 * API langsung, dan aturan "bukan papan iklan" jadi tidak berarti apa-apa.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PercakapanRingkas = {
  id: string;
  ruang_id: string;
  penyewa_id: string;
  alamat_dibuka_pada: string | null;
  pesan_terakhir_pada: string;
  judul: string;
  kecamatan: string;
  kota: string;
  host_id: string;
  host_nama: string;
  pesan_terakhir: string | null;
  foto: string | null;
  belum_dibaca: number;
};

export type Pesan = {
  id: string;
  pengirim_id: string;
  isi: string;
  disamarkan: boolean;
  pada: string;
};

export async function daftarPercakapan(
  db: SupabaseClient
): Promise<PercakapanRingkas[]> {
  const { data, error } = await db
    .from("percakapan_saya")
    .select("*")
    .order("pesan_terakhir_pada", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PercakapanRingkas[];
}

export async function getPercakapan(
  db: SupabaseClient,
  id: string
): Promise<{ utas: PercakapanRingkas; pesan: Pesan[] } | null> {
  const [c, p] = await Promise.all([
    db.from("percakapan_saya").select("*").eq("id", id).maybeSingle(),
    db
      .from("pesan")
      .select("id, pengirim_id, isi, disamarkan, pada")
      .eq("percakapan_id", id)
      .order("pada"),
  ]);
  if (c.error) throw c.error;
  if (p.error) throw p.error;
  if (!c.data) return null;

  return {
    utas: c.data as unknown as PercakapanRingkas,
    pesan: (p.data ?? []) as Pesan[],
  };
}

/** Jumlah pesan belum dibaca di seluruh percakapan — untuk lencana di header. */
export async function pesanBelumDibaca(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.from("percakapan_saya").select("belum_dibaca");
  if (error) return 0;
  return ((data ?? []) as { belum_dibaca: number }[]).reduce(
    (t, r) => t + (r.belum_dibaca ?? 0),
    0
  );
}

export async function mulaiPercakapan(
  db: SupabaseClient,
  ruangId: string
): Promise<string> {
  const { data, error } = await db.rpc("mulai_percakapan", { p_ruang: ruangId });
  if (error) throw error;
  return data as string;
}

export async function kirimPesan(
  db: SupabaseClient,
  percakapanId: string,
  isi: string
): Promise<void> {
  const { error } = await db.rpc("kirim_pesan", {
    p_percakapan: percakapanId,
    p_isi: isi,
  });
  if (error) throw error;
}

export async function bukaAlamat(
  db: SupabaseClient,
  percakapanId: string
): Promise<void> {
  const { error } = await db.rpc("buka_alamat", { p_percakapan: percakapanId });
  if (error) throw error;
}

/**
 * Menandai utas sudah dibaca.
 *
 * Kolomnya berbeda tergantung siapa yang membaca, jadi pemanggil menyebutkan
 * perannya. Gagal menandai tidak dilempar: lencana yang telat berubah jauh
 * lebih ringan akibatnya daripada halaman percakapan yang gagal dibuka.
 */
export async function tandaiUtasDibaca(
  db: SupabaseClient,
  percakapanId: string,
  peran: "penyewa" | "host"
): Promise<void> {
  const kolom = peran === "penyewa" ? "penyewa_baca_pada" : "host_baca_pada";
  await db
    .from("percakapan")
    .update({ [kolom]: new Date().toISOString() })
    .eq("id", percakapanId);
}
