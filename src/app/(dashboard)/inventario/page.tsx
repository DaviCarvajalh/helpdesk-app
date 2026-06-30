import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import InventarioClient from "./InventarioClient";

export const metadata: Metadata = { title: "Inventario TI" };

export default function InventarioPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <InventarioClient />
    </div>
  );
}
