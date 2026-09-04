"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, pastikanSiap } from "@/lib/supabase/env";

let klien: SupabaseClient | null = null;

/**
 * Klien untuk komponen sisi klien.
 *
 * Satu instance dipakai bersama: tiap `createBrowserClient` memasang pendengar
 * perubahan sesi sendiri, dan membuatnya berulang kali berarti satu kali login
 * memicu banyak penyegaran token sekaligus.
 *
 * Kuncinya wajib **anon key**, bukan service role. Service role melewati
 * seluruh RLS dan ikut terbundel ke JavaScript yang dikirim ke pengunjung.
 */
export function klienBrowser(): SupabaseClient {
  pastikanSiap();
  klien ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return klien;
}
