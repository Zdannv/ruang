"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import KartuAuth from "@/components/auth/KartuAuth";
import KolomIsian from "@/components/auth/KolomIsian";
import { klienBrowser } from "@/lib/supabase/browser";
import { selesaikanTautan } from "@/lib/tautanAuth";

const SANDI_MIN = 8;

type Tahap =
  | { nama: "memeriksa" }
  | { nama: "siap" }
  | { nama: "selesai" }
  | { nama: "gagal"; pesan: string };

/**
 * Menyetel sandi baru dari tautan email.
 *
 * Tautan setel ulang membawa sesi sementara. Setelah sesi itu terbentuk,
 * `updateUser` boleh mengganti sandinya — jadi urutannya: selesaikan tautannya
 * dulu, baru tampilkan formulirnya. Menampilkan formulir lebih dulu berarti
 * orang mengetik sandi baru lalu baru diberi tahu tautannya kedaluwarsa.
 */
export default function FormSandiBaru() {
  const router = useRouter();
  const [tahap, setTahap] = useState<Tahap>({ nama: "memeriksa" });
  const [sandi, setSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let hidup = true;
    selesaikanTautan(klienBrowser()).then((hasil) => {
      if (!hidup) return;
      setTahap(hasil.ok ? { nama: "siap" } : { nama: "gagal", pesan: hasil.pesan });
    });
    return () => {
      hidup = false;
    };
  }, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sandi.length < SANDI_MIN) {
      setGalat(`Sandi minimal ${SANDI_MIN} karakter.`);
      return;
    }
    if (sandi !== ulangi) {
      setGalat("Dua isian sandinya belum sama.");
      return;
    }

    setKirim(true);
    setGalat(null);
    const { error } = await klienBrowser().auth.updateUser({ password: sandi });
    setKirim(false);

    if (error) {
      setGalat(error.message);
      return;
    }
    setTahap({ nama: "selesai" });
    router.refresh();
  };

  if (tahap.nama === "memeriksa") {
    return (
      <KartuAuth
        judul="Memeriksa tautan"
        keterangan="Sebentar."
        kaki={<>&nbsp;</>}
      >
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </KartuAuth>
    );
  }

  if (tahap.nama === "gagal") {
    return (
      <KartuAuth
        judul="Tautannya tidak bisa dipakai"
        keterangan={tahap.pesan}
        kaki={
          <>
            <Link
              href="/lupa-sandi"
              className="font-semibold text-brand hover:text-brand-dark"
            >
              Minta tautan baru
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <CircleX className="h-10 w-10 text-warn" />
          <p className="text-xs leading-relaxed text-muted">
            Tautan setel ulang hanya berlaku sekali dan ada batas waktunya.
          </p>
        </div>
      </KartuAuth>
    );
  }

  if (tahap.nama === "selesai") {
    return (
      <KartuAuth
        judul="Sandi diganti"
        keterangan="Kamu sudah masuk dengan sandi yang baru."
        kaki={<>&nbsp;</>}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <CircleCheck className="h-10 w-10 text-good" />
          <Link
            href="/cari"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Lanjut
          </Link>
        </div>
      </KartuAuth>
    );
  }

  return (
    <KartuAuth
      judul="Sandi baru"
      keterangan="Pilih sandi baru untuk akunmu."
      kaki={<>&nbsp;</>}
    >
      <form onSubmit={simpan} className="space-y-4">
        <KolomIsian
          id="sandi"
          label="Sandi baru"
          type="password"
          required
          autoComplete="new-password"
          minLength={SANDI_MIN}
          value={sandi}
          onChange={(e) => setSandi(e.target.value)}
          bantuan={`Minimal ${SANDI_MIN} karakter.`}
        />
        <KolomIsian
          id="ulangi"
          label="Ulangi sandi baru"
          type="password"
          required
          autoComplete="new-password"
          value={ulangi}
          onChange={(e) => setUlangi(e.target.value)}
        />

        {galat && (
          <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
        )}

        <button
          type="submit"
          disabled={kirim}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan sandi baru
        </button>
      </form>
    </KartuAuth>
  );
}
