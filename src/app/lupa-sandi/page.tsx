import type { Metadata } from "next";
import FormLupaSandi from "./FormLupaSandi";

export const metadata: Metadata = { title: "Lupa sandi · Ada Tempat" };

export default function HalamanLupaSandi() {
  return <FormLupaSandi />;
}
