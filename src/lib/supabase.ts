import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Apakah kredensial Supabase sudah diisi.
 *
 * Dipakai layar untuk menampilkan petunjuk pemasangan alih-alih layar putih.
 * Demo ini akan dibuka orang lain di laptop lain sebelum presentasi; gagal
 * dengan pesan yang jelas lebih murah daripada gagal dengan error jaringan
 * yang tidak menyebut penyebabnya.
 */
export const supabaseSiap = Boolean(url && anonKey);

/**
 * Kunci yang dipakai di browser wajib **anon key**, bukan service role.
 * Service role melewati seluruh RLS dan ikut terbundel ke JavaScript yang
 * dikirim ke pengunjung — siapa pun bisa membacanya lewat devtools.
 */
export const supabase: SupabaseClient | null = supabaseSiap
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null;

/** Dipakai lapisan data supaya tidak perlu memeriksa null di tiap pemanggilan. */
export function klien(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase belum dikonfigurasi. Salin .env.example menjadi .env.local, " +
        "lalu isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return supabase;
}
