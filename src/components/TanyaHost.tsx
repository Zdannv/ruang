"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { klienBrowser } from "@/lib/supabase/browser";
import { mulaiPercakapan } from "@/lib/percakapan";

/**
 * Membuka percakapan dengan host dari halaman detail ruang.
 *
 * Sengaja tidak menuntut tanggal atau manifes lebih dulu. Rubrik kondisi
 * menjawab banyak hal, tapi tidak menjawab "muat motor saya nggak" atau "boleh
 * lihat dulu" — dan memaksa orang mengisi formulir pemesanan hanya untuk
 * bertanya membuat sebagian besar dari mereka pergi, bukan memesan.
 */
export default function TanyaHost({ ruangId }: { ruangId: string }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const buka = async () => {
    setProses(true);
    setGalat(null);
    try {
      const id = await mulaiPercakapan(klienBrowser(), ruangId);
      router.push(`/pesan/${id}`);
    } catch (e: unknown) {
      setProses(false);
      const pesan = e instanceof Error ? e.message : "Gagal membuka percakapan.";
      // Belum masuk: antar ke halaman masuk dan kembalikan ke sini setelahnya,
      // bukan sekadar menampilkan galat yang tidak bisa ditindaklanjuti.
      if (pesan.toLowerCase().includes("masuk dulu")) {
        router.push(`/masuk?lanjut=/ruang/${ruangId}`);
        return;
      }
      // Fungsinya belum ada di database — sebutkan penyebabnya, bukan
      // "Could not find the function public.mulai_percakapan".
      if (pesan.toLowerCase().includes("could not find the function")) {
        setGalat(
          "Fitur pesan belum aktif di database ini. Migrasi 11_pesan_chat.sql " +
            "perlu dijalankan lebih dulu."
        );
        return;
      }
      setGalat(pesan);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={buka}
        disabled={proses}
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-card px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
      >
        {proses ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        Tanya host
      </button>
      {galat && <p className="mt-2 text-center text-xs text-warn">{galat}</p>}
    </>
  );
}
