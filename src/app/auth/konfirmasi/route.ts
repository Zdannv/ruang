import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { klienServer } from "@/lib/supabase/server";

/**
 * Tujuan tautan di email konfirmasi.
 *
 * Dua bentuk tautan ditangani sekaligus, karena mana yang dipakai tergantung
 * templat email di dashboard Supabase:
 *
 * - `token_hash` + `type` — templat bawaan yang memakai `{{ .ConfirmationURL }}`.
 * - `code` — alur PKCE, yang dipakai `@supabase/ssr` untuk magic link.
 *
 * Menangani satu saja berarti setengah pengguna mendarat di halaman error
 * tanpa penjelasan, tergantung templat mana yang sedang aktif.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const lanjut = url.searchParams.get("next") ?? "/";

  const db = await klienServer();

  if (tokenHash && type) {
    const { error } = await db.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(lanjut, request.url));
    return gagal(request, error.message);
  }

  if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(lanjut, request.url));
    return gagal(request, error.message);
  }

  return gagal(request, "Tautannya tidak lengkap.");
}

/**
 * Alasan kegagalan dibawa ke halaman masuk, bukan dibiarkan jadi layar error.
 * Penyebab yang paling sering: tautannya sudah dipakai, atau sudah lewat
 * batas waktunya — dua hal yang bisa diselesaikan sendiri dengan mengirim
 * ulang emailnya.
 */
function gagal(request: NextRequest, pesan: string) {
  const tujuan = new URL("/masuk", request.url);
  tujuan.searchParams.set("galat", pesan);
  return NextResponse.redirect(tujuan);
}
