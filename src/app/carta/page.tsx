import type { Metadata } from "next";
import MenuBookView from "@/views/MenuBookView";

export const metadata: Metadata = {
  title: "Carta Digital — Cinquenta & Seis",
  description:
    "Menu digital da Cinquenta & Seis. Hamburgueria e cervejaria em Fafe.",
};

export default function CartaPage() {
  return <MenuBookView />;
}
