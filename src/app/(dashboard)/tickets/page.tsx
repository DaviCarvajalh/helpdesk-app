import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import TicketsClient from "./TicketsClient";

export const metadata: Metadata = { title: "Tickets" };

export default function TicketsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <TicketsClient />
    </div>
  );
}
