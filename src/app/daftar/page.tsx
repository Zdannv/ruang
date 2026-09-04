import type { Metadata } from "next";
import FormDaftar from "./FormDaftar";

export const metadata: Metadata = { title: "Daftar — Ruang" };

export default function HalamanDaftar() {
  return <FormDaftar />;
}
