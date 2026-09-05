import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Bagian web push yang HANYA boleh hidup di server.
 *
 * Modul ini memegang dua hal yang tidak boleh sampai ke peramban: kunci privat
 * VAPID, dan service role key Supabase yang melewati seluruh RLS. Keduanya
 * dibaca dari env tanpa awalan `NEXT_PUBLIC_`, jadi Next.js tidak akan
 * memasukkannya ke bundel klien — tapi penjaga di bawah ada supaya kesalahan
 * impor dari komponen klien gagal keras, bukan diam-diam mengirim kunci.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "lib/push/server.ts terimpor ke sisi klien. Modul ini memegang kunci " +
      "privat VAPID dan service role key; jangan pernah diimpor dari komponen " +
      'bertanda "use client".'
  );
}

const VAPID_PUBLIK = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
const VAPID_PRIVAT = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
export const PUSH_RAHASIA = process.env.PUSH_RAHASIA?.trim() ?? "";

export const pushSiap = Boolean(
  VAPID_PUBLIK && VAPID_PRIVAT && SERVICE_ROLE && PUSH_RAHASIA && SUPABASE_URL
);

/**
 * `mailto:` wajib ada di subject VAPID — layanan push memakainya untuk
 * menghubungi pemilik aplikasi kalau pengirimannya bermasalah.
 */
export function siapkanWebPush(): typeof webpush {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:halo@ruang.app",
    VAPID_PUBLIK,
    VAPID_PRIVAT
  );
  return webpush;
}

/**
 * Klien Supabase dengan service role.
 *
 * Dipakai HANYA di Route Handler pengirim push, yang perlu membaca langganan
 * milik orang lain — sesuatu yang memang tidak boleh bisa dilakukan pengguna
 * mana pun. Jangan pakai klien ini untuk apa pun yang bisa dikerjakan klien
 * biasa: ia mengabaikan seluruh RLS, jadi setiap pemakaiannya harus punya
 * alasan yang ditulis.
 */
export function klienServiceRole(): SupabaseClient {
  if (!SERVICE_ROLE) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
