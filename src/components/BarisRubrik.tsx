import type { LucideIcon } from "lucide-react";

/**
 * Satu baris rubrik kondisi: ikon, apa yang diukur, dan jawabannya.
 *
 * `nada` menentukan warna jawaban. Sebagian besar baris netral; yang berwarna
 * hanya yang benar-benar memengaruhi keputusan — lembap, pernah banjir, kunci
 * dipegang host. Kalau semuanya diberi warna, tidak ada yang menonjol.
 */
export default function BarisRubrik({
  ikon: Ikon,
  label,
  nilai,
  nada = "netral",
}: {
  ikon: LucideIcon;
  label: string;
  nilai: string;
  nada?: "netral" | "baik" | "waspada";
}) {
  const warna =
    nada === "waspada" ? "text-warn" : nada === "baik" ? "text-good" : "text-ink";

  return (
    <div className="flex items-start gap-3 py-3">
      <Ikon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className={`text-sm font-medium ${warna}`}>{nilai}</dd>
      </div>
    </div>
  );
}
