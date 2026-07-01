import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import { MobileMenuProvider } from "@/context/MobileMenuContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const userName = session.name;
  const userInitial = session.name?.charAt(0).toUpperCase() ?? "U";
  const userRole = session.role;

  return (
    <MobileMenuProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar userName={userName} userRole={userRole} userInitial={userInitial} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  );
}
