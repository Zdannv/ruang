import Image from "next/image";
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
  const banjirWaspada = banjirPerluPerhatian(ruang.riwayat_banjir);

  return (
    /* TODO(langkah 2): bungkus dengan <Link href={`/ruang/${ruang.id}`}>
       begitu halaman detail ada. Sekarang belum, supaya tidak ada tautan
       yang mendarat di 404 saat demo. */
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-line">
        {ruang.foto ? (
          <Image
            src={ruang.foto}
            alt={`Foto ${ruang.judul}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            Belum ada foto
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
          {LABEL_TIPE[ruang.tipe]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink">{ruang.judul}</h3>

        <p className="angka mt-1 text-xs text-muted">
          {ruang.kecamatan}, {ruang.kota} · {jarak(ruang.jarak_km)} dari titikmu
        </p>

        <p className="angka mt-3 text-base font-bold text-ink">
          {rupiah(ruang.harga_bulanan)}
          <span className="text-xs font-medium text-muted"> / bulan</span>
        </p>
        <p className="angka text-xs text-muted">{volume(ruang.volume_m3)}</p>

        <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3 text-[11px]">
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
                : "rounded-full bg-paper px-2 py-1 font-medium text-muted"
            }
          >
            {LABEL_BANJIR[ruang.riwayat_banjir]}
          </li>
        </ul>
      </div>
    </article>
  );
}
