import Image from "next/image";
import { MapPin } from "lucide-react";
import { IKON_TIPE } from "@/components/IkonTipe";
import type { RuangDenganFoto } from "@/lib/ruang";
import {
  LABEL_AKSES,
  LABEL_BANJIR,
  LABEL_PENGUNCIAN,
  LABEL_TIPE,
  banjirPerluPerhatian,
  jarak,
  rupiah,
  volume,
} from "@/lib/label";

/**
 * Satu ruang di daftar hasil.
 *
 * Yang ditampilkan berhenti di kecamatan — alamat lengkap baru terbuka setelah
 * jadwal survei disetujui host (keterbukaan tingkat 2). Jaraknya tetap persis,
 * karena itu justru bagian yang paling menentukan saat memilih.
 *
 * Tiga baris rubrik di bawah kartu bukan hiasan: akses masuk, penguncian, dan
 * riwayat banjir adalah tiga hal yang paling sering membatalkan sewa setelah
 * orang datang melihat. Menaruhnya di kartu berarti pembatalannya terjadi
 * sebelum siapa pun berangkat.
 */
export default function KartuRuang({ ruang }: { ruang: RuangDenganFoto }) {
  const Ikon = IKON_TIPE[ruang.tipe];
  const banjirWaspada = banjirPerluPerhatian(ruang.riwayat_banjir);

  return (
    /* TODO(langkah 2): bungkus dengan <Link href={`/ruang/${ruang.id}`}>
       begitu halaman detail ada. Sekarang belum, supaya tidak ada tautan
       yang mendarat di 404 saat demo. */
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-line transition-shadow hover:shadow-lg hover:shadow-ink/5">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
        {ruang.foto ? (
          <Image
            src={ruang.foto}
            alt={`Foto ${ruang.judul}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            Belum ada foto
          </div>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur">
          <Ikon className="h-3.5 w-3.5 text-brand" />
          {LABEL_TIPE[ruang.tipe]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">{ruang.judul}</h3>

        <p className="angka mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {ruang.kecamatan} · {jarak(ruang.jarak_km)}
        </p>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="angka text-lg font-bold leading-none text-ink">
            {rupiah(ruang.harga_bulanan)}
            <span className="block pt-1 text-xs font-medium text-muted">per bulan</span>
          </p>
          <span className="angka rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-ink">
            {volume(ruang.volume_m3)}
          </span>
        </div>

        <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3 text-[11px]">
          <li className="rounded-full bg-brand-soft px-2 py-1 font-medium text-brand-dark">
            {LABEL_AKSES[ruang.akses_masuk]}
          </li>
          <li className="rounded-full bg-paper px-2 py-1 font-medium text-muted">
            {LABEL_PENGUNCIAN[ruang.penguncian]}
          </li>
          <li
            className={
              banjirWaspada
                ? "rounded-full bg-warn-soft px-2 py-1 font-medium text-warn"
                : "rounded-full bg-good-soft px-2 py-1 font-medium text-good"
            }
          >
            {LABEL_BANJIR[ruang.riwayat_banjir]}
          </li>
        </ul>
      </div>
    </article>
  );
}
