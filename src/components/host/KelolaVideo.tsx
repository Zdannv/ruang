"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Video } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  DURASI_MAKS_DETIK,
  KETERANGAN_VIDEO,
  UKURAN_MAKS_MB,
  daftarVideo,
  hapusVideo,
  unggahVideo,
  type VideoMilikSaya,
} from "@/lib/video";

/**
 * Unggah dan hapus video satu lahan.
 *
 * Sengaja dibatasi ketat — 45 detik, 20 MB — dan batasnya diperiksa di
 * peramban SEBELUM mengunggah, bukan hanya di bucket. Host yang merekam di
 * jalan memakai data seluler; ditolak setelah 20 MB terkirim adalah
 * pengalaman yang membuat orang berhenti mencoba.
 *
 * Daftarnya dikelola komponen sendiri, tidak bergantung pada
 * `router.refresh()`, karena alasan yang sama dengan `KelolaFoto`: di langkah
 * dua alur daftar lahan, halamannya tidak mengambil apa pun dari server.
 */
export default function KelolaVideo({
  hostId,
  ruangId,
  awal,
}: {
  hostId: string;
  ruangId: string;
  awal: VideoMilikSaya[];
}) {
  const router = useRouter();
  const [video, setVideo] = useState(awal);
  const [keterangan, setKeterangan] = useState(KETERANGAN_VIDEO[0]);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const pilih = async (daftar: FileList | null) => {
    const file = daftar?.[0];
    if (!file) return;
    setProses(true);
    setGalat(null);
    try {
      const db = klienBrowser();
      await unggahVideo(db, { hostId, ruangId, file, keterangan });
      setVideo(await daftarVideo(db, ruangId));
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Video gagal diunggah.");
    } finally {
      setProses(false);
    }
  };

  const buang = async (v: VideoMilikSaya) => {
    setProses(true);
    setGalat(null);
    try {
      const db = klienBrowser();
      await hapusVideo(db, v);
      setVideo(await daftarVideo(db, ruangId));
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Video gagal dihapus.");
    } finally {
      setProses(false);
    }
  };

  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-bold tracking-tight">Video</h2>
      <p className="mt-1 text-xs font-medium text-good">
        Tersimpan begitu dipilih. Tidak perlu menekan tombol simpan mana pun.
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        Maksimum {DURASI_MAKS_DETIK} detik dan {UKURAN_MAKS_MB} MB. Yang paling
        berguna: satu jalan dari pinggir jalan raya sampai ke lahannya, direkam
        tegak. Lebih panjang dari itu tidak menambah keterangan.
      </p>

      {video.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {video.map((v) => (
            <li key={v.id} className="relative">
              {/* `preload="metadata"`, bukan `auto`: di halaman kelola pun
                  tidak ada alasan mengunduh isi videonya sampai ditekan. */}
              <video
                src={v.url}
                poster={v.poster_url ?? undefined}
                controls
                preload="metadata"
                playsInline
                className="aspect-[3/4] w-full rounded-xl bg-ink object-cover"
              />
              <p className="angka mt-1.5 truncate text-xs text-muted">
                {v.keterangan ?? "video"}
                {v.durasi_detik ? ` · ${v.durasi_detik}s` : ""}
              </p>
              <button
                type="button"
                onClick={() => buang(v)}
                disabled={proses}
                aria-label={`Hapus video ${v.keterangan ?? ""}`}
                className="absolute right-2 top-2 cursor-pointer rounded-full bg-card/90 p-1.5 text-muted shadow-sm backdrop-blur transition-colors hover:text-warn disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor="keterangan-video" className="block text-sm font-medium">
            Keterangan video berikutnya
          </label>
          <select
            id="keterangan-video"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            className="mt-1.5 w-full cursor-pointer rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {KETERANGAN_VIDEO.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <label
          className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
            proses
              ? "cursor-not-allowed bg-brand/50 text-white"
              : "cursor-pointer bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          {proses ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          {proses ? "Mengunggah…" : "Pilih video"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={proses}
            onChange={(e) => pilih(e.target.files)}
            className="sr-only"
          />
        </label>
      </div>

      {galat && (
        <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}
    </section>
  );
}
