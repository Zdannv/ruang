"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import KartuAuth from "@/components/auth/KartuAuth";
import { klienBrowser } from "@/lib/supabase/browser";
import { selesaikanTautan } from "@/lib/tautanAuth";

type Keadaan =
  | { tahap: "memeriksa" }
  | { tahap: "berhasil" }
  | { tahap: "gagal"; pesan: string };

/**
 * Menyelesaikan tautan konfirmasi email.
 *
 * Seluruh penanganan tiga bentuk balasan Supabase ada di `selesaikanTautan` —
 * lihat komentar di sana untuk alasan kenapa ini harus dikerjakan di klien.
 */
export default function KonfirmasiIsi() {
  const router = useRouter();
  const [keadaan, setKeadaan] = useState<Keadaan>({ tahap: "memeriksa" });

  useEffect(() => {
    let hidup = true;

    selesaikanTautan(klienBrowser()).then((hasil) => {
      if (!hidup) return;
      if (hasil.ok) {
        setKeadaan({ tahap: "berhasil" });
        // Header dirender di server dan masih memegang keadaan "belum masuk".
        router.refresh();
      } else {
        setKeadaan({ tahap: "gagal", pesan: hasil.pesan });
      }
    });

    return () => {
      hidup = false;
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
