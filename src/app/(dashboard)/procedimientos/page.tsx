import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import ProcedimientosClient from "./ProcedimientosClient";

export const metadata: Metadata = { title: "Procedimientos" };

export default function ProcedimientosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ProcedimientosClient />
    </div>
  );
}
