import {
  Boxes,
  Car,
  Container,
  DoorClosed,
  House,
  Layers2,
  Store,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { TipeRuang } from "@/lib/ruang";

/**
 * Ikon per tipe ruang.
 *
 * Dipakai baris pemilih tipe dan lencana di kartu. Satu peta untuk keduanya
 * supaya "gudang" tidak pernah tampil dengan dua ikon berbeda di layar yang sama.
 */
export const IKON_TIPE: Record<TipeRuang, LucideIcon> = {
  kamar: DoorClosed,
  garasi: Car,
  gudang: Warehouse,
  lantai_ruko: Store,
  mezanin: Layers2,
  bawah_tangga: Boxes,
  loteng: House,
  kontainer: Container,
};
