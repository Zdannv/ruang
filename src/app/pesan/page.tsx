import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { sesiSaya } from "@/lib/auth";
import { klienServer } from "@/lib/supabase/server";
import { daftarPercakapan, type PercakapanRingkas } from "@/lib/percakapan";
import { tabelBelumAda } from "@/lib/galat";
import MigrasiKurang from "@/components/MigrasiKurang";
import { tanggalPendek } from "@/lib/label";

export const metadata: Metadata = { title: "Pesan — Ruang" };

export default async function HalamanPesan() {
  const sesi = await sesiSaya();
  if (!sesi) redirect("/masuk?lanjut=/pesan");

  const db = await klienServer();

  let daftar: PercakapanRingkas[];
  try {
    daftar = await daftarPercakapan(db);
  } catch (e: unknown) {
    // Migrasi dijalankan tangan dan terpisah dari deploy, jadi "kode sudah
    // tayang, tabelnya belum ada" pasti terjadi lagi. Sebutkan berkasnya
    // alih-alih melempar dan berakhir di layar 500 tanpa penjelasan.
    if (tabelBelumAda(e)) {
      return (
        <MigrasiKurang
          fitur="Pesan"
          berkas={["11_pesan_chat.sql", "12_balasan_cepat.sql"]}
        />
      );
    }
    throw e;
  }

  const sayaId = sesi.profil?.id ?? null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Pesan</h1>
      <p className="mt-1.5 text-sm text-muted">
        Tanya-jawab dengan host sebelum memesan, dan lanjutannya setelah memesan —
        satu utas per ruang.
      </p>

      {daftar.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-line bg-card p-10 text-center">
          <MessagesSquare className="h-8 w-8 text-muted" />
          <p className="text-sm font-semibold">Belum ada percakapan</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            Buka salah satu ruang lalu tekan &ldquo;Tanya host&rdquo; kalau ada yang
            belum terjawab di halaman detailnya.
          </p>
          <Link
            href="/cari"
            className="mt-1 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Cari ruang
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {daftar.map((c) => {
            const sayaHost = sayaId === c.host_id;
            return (
              <li key={c.id}>
                <Link
                  href={`/pesan/${c.id}`}
                  className="naik naik-hover flex gap-3 rounded-2xl border border-line bg-card p-3"
                >
                  <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-line">
                    {c.foto && (
                      <Image src={c.foto} alt="" fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{c.judul}</p>
                      {c.belum_dibaca > 0 && (
                        <span className="angka shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                          {c.belum_dibaca}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted">
                      {sayaHost ? "Sebagai host" : `Host: ${c.host_nama}`}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {c.pesan_terakhir ?? "Belum ada pesan"}
                    </p>
                  </div>
                  <p className="angka shrink-0 text-xs text-muted">
                    {tanggalPendek(c.pesan_terakhir_pada)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
