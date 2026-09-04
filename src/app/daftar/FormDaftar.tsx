"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import KolomIsian from "@/components/auth/KolomIsian";
import KartuAuth from "@/components/auth/KartuAuth";
import { klienBrowser } from "@/lib/supabase/browser";
import { siteUrl } from "@/lib/supabase/env";

const SANDI_MIN = 8;

export default function FormDaftar() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kota, setKota] = useState("Malang");
  const [telepon, setTelepon] = useState("");
  const [sandi, setSandi] = useState("");
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState(false);
  const [kirimUlang, setKirimUlang] = useState<"siap" | "proses" | "selesai">("siap");

  const daftar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sandi.length < SANDI_MIN) {
      setGalat(`Sandi minimal ${SANDI_MIN} karakter.`);
      return;
    }
    setKirim(true);
    setGalat(null);

    const { data, error } = await klienBrowser().auth.signUp({
      email: email.trim(),
      password: sandi,
      options: {
        // Dibaca trigger `handle_new_user` untuk mengisi baris profil.
        data: { nama: nama.trim(), kota: kota.trim(), telepon: telepon.trim() },
        emailRedirectTo: siteUrl("/auth/konfirmasi"),
      },
    });

    setKirim(false);

    if (error) {
      setGalat(
        error.message === "User already registered"
          ? "Email itu sudah terdaftar. Coba masuk saja."
          : error.message
      );
      return;
    }

    // Kalau konfirmasi email aktif, Supabase tidak mengembalikan sesi — yang
    // benar adalah menunggu orangnya membuka tautan, bukan menganggap sudah
    // masuk. Kalau konfirmasi dimatikan di dashboard, sesinya langsung ada.
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }
    setTerkirim(true);
  };

  const ulangi = async () => {
    setKirimUlang("proses");
    await klienBrowser().auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: siteUrl("/auth/konfirmasi") },
    });
    setKirimUlang("selesai");
  };

  if (terkirim) {
    return (
      <KartuAuth
        judul="Cek emailmu"
        keterangan={`Kami mengirim tautan konfirmasi ke ${email.trim()}. Buka tautannya untuk mengaktifkan akun.`}
        kaki={
          <>
            Sudah dikonfirmasi?{" "}
            <Link href="/masuk" className="font-semibold text-brand hover:text-brand-dark">
              Masuk
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="h-10 w-10 text-brand" />
          <p className="text-xs leading-relaxed text-muted">
            Tautannya berlaku sekali pakai dan ada batas waktunya. Kalau emailnya tidak
            sampai dalam beberapa menit, periksa folder spam dulu.
          </p>
          <button
            type="button"
            onClick={ulangi}
            disabled={kirimUlang !== "siap"}
            className="cursor-pointer text-sm font-semibold text-brand hover:text-brand-dark disabled:cursor-default disabled:text-muted"
          >
            {kirimUlang === "siap"
              ? "Kirim ulang emailnya"
              : kirimUlang === "proses"
                ? "Mengirim…"
                : "Email dikirim ulang"}
          </button>
        </div>
      </KartuAuth>
    );
  }

  return (
    <KartuAuth
      judul="Daftar"
      keterangan="Satu akun untuk dua sisi: menyewa ruang, dan menyewakan ruang kosongmu."
      kaki={
        <>
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-brand hover:text-brand-dark">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={daftar} className="space-y-4">
        <KolomIsian
          id="nama"
          label="Nama"
          required
          autoComplete="name"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama yang dilihat host atau penyewa"
        />
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
        <KolomIsian
          id="kota"
          label="Kota"
          required
          autoComplete="address-level2"
          value={kota}
          onChange={(e) => setKota(e.target.value)}
        />
        <KolomIsian
          id="telepon"
          label="Nomor HP"
          type="tel"
          autoComplete="tel"
          value={telepon}
          onChange={(e) => setTelepon(e.target.value)}
          placeholder="08xxxxxxxxxx"
          bantuan="Opsional. Belum diverifikasi, dan hanya dibuka ke pihak lain setelah pembayaran."
        />
        <KolomIsian
          id="sandi"
          label="Sandi"
          type="password"
          required
          autoComplete="new-password"
          minLength={SANDI_MIN}
          value={sandi}
          onChange={(e) => setSandi(e.target.value)}
          bantuan={`Minimal ${SANDI_MIN} karakter.`}
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
          {kirim ? "Mendaftarkan…" : "Daftar"}
        </button>
      </form>
    </KartuAuth>
  );
}
