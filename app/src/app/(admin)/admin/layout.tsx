import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { AdminMobileHeader } from "@/components/admin/mobile-header";
import { AuthInitializer } from "@/components/admin/auth-initializer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthInitializer>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-auto flex flex-col">
          <AdminMobileHeader />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8 flex-1 w-full">{children}</div>
        </main>
        <AdminMobileNav />
      </div>
    </AuthInitializer>
  );
}
