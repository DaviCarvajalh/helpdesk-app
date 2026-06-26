import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import CredencialesClient from "./CredencialesClient";

export const metadata: Metadata = { title: "Credenciales" };

export default function CredencialesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <CredencialesClient />
    </div>
  );
}
