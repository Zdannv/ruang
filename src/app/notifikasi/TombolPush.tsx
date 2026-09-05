"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import { matikanPush, nyalakanPush, pushDidukung, statusPush } from "@/lib/push/klien";

type Status = "memuat" | "tidak_didukung" | "mati" | "hidup" | "ditolak";

/**
 * Menyalakan notifikasi push di perangkat ini.
 *
 * "Di perangkat ini" bukan basa-basi: langganan push melekat ke satu peramban
 * di satu perangkat. Orang yang menyalakannya di laptop tetap harus
 * menyalakannya lagi di HP, dan menyebutnya "aktifkan notifikasi" saja akan
 * membuat ia mengira sudah beres di mana-mana.
 */
export default function TombolPush({ profilId }: { profilId: string }) {
  const [status, setStatus] = useState<Status>("memuat");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let hidup = true;
    statusPush().then((s) => {
      if (hidup) setStatus(s);
    });
    return () => {
      hidup = false;
    };
  }, []);

  const ubah = async () => {
    setProses(true);
    setGalat(null);
    try {
      const db = klienBrowser();
      if (status === "hidup") {
        await matikanPush(db);
        setStatus("mati");
      } else {
        await nyalakanPush(db, profilId);
        setStatus("hidup");
      }
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Gagal mengubah setelan notifikasi.");
      setStatus(await statusPush());
    } finally {
      setProses(false);
    }
  };

  if (status === "memuat" || (status === "tidak_didukung" && !pushDidukung())) {
    // Peramban yang tidak mendukung push (mis. Safari iOS sebelum dipasang ke
    // layar utama) tidak perlu melihat tombol yang pasti gagal.
    if (status === "tidak_didukung") return null;
    return null;
  }

  return (
    <section className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {status === "hidup"
              ? "Notifikasi perangkat menyala"
              : "Nyalakan notifikasi di perangkat ini"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {status === "ditolak"
              ? "Izin notifikasi ditolak untuk situs ini. Ubah lewat setelan situs di peramban, lalu muat ulang halaman."
              : status === "hidup"
                ? "Kamu akan diberi tahu meski aplikasinya tertutup. Berlaku untuk perangkat ini saja."
                : "Supaya tahu ada permintaan masuk tanpa harus membuka aplikasi. Berlaku untuk perangkat ini saja."}
          </p>
        </div>

        {status !== "ditolak" && (
          <button
            type="button"
            onClick={ubah}
            disabled={proses}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              status === "hidup"
                ? "bg-card text-ink ring-1 ring-line hover:bg-paper"
                : "bg-brand text-white hover:bg-brand-dark"
            }`}
          >
            {proses ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "hidup" ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
            {status === "hidup" ? "Matikan" : "Nyalakan"}
          </button>
        )}
      </div>

      {galat && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}
    </section>
  );
}
