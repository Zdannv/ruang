import { NextResponse, type NextRequest } from "next/server";
import { klienServer } from "@/lib/supabase/server";

/**
 * Keluar akun.
 *
 * POST, bukan GET: tautan GET yang mengakhiri sesi bisa dipicu oleh apa pun
 * yang memuat URL — prefetch peramban, pemindai tautan di aplikasi chat, atau
 * gambar di halaman orang lain. Orang akan tampak keluar sendiri tanpa
 * menyentuh apa pun.
 */
export async function POST(request: NextRequest) {
  const db = await klienServer();
  await db.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
