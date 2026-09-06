"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Images, SlidersHorizontal } from "lucide-react";
import FormRuang from "@/components/host/FormRuang";
import KelolaFoto from "@/components/host/KelolaFoto";

/**
 * Alur daftar ruang: keterangan dulu, foto kemudian, di satu halaman.
 *
 * Sebelumnya halaman ini cuma berisi formulirnya, dan fotonya baru bisa
 * diunggah setelah host menemukan sendiri jalan kembali ke ruang yang barusan
 * ia buat. Halamannya bahkan menjelaskan kenapa — "karena keduanya menempel ke
 * ruang yang sudah punya id" — yaitu alasan teknis yang tidak ada gunanya
 * diketahui host, dan tidak mengubah kenyataan bahwa ruang tanpa foto hampir
 * tidak pernah diklik.
 *
 * Urutannya memang tidak bisa dibalik: foto butuh id ruangnya, baik untuk
 * jalur berkas di Storage maupun untuk baris `ruang_foto`. Yang bisa diubah
 * adalah siapa yang menanggung kendala itu — sekarang halamannya, bukan host.
 *
 * Ruangnya sudah benar-benar tersimpan begitu langkah dua muncul. Host yang
 * menutup tab di tengah jalan tidak kehilangan apa pun; ruangnya menunggu di
 * dasbor sebagai draf.
 */
export default function DaftarRuangBaru({ hostId }: { hostId: string }) {
  const [ruangId, setRuangId] = useState<string | null>(null);

  const lanjutKeFoto = (id: string) => {
    setRuangId(id);
    // Formulir langkah satu panjang, dan tombolnya ada di paling bawah. Tanpa
    // ini host mendarat di ruang kosong bekas ujung formulir dan mengira
    // tombolnya tidak melakukan apa-apa.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ol className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <Langkah nomor={1} label="Keterangan ruang" ikon={SlidersHorizontal} keadaan={ruangId ? "selesai" : "aktif"} />
        <span aria-hidden className="h-px w-6 bg-line" />
        <Langkah nomor={2} label="Foto" ikon={Images} keadaan={ruangId ? "aktif" : "nanti"} />
      </ol>

      {ruangId === null ? (
        <div className="mt-6">
          <FormRuang hostId={hostId} onDibuat={lanjutKeFoto} />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <p className="rounded-xl bg-good-soft px-3.5 py-2.5 text-sm text-good">
            Ruangnya tersimpan sebagai draf. Sekarang fotonya.
          </p>

          <KelolaFoto hostId={hostId} ruangId={ruangId} awal={[]} />

          <div className="rounded-2xl bg-card p-5 ring-1 ring-line">
            <p className="text-sm font-semibold">Sudah cukup fotonya?</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Langkah berikutnya — jendela akses dan menayangkan ruangnya — ada di
              halaman ruang. Kamu bisa ke sana sekarang atau nanti; semua yang di
              atas sudah tersimpan.
            </p>
            <Link
              href={`/host/ruang/${ruangId}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Selesai, buka halaman ruang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function Langkah({
  nomor,
  label,
  ikon: Ikon,
  keadaan,
}: {
  nomor: number;
  label: string;
  ikon: React.ComponentType<{ className?: string }>;
  keadaan: "selesai" | "aktif" | "nanti";
}) {
  const selesai = keadaan === "selesai";
  const aktif = keadaan === "aktif";
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={`angka flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          selesai
            ? "bg-good-soft text-good"
            : aktif
              ? "bg-brand text-white"
              : "bg-line text-muted"
        }`}
      >
        {selesai ? <Check className="h-3.5 w-3.5" /> : nomor}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 font-semibold ${
          aktif ? "text-ink" : "text-muted"
        }`}
      >
        <Ikon className="h-4 w-4" />
        {label}
      </span>
    </li>
  );
}
