/**
 * Menyelesaikan tautan yang dikirim Supabase lewat email.
 *
 * Dipakai dua layar — konfirmasi pendaftaran dan setel ulang sandi — dan
 * keduanya menghadapi masalah yang sama persis, jadi logikanya ditulis sekali
 * di sini.
 *
 * Supabase bisa membalas dalam tiga bentuk, tergantung templat email dan alur
 * yang aktif di project:
 *
 *   1. `?token_hash=...&type=...` — perlu `verifyOtp` eksplisit.
 *   2. `?code=...` — alur PKCE; ditangani sendiri oleh klien browser.
 *   3. `#access_token=...&refresh_token=...` — alur implisit.
 *
 * Bentuk ketiga TIDAK PERNAH sampai ke server: fragment URL tidak dikirim
 * peramban dalam permintaan HTTP. Karena itu penyelesaiannya harus di klien,
 * bukan di route handler — versi pertama halaman konfirmasi berupa route
 * handler dan selalu menjawab "tautannya tidak lengkap" untuk bentuk itu,
 * padahal tokennya ada di alamat yang sedang dibuka.
 */

import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

export type HasilTautan = { ok: true } | { ok: false; pesan: string };

/** Berapa lama menunggu klien Supabase menyelesaikan tautannya sendiri. */
const BATAS_MS = 6000;

export async function selesaikanTautan(db: SupabaseClient): Promise<HasilTautan> {
  const url = new URL(window.location.href);
  const fragmen = new URLSearchParams(url.hash.replace(/^#/, ""));

  // Alasan kegagalan diletakkan Supabase di query ATAU di fragment, tergantung
  // alur — dua-duanya diperiksa.
  const galatUrl =
    url.searchParams.get("error_description") ??
    fragmen.get("error_description") ??
    url.searchParams.get("error") ??
    fragmen.get("error");
  if (galatUrl) return { ok: false, pesan: galatUrl.replace(/\+/g, " ") };

  // Sesinya bisa sudah terbentuk sebelum fungsi ini dipanggil:
  // `createBrowserClient` menyalakan `detectSessionInUrl`.
  const { data: awal } = await db.auth.getUser();
  if (awal.user) return { ok: true };

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await db.auth.verifyOtp({ type, token_hash: tokenHash });
    return error ? { ok: false, pesan: error.message } : { ok: true };
  }

  // Bentuk 2 dan 3 diselesaikan klien secara asinkron — tunggu sesinya muncul.
  return new Promise<HasilTautan>((selesai) => {
    const { data: langganan } = db.auth.onAuthStateChange((_peristiwa, sesi) => {
      if (!sesi) return;
      clearTimeout(pewaktu);
      langganan.subscription.unsubscribe();
      selesai({ ok: true });
    });

    const pewaktu = setTimeout(() => {
      langganan.subscription.unsubscribe();
      selesai({
        ok: false,
        pesan:
          "Tautannya tidak memuat token yang bisa dipakai. Biasanya karena " +
          "tautannya sudah pernah dibuka, atau sudah lewat batas waktunya.",
      });
    }, BATAS_MS);
  });
}
