"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import {
  KETERANGAN_FOTO,
  daftarFoto,
  hapusFoto,
  unggahFoto,
  type FotoMilikSaya,
} from "@/lib/host";

/**
 * Unggah dan hapus foto satu ruang.
 *
 * Setiap foto wajib punya keterangan, dan itu bukan formalitas: keterangan
 * "mulut gang" atau "jalur akses" inilah yang membuat calon penyewa bisa
 * menilai apakah barangnya bisa masuk sebelum berangkat ke sana. Galeri berisi
 * enam foto cantik tanpa keterangan sama nilainya dengan iklan biasa.
 */
export default function KelolaFoto({
  hostId,
  ruangId,
  awal,
}: {
  hostId: string;
  ruangId: string;
  /**
   * Isi awal saja — sesudahnya daftar ini dikelola komponen sendiri.
   *
   * Dulu ia bergantung penuh pada `router.refresh()` untuk memperbarui
   * grid-nya, dan itu cuma bekerja di halaman yang memang mengambil fotonya
   * dari server. Di alur daftar ruang, halamannya tidak mengambil apa pun —
   * host akan mengunggah foto lalu melihat kotak kosong.
   */
  awal: FotoMilikSaya[];
}) {
  const router = useRouter();
  const [foto, setFoto] = useState(awal);
  const [keterangan, setKeterangan] = useState(KETERANGAN_FOTO[0]);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const pilih = async (daftar: FileList | null) => {
    if (!daftar || daftar.length === 0) return;
    setProses(true);
    setGalat(null);
    const db = klienBrowser();
    let urutan = foto.length;
    try {
      for (const file of Array.from(daftar)) {
        await unggahFoto(db, { hostId, ruangId, file, keterangan, urutan });
        urutan += 1;
      }
      setFoto(await daftarFoto(db, ruangId));
      // Halaman induknya ikut disegarkan supaya hitungan fotonya tidak basi;
      // grid di atas tidak menunggunya.
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Foto gagal diunggah.");
    } finally {
      setProses(false);
    }
  };

  const buang = async (f: FotoMilikSaya) => {
    setProses(true);
    setGalat(null);
    try {
      const db = klienBrowser();
      await hapusFoto(db, f);
      setFoto(await daftarFoto(db, ruangId));
      router.refresh();
    } catch (e: unknown) {
      setGalat(e instanceof Error ? e.message : "Foto gagal dihapus.");
    } finally {
      setProses(false);
    }
  };

  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-lg font-bold tracking-tight">Foto</h2>
      {/* Bagian ini menyimpan sendiri, dan host pertama yang memakainya memang
          mengira foto baru masuk setelah tombol "Simpan perubahan" di bawahnya
          ditekan. Kalimatnya sengaja tidak menyebut tombol itu: komponen yang
          sama juga dipakai di langkah dua alur daftar ruang, dan di sana tombol
          itu tidak ada. */}
      <p className="mt-1 text-xs font-medium text-good">
        Foto tersimpan begitu dipilih. Tidak perlu menekan tombol simpan mana pun.
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        Foto diperkecil dan disimpan ulang di peramban sebelum diunggah, sehingga
        metadata aslinya ikut terbuang — termasuk koordinat GPS yang biasanya
        menempel di foto HP. Tanpa itu, alamat persis ruangmu terbaca dari berkas
        gambar yang publik.
      </p>

      {foto.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {foto.map((f) => (
            <li key={f.id} className="group relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
                <Image
                  src={f.url_kecil ?? f.url}
                  alt={f.keterangan}
                  fill
                  sizes="200px"
                  unoptimized={f.url_kecil !== null}
                  className="object-cover"
                />
              </div>
              <p className="mt-1.5 truncate text-xs text-muted">{f.keterangan}</p>
              <button
                type="button"
                onClick={() => buang(f)}
                disabled={proses}
                aria-label={`Hapus foto ${f.keterangan}`}
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
          <label htmlFor="keterangan" className="block text-sm font-medium">
            Keterangan foto berikutnya
          </label>
          <select
            id="keterangan"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            className="mt-1.5 w-full cursor-pointer rounded-xl bg-card px-3.5 py-2.5 text-sm ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {KETERANGAN_FOTO.map((k) => (
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
          {proses ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {proses ? "Mengunggah…" : "Pilih foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
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
