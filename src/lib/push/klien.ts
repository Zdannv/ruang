"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sisi peramban dari web push.
 *
 * Yang disimpan ke database di sini — endpoint, p256dh, auth — bukan rahasia
 * server. Ketiganya dibuat peramban penerima dan hanya berguna untuk mengirim
 * ke perangkat itu. Yang rahasia adalah kunci privat VAPID, dan itu tidak
 * pernah menyentuh kode klien.
 */

const VAPID_PUBLIK = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export const pushDidukung = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window &&
  VAPID_PUBLIK !== "";

/**
 * Kunci VAPID datang sebagai base64url; PushManager memintanya sebagai byte.
 *
 * Bufernya dibuat eksplisit sebagai `ArrayBuffer`. `new Uint8Array(panjang)`
 * bertipe `Uint8Array<ArrayBufferLike>`, dan `ArrayBufferLike` mencakup
 * `SharedArrayBuffer` yang tidak diterima `BufferSource`.
 */
function keUint8(base64url: string): Uint8Array<ArrayBuffer> {
  const isi = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const mentah = atob(isi + "=".repeat((4 - (isi.length % 4)) % 4));
  const buffer = new ArrayBuffer(mentah.length);
  const keluar = new Uint8Array(buffer);
  for (let i = 0; i < mentah.length; i++) keluar[i] = mentah.charCodeAt(i);
  return keluar;
}

function keBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export async function statusPush(): Promise<"tidak_didukung" | "mati" | "hidup" | "ditolak"> {
  if (!pushDidukung()) return "tidak_didukung";
  if (Notification.permission === "denied") return "ditolak";

  const reg = await navigator.serviceWorker.getRegistration();
  const langganan = await reg?.pushManager.getSubscription();
  return langganan ? "hidup" : "mati";
}

/**
 * Menyalakan push di perangkat ini.
 *
 * Izin diminta setelah orangnya menekan tombol, bukan saat halaman dimuat.
 * Permintaan izin yang muncul tiba-tiba hampir selalu ditolak, dan penolakan
 * di Chrome bersifat permanen untuk situs itu — sekali ditolak, tidak ada cara
 * meminta lagi dari dalam aplikasi.
 */
export async function nyalakanPush(db: SupabaseClient, profilId: string): Promise<void> {
  if (!pushDidukung()) throw new Error("Peramban ini tidak mendukung notifikasi push.");

  const izin = await Notification.requestPermission();
  if (izin !== "granted") {
    throw new Error(
      izin === "denied"
        ? "Izin notifikasi ditolak. Ubah lewat setelan situs di peramban."
        : "Izin notifikasi belum diberikan."
    );
  }

  // Service worker hanya didaftarkan di production (lihat DaftarSW), jadi di
  // pengembangan langkah ini yang akan gagal — bukan izinnya.
  const reg = await navigator.serviceWorker.ready;
  const langganan =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keUint8(VAPID_PUBLIK),
    }));

  const { error } = await db.from("push_langganan").upsert(
    {
      profil_id: profilId,
      endpoint: langganan.endpoint,
      p256dh: keBase64(langganan.getKey("p256dh")),
      auth: keBase64(langganan.getKey("auth")),
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function matikanPush(db: SupabaseClient): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const langganan = await reg?.pushManager.getSubscription();
  if (!langganan) return;

  // Barisnya dihapus lebih dulu. Kalau urutannya dibalik dan penghapusan baris
  // gagal, perangkatnya sudah berhenti berlangganan tapi database masih
  // menyimpan endpoint mati yang akan terus dicoba.
  const { error } = await db
    .from("push_langganan")
    .delete()
    .eq("endpoint", langganan.endpoint);
  if (error) throw error;

  await langganan.unsubscribe();
}
