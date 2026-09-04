import { LABEL_STATUS, nadaStatus } from "@/lib/label";

/** Lencana status pemesanan. Warnanya mengikuti `nadaStatus`. */
export default function LencanaStatus({ status }: { status: string }) {
  const nada = nadaStatus(status);
  const kelas =
    nada === "baik"
      ? "bg-good-soft text-good"
      : nada === "waspada"
        ? "bg-warn-soft text-warn"
        : nada === "proses"
          ? "bg-brand-soft text-brand-dark"
          : "bg-paper text-muted";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${kelas}`}>
      {LABEL_STATUS[status] ?? status}
    </span>
  );
}
