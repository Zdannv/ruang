"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import { ajukanVerifikasi, type StatusVerifikasi } from "@/lib/verifikasi";
import { tanggal } from "@/lib/label";

/**
 * Pengajuan verifikasi lahan, dari sisi pemiliknya.
 *
 * Kalimat di sini sengaja menyebut BATASnya, bukan cuma manfaatnya. Yang
 * dijamin lencana ini cuma satu: keterangan di listing cocok dengan keadaan
 * di lokasi pada hari petugas datang. Pemilik yang mengira ia mendapat
 * jaminan keamanan akan menjualnya begitu ke penyewa, dan itu jenis
 * kebohongan yang dilarang di CLAUDE.md — hanya saja diucapkan orang lain.
 */
export default function KelolaVerifikasi({
  ruangId,
  status,
  diajukanPada,
  diputuskanPada,
  catatan,
  adaFoto,
}: {
  ruangId: string;
  status: StatusVerifikasi;
  diajukanPada: string | null;
  diputuskanPada: string | null;
  catatan: string | null;
  adaFoto: boolean;
}) {
  const router = useRouter();
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const ajukan = async () => {
    setKirim(true);
    setGalat(null);
    try {
      await ajukanVerifikasi(klienBrowser(), ruangId);
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Pengajuannya gagal dikirim.");
    } finally {
      setKirim(false);
    }
  };

  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
        <ShieldCheck className="h-5 w-5 text-brand" />
        Verifikasi lahan
      </h2>

      {status === "terverifikasi" ? (
        <>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1 text-sm font-semibold text-good">
            <BadgeCheck className="h-4 w-4" />
            Terverifikasi
            {diputuskanPada ? ` · ${tanggal(diputuskanPada)}` : ""}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Lencananya sekarang tampil di kartu hasil pencarian dan di halaman
            lahanmu. Yang dinyatakannya: petugas kami sudah datang dan
            keterangan di listing ini cocok dengan keadaan di lokasi pada hari
            itu. Kalau kamu mengubah ukuran, harga, atau fasilitasnya nanti,
            ajukan lagi supaya lencananya tetap benar.
          </p>
        </>
      ) : status === "diajukan" ? (
        <>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-dark">
            <Clock className="h-4 w-4" />
            Menunggu kunjungan petugas
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Diajukan {diajukanPada ? tanggal(diajukanPada) : "baru saja"}. Petugas
            kami menghubungi nomor di profilmu untuk janjian. Tidak ada biaya.
          </p>
        </>
      ) : (
        <>
          {status === "ditolak" && (
            <div className="mt-2 rounded-xl bg-warn-soft px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-warn">
                <TriangleAlert className="h-4 w-4" />
                Belum lolos
                {diputuskanPada ? ` · ${tanggal(diputuskanPada)}` : ""}
              </p>
              {catatan && (
                <p className="mt-1 text-xs leading-relaxed text-warn">{catatan}</p>
              )}
              <p className="mt-1.5 text-xs leading-relaxed text-warn/80">
                Perbaiki dulu keterangannya, lalu ajukan lagi.
              </p>
            </div>
          )}

          <p className="mt-2 text-xs leading-relaxed text-muted">
            Petugas kami datang ke lokasi dan mencocokkan keterangan di listing ini
            dengan keadaan sebenarnya. Yang lolos dapat lencana{" "}
            <strong className="text-ink">Terverifikasi</strong> di kartu hasil
            pencarian — dan pedagang lebih dulu membuka yang berlencana.
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Gratis, dan tidak wajib. Yang dinyatakan lencananya cuma kecocokan
            keterangan pada hari kunjungan; ia bukan jaminan keamanan dan bukan
            asuransi.
          </p>

          {!adaFoto && (
            <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
              Unggah dulu fotonya. Petugas mencocokkan foto dengan keadaan di
              lokasi, jadi listing tanpa foto tidak punya apa pun untuk dicek.
            </p>
          )}

          {galat && (
            <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
              {galat}
            </p>
          )}

          <button
            type="button"
            onClick={ajukan}
            disabled={kirim || !adaFoto}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "ditolak" ? "Ajukan lagi" : "Ajukan verifikasi"}
          </button>
        </>
      )}
    </section>
  );
}
