import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import ContratosClient from "./ContratosClient";

export const metadata: Metadata = { title: "Contratos" };

export default function ContratosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ContratosClient />
    </div>
  );
}
