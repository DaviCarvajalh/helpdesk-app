import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import ConfiguracionClient from "./ConfiguracionClient";

export const metadata: Metadata = { title: "Configuración" };

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ConfiguracionClient />
    </div>
  );
}
