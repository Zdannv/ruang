import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, pastikanSiap } from "@/lib/supabase/env";

/**
 * Klien untuk Server Component, Route Handler, dan Server Action.
 *
 * Dibuat baru tiap request — jangan pernah disimpan di variabel modul. Satu
 * instance yang dipakai lintas request akan membawa sesi orang lain ke request
 * berikutnya.
 */
export async function klienServer(): Promise<SupabaseClient> {
  pastikanSiap();
  const jar = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(daftar) {
        try {
          for (const { name, value, options } of daftar) {
            jar.set(name, value, options);
          }
        } catch {
          // Server Component tidak boleh menulis cookie. Tidak apa-apa:
          // penyegaran token dikerjakan di `proxy.ts`, yang berjalan sebelum
          // render dan memang boleh menulis ke response.
        }
      },
    },
  });
}
