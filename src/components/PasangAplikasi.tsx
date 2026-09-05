"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, CheckCircle2, Share } from "lucide-react";

/** Peristiwa non-standar milik Chromium; tidak ada di lib DOM bawaan. */
type PeristiwaPasang = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Untuk nilai yang tidak pernah berubah setelah halaman dimuat. */
const tanpaLangganan = () => () => {};

/**
 * Membantu memasang aplikasi ke layar utama.
 *
 * Ada karena "kok tidak ada pilihannya" adalah keluhan yang wajar, bukan tanda
 * ada yang rusak:
 *
 * - **Safari iOS tidak pernah menawarkan apa pun.** Satu-satunya cara adalah
 *   menu Bagikan lalu "Tambah ke Layar Utama". Tidak ada API yang bisa
 *   memunculkannya dari dalam halaman, jadi yang bisa dilakukan cuma
 *   menunjukkan langkahnya.
 * - **Chrome menahan tawarannya** sampai ia menilai situsnya cukup sering
 *   dipakai. Tombol di sini memakai `beforeinstallprompt` yang ditahan, jadi
 *   orang tidak perlu menunggu Chrome berubah pikiran.
 *
 * Keadaan dari luar React (`matchMedia`, `navigator`) dibaca lewat
 * `useSyncExternalStore`, bukan disetel dari dalam efek. Selain itu memang cara
 * yang dianjurkan React untuk sumber di luar, ia juga menghindarkan render
 * berantai yang dilarang aturan kemurnian.
 */
export default function PasangAplikasi() {
  // Render pertama di server tidak tahu apa-apa soal perangkat; penanda ini
  // mencegah kedipan "belum terpasang" sebelum jawabannya diketahui.
  const diKlien = useSyncExternalStore(
    tanpaLangganan,
    () => true,
    () => false
  );

  const terpasang = useSyncExternalStore(
    (beritahu) => {
      const mq = window.matchMedia("(display-mode: standalone)");
      mq.addEventListener("change", beritahu);
      window.addEventListener("appinstalled", beritahu);
      return () => {
        mq.removeEventListener("change", beritahu);
        window.removeEventListener("appinstalled", beritahu);
      };
    },
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari iOS memakai penanda sendiri, di luar standar.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false
  );

  const ios = useSyncExternalStore(
    tanpaLangganan,
    () => /iphone|ipad|ipod/i.test(window.navigator.userAgent),
    () => false
  );

  const [peristiwa, setPeristiwa] = useState<PeristiwaPasang | null>(null);

  useEffect(() => {
    const tangkap = (e: Event) => {
      // Ditahan supaya tawarannya muncul lewat tombol di bawah, bukan kapan pun
      // Chrome memutuskan sendiri.
      e.preventDefault();
      setPeristiwa(e as PeristiwaPasang);
    };
    window.addEventListener("beforeinstallprompt", tangkap);
    return () => window.removeEventListener("beforeinstallprompt", tangkap);
  }, []);

  const keadaan: "memeriksa" | "sudah" | "bisa" | "ios" | "manual" = !diKlien
    ? "memeriksa"
    : terpasang
      ? "sudah"
      : peristiwa
        ? "bisa"
        : ios
          ? "ios"
          : "manual";

  if (keadaan === "memeriksa") return null;

  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-display text-lg font-bold tracking-tight">
        {keadaan === "sudah" ? "Aplikasi sudah terpasang" : "Pasang di layar utama"}
      </h2>

      {keadaan === "sudah" && (
        <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" />
          Kamu sedang membukanya sebagai aplikasi. Notifikasi perangkat juga bisa
          dinyalakan dari halaman notifikasi.
        </p>
      )}

      {keadaan === "bisa" && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Terbuka seperti aplikasi biasa, tanpa bilah alamat, dan tetap ada ikonnya
            di layar utama.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!peristiwa) return;
              await peristiwa.prompt();
              await peristiwa.userChoice;
              // Tawaran hanya berlaku sekali. Melepasnya membuat tombol ini
              // hilang sendiri — kalau pemasangannya jadi, `appinstalled`
              // yang mengabari; kalau ditolak, yang tampil petunjuk manual.
              setPeristiwa(null);
            }}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Pasang aplikasi
          </button>
        </>
      )}

      {keadaan === "ios" && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Di iPhone dan iPad, pemasangan hanya bisa lewat menu Safari — tidak ada
            tombol yang bisa disediakan halaman ini.
          </p>
          <ol className="mt-3 space-y-2 text-sm text-ink">
            <li className="flex items-start gap-2">
              <span className="angka mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-bold">
                1
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                Ketuk <Share className="h-4 w-4 text-brand" /> Bagikan di bilah bawah
                Safari
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="angka mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-bold">
                2
              </span>
              <span>Gulir, pilih <strong>Tambah ke Layar Utama</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="angka mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-bold">
                3
              </span>
              <span>Ketuk <strong>Tambah</strong></span>
            </li>
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Harus lewat Safari. Chrome di iOS memakai mesin yang sama tapi tidak punya
            pilihan ini.
          </p>
        </>
      )}

      {keadaan === "manual" && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Peramban ini belum menawarkan pemasangan. Di Chrome Android, buka menu
            titik tiga di kanan atas lalu pilih <strong>Instal aplikasi</strong> atau{" "}
            <strong>Tambahkan ke layar utama</strong>.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Kalau pilihannya belum muncul, biasanya karena Chrome menunggu situsnya
            dibuka beberapa kali dulu. Muat ulang halaman ini setelah itu dan tombol
            pasang akan tersedia di sini.
          </p>
        </>
      )}
    </section>
  );
}
