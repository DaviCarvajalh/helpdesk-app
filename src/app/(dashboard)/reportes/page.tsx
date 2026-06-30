import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import ReportesClient from "./ReportesClient";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <ReportesClient />
    </div>
  );
}
