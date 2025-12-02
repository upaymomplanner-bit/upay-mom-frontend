import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72 h-full min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
