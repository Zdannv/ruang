import {
  Armchair,
  Boxes,
  Building2,
  Car,
  Container,
  DoorClosed,
  Fence,
  House,
  Layers2,
  Store,
  Trees,
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
  halaman_depan: Fence,
  lahan_kosong: Trees,
  teras: Armchair,
  kios: Store,
  kamar: DoorClosed,
  garasi: Car,
  gudang: Warehouse,
  lantai_ruko: Building2,
  mezanin: Layers2,
  bawah_tangga: Boxes,
  loteng: House,
  kontainer: Container,
};
