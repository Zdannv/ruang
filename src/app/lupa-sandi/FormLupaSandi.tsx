"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import KartuAuth from "@/components/auth/KartuAuth";
import KolomIsian from "@/components/auth/KolomIsian";
import { klienBrowser } from "@/lib/supabase/browser";
import { siteUrl } from "@/lib/supabase/env";

export default function FormLupaSandi() {
  const [email, setEmail] = useState("");
  const [kirim, setKirim] = useState(false);
  const [terkirim, setTerkirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const kirimkan = async (e: React.FormEvent) => {
    e.preventDefault();
    setKirim(true);
    setGalat(null);

    const { error } = await klienBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: siteUrl("/sandi-baru"),
    });

    setKirim(false);
    if (error) {
      setGalat(error.message);
      return;
    }
    setTerkirim(true);
  };

  if (terkirim) {
    return (
      <KartuAuth
        judul="Cek emailmu"
        keterangan={`Kalau ${email.trim()} terdaftar, tautan untuk menyetel sandi baru sudah dikirim ke sana.`}
        kaki={
          <>
            Ingat sandinya?{" "}
            <Link href="/masuk" className="font-semibold text-brand hover:text-brand-dark">
              Masuk
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="h-10 w-10 text-brand" />
          {/* "Kalau terdaftar" bukan basa-basi: menjawab berbeda untuk email
              yang ada dan yang tidak membuat halaman ini jadi alat memeriksa
              siapa saja yang punya akun di sini. */}
          <p className="text-xs leading-relaxed text-muted">
            Kami tidak memberi tahu apakah sebuah email terdaftar atau tidak — kalau
            dibedakan, halaman ini bisa dipakai orang untuk mendata siapa saja yang
            punya akun di sini.
          </p>
        </div>
      </KartuAuth>
    );
  }

  return (
    <KartuAuth
      judul="Lupa sandi"
      keterangan="Masukkan emailmu, kami kirimkan tautan untuk menyetel sandi baru."
      kaki={
        <>
          Ingat sandinya?{" "}
          <Link href="/masuk" className="font-semibold text-brand hover:text-brand-dark">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={kirimkan} className="space-y-4">
        <KolomIsian
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@contoh.com"
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
          Kirim tautan
        </button>
      </form>
    </KartuAuth>
  );
}
