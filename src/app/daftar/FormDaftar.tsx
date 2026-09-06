"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck, UserCheck } from "lucide-react";
import KolomIsian from "@/components/auth/KolomIsian";
import KartuAuth from "@/components/auth/KartuAuth";
import PilihWilayah from "@/components/host/PilihWilayah";
import { klienBrowser } from "@/lib/supabase/browser";
import { siteUrl } from "@/lib/supabase/env";

const SANDI_MIN = 8;

export default function FormDaftar() {
  const router = useRouter();
  const tujuanKonfirmasi = siteUrl("/auth/konfirmasi");
  const tautanLokal = /^https?:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)(:|\/|$)/.test(
    tujuanKonfirmasi
  );
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  // Wilayahnya dipilih dari daftar, bukan diketik: nilainya jadi titik awal
  // pencarian lewat `/api/titik-saya`, dan nama yang salah tulis tidak bisa
  // digeokode. Cukup sampai kabupaten/kota di sini — lihat prop `sampai`.
  const [wilayah, setWilayah] = useState({ kelurahan: "", kecamatan: "", kota: "" });
  const [telepon, setTelepon] = useState("");
  const [sandi, setSandi] = useState("");
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState(false);
  const [sudahTerdaftar, setSudahTerdaftar] = useState(false);
  const [kirimUlang, setKirimUlang] = useState<"siap" | "proses" | "selesai">("siap");

  const daftar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sandi.length < SANDI_MIN) {
      setGalat(`Sandi minimal ${SANDI_MIN} karakter.`);
      return;
    }
    // Select tidak bisa `required`: <option> pertamanya bernilai string kosong.
    if (!wilayah.kota) {
      setGalat("Pilih kabupaten/kota tempatmu tinggal.");
      return;
    }
    setKirim(true);
    setGalat(null);
    setSudahTerdaftar(false);

    const { data, error } = await klienBrowser().auth.signUp({
      email: email.trim(),
      password: sandi,
      options: {
        // Dibaca trigger `handle_new_user` untuk mengisi baris profil.
        data: {
          nama: nama.trim(),
          kota: wilayah.kota,
          kecamatan: wilayah.kecamatan,
          kelurahan: wilayah.kelurahan,
          telepon: telepon.trim(),
        },
        emailRedirectTo: siteUrl("/auth/konfirmasi"),
      },
    });

    setKirim(false);

    if (error) {
      if (/already registered|already been registered/i.test(error.message)) {
        setSudahTerdaftar(true);
        return;
      }
      setGalat(error.message);
      return;
    }

    /*
      Email yang sudah terdaftar TIDAK datang sebagai galat selama konfirmasi
      email menyala. Supabase justru menjawab sukses dengan objek user
      samaran — dan itu disengaja, supaya orang tidak bisa memakai formulir
      daftar untuk menebak-nebak alamat email siapa saja yang punya akun.

      Akibatnya di layar: menekan "Daftar" dengan email yang sudah dipakai
      memberi jawaban yang sama dengan pendaftaran yang berhasil, padahal
      tidak ada email apa pun yang dikirim. Orang akan menunggu email yang
      tidak pernah datang.

      Penandanya `identities` yang kosong; itu satu-satunya bedanya dari user
      sungguhan. Konsekuensi yang perlu diketahui: memberi tahu bahwa emailnya
      sudah terdaftar berarti melepas perlindungan tadi. Ditukar sadar —
      penyewa yang tidak bisa masuk ke akunnya sendiri adalah kerugian yang
      pasti, sedangkan penebakan alamat email di sini paling banter memberi
      tahu bahwa seseorang punya akun. Halaman lupa sandi tetap menjawab sama
      untuk email yang ada maupun tidak.
    */
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setSudahTerdaftar(true);
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

  if (sudahTerdaftar) {
    return (
      <KartuAuth
        judul="Email ini sudah terdaftar"
        keterangan={`${email.trim()} sudah punya akun di Ruang. Tidak ada email baru yang dikirim.`}
        kaki={
          <>
            Salah alamat?{" "}
            <button
              type="button"
              onClick={() => setSudahTerdaftar(false)}
              className="cursor-pointer font-semibold text-brand hover:text-brand-dark"
            >
              Ubah dan daftar lagi
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <UserCheck className="h-10 w-10 text-brand" />
          <Link
            href={`/masuk?email=${encodeURIComponent(email.trim())}`}
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Masuk ke akun itu
          </Link>
          <Link
            href="/lupa-sandi"
            className="w-full rounded-full bg-card px-6 py-3 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-paper"
          >
            Lupa sandinya
          </Link>
        </div>
      </KartuAuth>
    );
  }

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

          {/* Peringatan ini muncul HANYA saat tautannya menunjuk ke komputer ini.
              Di production alamatnya domain sungguhan, dan menampilkan peringatan
              yang sama di sana justru membingungkan. */}
          {tautanLokal && (
            <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-left text-xs leading-relaxed text-warn">
              Tautan konfirmasinya menunjuk ke{" "}
              <code className="font-mono">{tujuanKonfirmasi}</code> — komputer ini. Buka
              emailnya di komputer yang sama, dan pastikan{" "}
              <code className="font-mono">npm run dev</code> masih jalan saat kamu
              mengkliknya. Kalau servernya mati, peramban akan menjawab
              ERR_CONNECTION_REFUSED meski akunnya sudah terkonfirmasi.
            </p>
          )}
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
        <div>
          <p className="mb-2 text-sm font-medium">Kamu tinggal di mana?</p>
          <PilihWilayah
            nilai={wilayah}
            onGanti={setWilayah}
            sampai="kabupaten"
            kolom={1}
          />
        </div>
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
