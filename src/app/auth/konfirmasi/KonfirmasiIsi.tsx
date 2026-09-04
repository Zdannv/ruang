"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import KartuAuth from "@/components/auth/KartuAuth";
import { klienBrowser } from "@/lib/supabase/browser";

type Keadaan =
  | { tahap: "memeriksa" }
  | { tahap: "berhasil" }
  | { tahap: "gagal"; pesan: string };

/** Berapa lama menunggu klien Supabase menyelesaikan tautannya sendiri. */
const BATAS_MS = 6000;

/**
 * Menyelesaikan tautan konfirmasi email.
 *
 * Dikerjakan di klien, bukan di route handler server, dan itu bukan pilihan
 * gaya. Supabase bisa mengembalikan hasil verifikasi dalam tiga bentuk berbeda
 * tergantung templat email dan alur yang aktif:
 *
 *   1. `?token_hash=...&type=signup` — perlu `verifyOtp` eksplisit.
 *   2. `?code=...` — alur PKCE; ditangani sendiri oleh klien browser.
 *   3. `#access_token=...&refresh_token=...` — alur implisit.
 *
 * Bentuk ketiga TIDAK PERNAH sampai ke server: fragment URL tidak dikirim
 * peramban dalam permintaan HTTP. Versi pertama halaman ini berupa route
 * handler, jadi untuk bentuk itu ia selalu menjawab "tautannya tidak lengkap"
 * padahal tokennya ada di alamat yang sedang dibuka.
 *
 * `createBrowserClient` sudah menyalakan `detectSessionInUrl`, jadi bentuk 2
 * dan 3 selesai sendiri begitu klien dibuat — yang perlu dilakukan di sini
 * cuma menunggu sesinya muncul, dan menangani bentuk 1 secara eksplisit.
 */
export default function KonfirmasiIsi() {
  const router = useRouter();
  const [keadaan, setKeadaan] = useState<Keadaan>({ tahap: "memeriksa" });

  useEffect(() => {
    const db = klienBrowser();
    let hidup = true;
    let pewaktu: ReturnType<typeof setTimeout> | undefined;

    const selesai = (k: Keadaan) => {
      if (!hidup) return;
      hidup = false;
      clearTimeout(pewaktu);
      setKeadaan(k);
      if (k.tahap === "berhasil") {
        // Header dirender di server dan masih memegang keadaan "belum masuk".
        router.refresh();
      }
    };

    const jalan = async () => {
      const url = new URL(window.location.href);
      const fragmen = new URLSearchParams(url.hash.replace(/^#/, ""));

      // Supabase menaruh alasan kegagalannya di query ATAU di fragment,
      // tergantung alur — dua-duanya diperiksa.
      const galatUrl =
        url.searchParams.get("error_description") ??
        fragmen.get("error_description") ??
        url.searchParams.get("error") ??
        fragmen.get("error");
      if (galatUrl) {
        selesai({ tahap: "gagal", pesan: galatUrl.replace(/\+/g, " ") });
        return;
      }

      // Sesi bisa sudah terbentuk sebelum efek ini jalan.
      const { data: awal } = await db.auth.getUser();
      if (awal.user) {
        selesai({ tahap: "berhasil" });
        return;
      }

      const { data: langganan } = db.auth.onAuthStateChange((_peristiwa, sesi) => {
        if (sesi) {
          langganan.subscription.unsubscribe();
          selesai({ tahap: "berhasil" });
        }
      });

      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type") as EmailOtpType | null;
      if (tokenHash && type) {
        const { error } = await db.auth.verifyOtp({ type, token_hash: tokenHash });
        if (error) {
          langganan.subscription.unsubscribe();
          selesai({ tahap: "gagal", pesan: error.message });
        }
        return;
      }

      pewaktu = setTimeout(() => {
        langganan.subscription.unsubscribe();
        selesai({
          tahap: "gagal",
          pesan:
            "Tautannya tidak memuat token yang bisa dipakai. Biasanya karena " +
            "tautannya sudah pernah dibuka, atau sudah lewat batas waktunya.",
        });
      }, BATAS_MS);
    };

    jalan();

    return () => {
      hidup = false;
      clearTimeout(pewaktu);
    };
  }, [router]);

  if (keadaan.tahap === "memeriksa") {
    return (
      <KartuAuth
        judul="Memeriksa tautan"
        keterangan="Sebentar, kami sedang mengonfirmasi emailmu."
        kaki={<>&nbsp;</>}
      >
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </KartuAuth>
    );
  }

  if (keadaan.tahap === "berhasil") {
    return (
      <KartuAuth
        judul="Email terkonfirmasi"
        keterangan="Akunmu aktif dan kamu sudah masuk."
        kaki={<>&nbsp;</>}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <CircleCheck className="h-10 w-10 text-good" />
          <Link
            href="/cari"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Mulai cari ruang
          </Link>
        </div>
      </KartuAuth>
    );
  }

  return (
    <KartuAuth
      judul="Tautannya tidak bisa dipakai"
      keterangan={keadaan.pesan}
      kaki={
        <>
          Sudah pernah dikonfirmasi?{" "}
          <Link href="/masuk" className="font-semibold text-brand hover:text-brand-dark">
            Coba masuk saja
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <CircleX className="h-10 w-10 text-warn" />
        <p className="text-xs leading-relaxed text-muted">
          Tautan konfirmasi hanya bisa dipakai sekali. Kalau akunmu sudah aktif, tautan
          yang sama akan gagal — dan itu wajar. Coba masuk lebih dulu sebelum meminta
          email baru.
        </p>
        <Link
          href="/daftar"
          className="rounded-full bg-card px-5 py-2.5 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
        >
          Kirim ulang email konfirmasi
        </Link>
      </div>
    </KartuAuth>
  );
}
