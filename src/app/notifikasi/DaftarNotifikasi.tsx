"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  tandaiDibaca,
  tandaiSemuaDibaca,
  type Notifikasi,
} from "@/lib/notifikasi";
import { tanggalJam } from "@/lib/label";

export default function DaftarNotifikasi({ awal }: { awal: Notifikasi[] }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);
  const belum = awal.filter((n) => n.dibaca_pada === null).length;

  const semua = async () => {
    setProses(true);
    try {
      await tandaiSemuaDibaca(klienBrowser());
      router.refresh();
    } finally {
      setProses(false);
    }
  };

  if (awal.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-line">
        <Inbox className="h-8 w-8 text-muted" />
        <p className="text-sm font-semibold">Belum ada notifikasi</p>
        <p className="max-w-sm text-xs leading-relaxed text-muted">
          Kamu akan diberi tahu di sini saat ada permintaan sewa masuk, host menjawab
          permintaanmu, atau jadwal kunjungan berubah.
        </p>
      </div>
    );
  }

  return (
    <>
      {belum > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={semua}
            disabled={proses}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {proses ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Tandai semua sudah dibaca
          </button>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {awal.map((n) => {
          const isiKartu = (
            <div
              className={`flex gap-3 rounded-2xl p-4 ring-1 transition-shadow ${
                n.dibaca_pada === null
                  ? "bg-brand-soft ring-brand/20"
                  : "bg-card ring-line"
              } ${n.tautan ? "hover:shadow-md" : ""}`}
            >
              <span className="mt-0.5 shrink-0">
                {n.jenis === "akses" ? (
                  <CalendarClock
                    className={`h-4.5 w-4.5 ${
                      n.dibaca_pada === null ? "text-brand-dark" : "text-muted"
                    }`}
                  />
                ) : (
                  <Inbox
                    className={`h-4.5 w-4.5 ${
                      n.dibaca_pada === null ? "text-brand-dark" : "text-muted"
                    }`}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{n.judul}</p>
                {n.isi && <p className="mt-0.5 text-xs text-muted">{n.isi}</p>}
                <p className="angka mt-1 text-xs text-muted">{tanggalJam(n.dibuat_pada)}</p>
              </div>
            </div>
          );

          return (
            <li key={n.id}>
              {n.tautan ? (
                <Link
                  href={n.tautan}
                  onClick={() => {
                    // Ditandai dibaca saat dibuka, bukan saat muncul di layar.
                    // Notifikasi yang hilang statusnya cuma karena tergulir
                    // melewati layar membuat orang kehilangan jejak.
                    if (n.dibaca_pada === null) {
                      tandaiDibaca(klienBrowser(), n.id).catch(() => {});
                    }
                  }}
                  className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {isiKartu}
                </Link>
              ) : (
                isiKartu
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
