import Link from "next/link";
import Image from "next/image";
import { rupiah } from "@/lib/label";
import type { RuangSorotan } from "@/lib/ringkasan";

/**
 * Tumpukan foto ruang yang benar-benar tayang, untuk halaman depan.
 *
 * Menggantikan bidang warna besar yang dulu mengisi sisi kanan hero. Bidang
 * warna tidak memberi tahu apa pun; tiga ruang sungguhan dengan harganya
 * langsung menjawab pertanyaan pertama setiap pengunjung — ada apa saja di
 * sini, dan berapa harganya.
 *
 * Tidak ditampilkan sama sekali kalau fotonya belum ada. Bingkai kosong di
 * halaman depan lebih buruk daripada halaman depan satu kolom.
 */
export default function KolaseSorotan({ ruang }: { ruang: RuangSorotan[] }) {
  const berfoto = ruang.filter((r) => r.foto);
  if (berfoto.length === 0) return null;

  const [utama, ...sisa] = berfoto;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href={`/ruang/${utama.id}`}
        className="naik naik-hover group relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-line"
      >
        <Image
          src={utama.foto as string}
          alt={utama.judul}
          fill
          sizes="(min-width: 1024px) 460px, 100vw"
          className="object-cover"
          priority
        />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-4">
          <span className="block truncate text-sm font-semibold text-white">
            {utama.judul}
          </span>
          <span className="angka block text-xs text-white/80">
            {utama.kecamatan} · {rupiah(utama.harga_bulanan)}/bulan
          </span>
        </span>
      </Link>

      {sisa.slice(0, 2).map((r) => (
        <Link
          key={r.id}
          href={`/ruang/${r.id}`}
          className="naik naik-hover group relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-line"
        >
          <Image
            src={r.foto as string}
            alt={r.judul}
            fill
            sizes="(min-width: 1024px) 230px, 50vw"
            className="object-cover"
          />
          <span className="angka absolute bottom-2 left-2 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
            {rupiah(r.harga_bulanan)}
          </span>
        </Link>
      ))}
    </div>
  );
}
