import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";
import { klienServer } from "@/lib/supabase/server";
import { jumlahBelumDibaca } from "@/lib/notifikasi";
import { pesanBelumDibaca } from "@/lib/percakapan";

/**
 * Ikon pesan dan notifikasi beserta hitungannya.
 *
 * Dipisah dari `Header` supaya bisa dibungkus Suspense. Dua hitungan ini butuh
 * dua kueri ke Supabase, dan sebelumnya keduanya berada di jalur kritis: header
 * — dan karenanya seluruh halaman — menunggu keduanya selesai sebelum satu
 * piksel pun tampil. Padahal angka di lencana adalah hal paling tidak mendesak
 * di layar.
 *
 * Sekarang kerangkanya tampil lebih dulu dan angkanya menyusul.
 */
export default async function LencanaHeader() {
  const db = await klienServer();
  const [belumDibaca, pesanBaru] = await Promise.all([
    jumlahBelumDibaca(db),
    pesanBelumDibaca(db),
  ]);

  return (
    <>
      <TautanLencana
        href="/pesan"
        label="Pesan"
        jumlah={pesanBaru}
        ikon={<MessageCircle className="h-5 w-5" />}
      />
      <TautanLencana
        href="/notifikasi"
        label="Notifikasi"
        jumlah={belumDibaca}
        ikon={<Bell className="h-5 w-5" />}
      />
    </>
  );
}

/** Bentuk yang sama tanpa angka, dipakai selama hitungannya belum datang. */
export function LencanaKosong() {
  return (
    <>
      <TautanLencana
        href="/pesan"
        label="Pesan"
        jumlah={0}
        ikon={<MessageCircle className="h-5 w-5" />}
      />
      <TautanLencana
        href="/notifikasi"
        label="Notifikasi"
        jumlah={0}
        ikon={<Bell className="h-5 w-5" />}
      />
    </>
  );
}

function TautanLencana({
  href,
  label,
  jumlah,
  ikon,
}: {
  href: string;
  label: string;
  jumlah: number;
  ikon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={jumlah > 0 ? `${label}, ${jumlah} belum dibaca` : label}
      className="relative rounded-full p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
    >
      {ikon}
      {jumlah > 0 && (
        <span className="angka absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {jumlah > 9 ? "9+" : jumlah}
        </span>
      )}
    </Link>
  );
}
