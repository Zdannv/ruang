import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseSiap } from "@/lib/supabase/env";

/**
 * Menyegarkan sesi Supabase sebelum halaman dirender.
 *
 * Server Component tidak boleh menulis cookie, jadi tanpa lapisan ini token
 * yang kedaluwarsa tidak pernah diperbarui: orang tampak keluar sendiri
 * setelah satu jam, dan layar yang butuh sesi kadang kosong tanpa sebab.
 *
 * Di Next.js 16 berkas ini bernama `proxy.ts`, bukan `middleware.ts`.
 */
export async function proxy(request: NextRequest) {
  if (!supabaseSiap) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(daftar, headers) {
        for (const { name, value } of daftar) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of daftar) {
          response.cookies.set(name, value, options);
        }
        // Response yang memasang cookie sesi tidak boleh di-cache CDN —
        // token satu orang bisa tersaji ke orang lain.
        for (const [kunci, nilai] of Object.entries(headers)) {
          response.headers.set(kunci, nilai);
        }
      },
    },
  });

  // Panggilan inilah yang memicu penyegaran token. Jangan dihapus meski
  // hasilnya tidak dipakai di sini.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Semua rute kecuali aset statis dan berkas gambar — menyegarkan sesi
     * untuk setiap permintaan favicon cuma menambah beban tanpa guna.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
