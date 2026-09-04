/**
 * Jadwal kunjungan.
 *
 * Ini pengganti segel tamper-evident: karena penyewa boleh datang berkali-kali,
 * tidak ada segel yang bisa dipasang. Yang menggantikannya manifes berfoto,
 * berita acara serah terima, dan log kunjungan ini — setiap kali seseorang
 * masuk, ada barisnya.
 *
 * Klien tidak punya hak tulis apa pun ke `akses_log`: hanya SELECT. Semua
 * penulisan lewat RPC di `06_akses.sql`, yang menegakkan kuota bulanan dan
 * memeriksa siapa pemanggilnya.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type StatusAkses = "diminta" | "disetujui" | "ditolak" | "selesai";

export type Kunjungan = {
  id: string;
  diminta_untuk: string;
  status: StatusAkses;
  tiba_pada: string | null;
  catatan: string | null;
  dibuat_pada: string;
};

export async function daftarKunjungan(
  db: SupabaseClient,
  pemesananId: string
): Promise<Kunjungan[]> {
  const { data, error } = await db
    .from("akses_log")
    .select("id, diminta_untuk, status, tiba_pada, catatan, dibuat_pada")
    .eq("pemesanan_id", pemesananId)
    .order("diminta_untuk", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Kunjungan[];
}

/**
 * Sisa kuota kunjungan untuk bulan yang memuat `tanggal`.
 *
 * Dihitung di database, bukan dari daftar di atas: aturannya (hanya yang
 * disetujui dan selesai yang memakan kuota, bulan kalender waktu Jakarta) harus
 * sama persis dengan yang ditegakkan `minta_akses` — kalau dihitung ulang di
 * sini, dua tempat itu pasti akan berbeda pendapat suatu saat.
 */
export async function sisaKuota(
  db: SupabaseClient,
  pemesananId: string,
  tanggal: string
): Promise<number> {
  const { data, error } = await db.rpc("sisa_kuota_akses", {
    p_pemesanan: pemesananId,
    p_bulan: tanggal,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

/**
 * `untuk` adalah waktu dinding Jakarta dalam bentuk "yyyy-MM-ddTHH:mm", persis
 * seperti yang dikeluarkan `<input type="datetime-local">`.
 *
 * Zonanya dipatok ke +07:00, bukan diserahkan ke `new Date(untuk)` yang memakai
 * zona peramban. Jendela akses host ("Sen-Sab 08.00-17.00") adalah jam Jakarta;
 * penyewa yang membuka aplikasi dari zona lain — sedang di luar kota, atau
 * ponselnya salah setelan — akan mengirim jam yang bergeser tanpa sadar, dan
 * host menerima permintaan jam tiga pagi.
 */
export async function mintaKunjungan(
  db: SupabaseClient,
  pemesananId: string,
  untuk: string,
  catatan?: string
): Promise<void> {
  const { error } = await db.rpc("minta_akses", {
    p_pemesanan: pemesananId,
    p_untuk: new Date(`${untuk}:00+07:00`).toISOString(),
    p_catatan: catatan ?? null,
  });
  if (error) throw error;
}

/** "yyyy-MM-ddTHH:mm" waktu Jakarta — bentuk yang diminta `datetime-local`. */
export function waktuJakarta(d: Date): string {
  const bagian = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  // "sv-SE" menghasilkan "2026-09-05 10:00" — tinggal ganti spasinya.
  return bagian.replace(" ", "T");
}

export async function setujuiKunjungan(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.rpc("setujui_akses", { p_akses: id });
  if (error) throw error;
}

export async function tolakKunjungan(
  db: SupabaseClient,
  id: string,
  catatan?: string
): Promise<void> {
  const { error } = await db.rpc("tolak_akses", {
    p_akses: id,
    p_catatan: catatan ?? null,
  });
  if (error) throw error;
}

export async function tandaiTiba(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.rpc("tandai_akses_tiba", { p_akses: id });
  if (error) throw error;
}
