"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import KolomIsian from "@/components/auth/KolomIsian";
import KartuAuth from "@/components/auth/KartuAuth";
import { klienBrowser } from "@/lib/supabase/browser";

export default function FormMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Diisi lewat `?email=` dari layar "email ini sudah terdaftar", supaya orang
  // tidak perlu mengetik ulang alamat yang barusan ia ketik.
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [sandi, setSandi] = useState("");
  const [kirim, setKirim] = useState(false);
  // Galat dari tautan email (mis. tautannya kedaluwarsa) sampai ke sini lewat
  // query, jadi keadaan awalnya bukan selalu kosong.
  const [galat, setGalat] = useState<string | null>(searchParams.get("galat"));

  const lanjut = searchParams.get("lanjut") ?? "/";

  const masuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setKirim(true);
    setGalat(null);

    const { error } = await klienBrowser().auth.signInWithPassword({
      email: email.trim(),
      password: sandi,
    });

    if (error) {
      setKirim(false);
      setGalat(
        error.message === "Invalid login credentials"
          ? "Email atau sandinya tidak cocok."
          : error.message === "Email not confirmed"
            ? "Emailnya belum dikonfirmasi. Buka tautan di email yang kami kirim."
            : error.message
      );
      return;
    }

    // `refresh` wajib: sesi baru tersimpan di cookie oleh klien browser, tapi
    // Server Component yang sudah dirender masih memegang keadaan lama —
    // tanpa ini header tetap menampilkan tombol "Masuk".
    router.replace(lanjut);
    router.refresh();
  };

  return (
    <KartuAuth
      judul="Masuk"
      keterangan="Masuk untuk memesan ruang atau mengelola ruang yang kamu sewakan."
      kaki={
        <>
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-brand hover:text-brand-dark">
            Daftar
          </Link>
        </>
      }
    >
      <form onSubmit={masuk} className="space-y-4">
        <KolomIsian
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@contoh.com"
        />
        <div>
          <KolomIsian
            id="sandi"
            label="Sandi"
            type="password"
            autoComplete="current-password"
            required
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
          />
          <p className="mt-1.5 text-right">
            <Link
              href="/lupa-sandi"
              className="text-xs font-semibold text-brand hover:text-brand-dark"
            >
              Lupa sandi?
            </Link>
          </p>
        </div>

        {galat && (
          <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
        )}

        <button
          type="submit"
          disabled={kirim}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
          {kirim ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </KartuAuth>
  );
}
