"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Bagian, Kolom } from "@/components/host/Kolom";
import PilihWilayah from "@/components/host/PilihWilayah";
import { klienBrowser } from "@/lib/supabase/browser";
import { bulanTahun } from "@/lib/label";

/** Kolom nullable: string kosong disimpan sebagai NULL, bukan sebagai "". */
const kosongJadiNull = (v: string) => (v.trim() === "" ? null : v.trim());

export default function FormProfil({
  profilId,
  email,
  bergabung,
  terverifikasi,
  awal,
  wilayah,
  usaha,
}: {
  profilId: string;
  email: string | null;
  bergabung: string | null;
  terverifikasi: boolean;
  awal: { nama: string; kota: string; telepon: string };
  /**
   * `null` kalau kolomnya belum ada di database — bagiannya disembunyikan,
   * dan kolom `Kota` teks yang lama dipakai sebagai gantinya.
   */
  wilayah: { kelurahan: string; kecamatan: string; kota: string } | null;
  /**
   * `null` kalau kolomnya belum ada di database — bagiannya disembunyikan
   * seluruhnya, karena formulir yang setiap simpanannya gagal lebih buruk
   * daripada formulir yang tidak ada.
   */
  usaha: { namaUsaha: string; npwp: string } | null;
}) {
  const router = useRouter();
  const [isi, setIsi] = useState({
    ...awal,
    namaUsaha: usaha?.namaUsaha ?? "",
    npwp: usaha?.npwp ?? "",
  });
  const [wil, setWil] = useState(
    wilayah ?? { kelurahan: "", kecamatan: "", kota: awal.kota }
  );
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState(false);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setKirim(true);
    setGalat(null);
    setTersimpan(false);

    const { error } = await klienBrowser()
      .from("profil")
      .update({
        nama: isi.nama.trim(),
        kota: wilayah ? wil.kota : isi.kota.trim(),
        ...(wilayah
          ? {
              kelurahan: kosongJadiNull(wil.kelurahan),
              kecamatan: kosongJadiNull(wil.kecamatan),
              // Koordinatnya dikosongkan supaya `/api/titik-saya` menghitung
              // ulang dari wilayah yang baru. Membiarkannya berarti pencarian
              // tetap mulai dari kota lama setelah orangnya pindah — kesalahan
              // yang tidak akan pernah ia hubungkan dengan formulir ini.
              lat: null,
              lng: null,
            }
          : {}),
        // Kolom ini nullable sejak 03: string kosong yang disimpan apa adanya
        // cuma memindahkan pemeriksaan "ada isinya atau tidak" ke setiap
        // tempat yang membacanya.
        telepon: isi.telepon.trim() === "" ? null : isi.telepon.trim(),
        ...(usaha
          ? {
              nama_usaha: kosongJadiNull(isi.namaUsaha),
              npwp: kosongJadiNull(isi.npwp),
            }
          : {}),
      })
      .eq("id", profilId);

    setKirim(false);
    if (error) {
      setGalat(error.message);
      return;
    }
    setTersimpan(true);
    router.refresh();
  };

  return (
    <form onSubmit={simpan} className="space-y-5">
      <Bagian judul="Identitas">
        <div className="sm:col-span-2">
          <Kolom
            id="nama"
            label="Nama"
            required
            value={isi.nama}
            onChange={(e) => setIsi((v) => ({ ...v, nama: e.target.value }))}
            bantuan="Yang dilihat host atau penyewa di pemesanan dan ulasan."
          />
        </div>
        {wilayah ? (
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium">Wilayah tempatmu tinggal</p>
            <PilihWilayah nilai={wil} onGanti={setWil} />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Dipakai sebagai titik awal pencarian ketika izin lokasi belum
              diberikan. Tidak pernah ditampilkan ke pihak lain.
            </p>
          </div>
        ) : (
          // Sebelum 16_wilayah_profil.sql, `kelurahan` dan `kecamatan` belum
          // ada kolomnya — tapi `kota` ada, dan ia tetap harus berasal dari
          // daftar yang sah.
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium">Kota</p>
            <PilihWilayah
              nilai={{ kelurahan: "", kecamatan: "", kota: isi.kota }}
              onGanti={(w) => setIsi((v) => ({ ...v, kota: w.kota }))}
              sampai="kabupaten"
            />
          </div>
        )}
        <Kolom
          id="telepon"
          label="Nomor HP"
          type="tel"
          value={isi.telepon}
          onChange={(e) => setIsi((v) => ({ ...v, telepon: e.target.value }))}
          placeholder="08xxxxxxxxxx"
          bantuan="Belum diverifikasi, dan hanya dibuka ke pihak lain setelah pembayaran."
        />
      </Bagian>

      {usaha && (
        <Bagian
          judul="Usaha (opsional)"
          keterangan="Isi kalau kamu menyewa untuk berdagang. Nama usaha ikut tertulis di berita acara serah terima, dan NPWP dipakai kalau kamu perlu bukti sewanya untuk pembukuan. Keduanya tidak pernah ditampilkan ke publik."
        >
          <Kolom
            id="nama_usaha"
            label="Nama usaha"
            value={isi.namaUsaha}
            onChange={(e) => setIsi((v) => ({ ...v, namaUsaha: e.target.value }))}
            placeholder="Toko Melati"
          />
          <Kolom
            id="npwp"
            label="NPWP"
            value={isi.npwp}
            onChange={(e) => setIsi((v) => ({ ...v, npwp: e.target.value }))}
            placeholder="00.000.000.0-000.000"
            bantuan="Hanya terlihat olehmu."
          />
        </Bagian>
      )}

      <section className="rounded-2xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-lg font-bold tracking-tight">Akun</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-3">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium">{email ?? "—"}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <dt className="text-muted">Bergabung</dt>
            <dd className="angka font-medium">
              {bergabung ? bulanTahun(bergabung) : "—"}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <dt className="text-muted">Verifikasi identitas</dt>
            <dd className="font-medium">
              {terverifikasi ? (
                <span className="inline-flex items-center gap-1.5 text-brand">
                  <BadgeCheck className="h-4 w-4" />
                  Terverifikasi
                </span>
              ) : (
                <span className="text-muted">Belum</span>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
          Email tidak bisa diganti dari sini — menggantinya berarti memverifikasi ulang
          alamat yang baru, dan alurnya belum dibangun. Verifikasi identitas menunggu
          vendor e-KYC; kami tidak menyimpan foto KTP di database sendiri.
        </p>
      </section>

      {galat && (
        <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">{galat}</p>
      )}
      {tersimpan && (
        <p className="rounded-xl bg-good-soft px-3.5 py-2.5 text-sm text-good">
          Perubahan tersimpan.
        </p>
      )}

      <button
        type="submit"
        disabled={kirim}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan perubahan
      </button>
    </form>
  );
}
