import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import ConocimientoClient from "./ConocimientoClient";

export const metadata: Metadata = { title: "Base de Conocimiento" };

export default function ConocimientoPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ConocimientoClient />
    </div>
  );
}
