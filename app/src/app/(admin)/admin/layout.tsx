import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
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
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">{children}</div>
        </main>
        <AdminMobileNav />
      </div>
    </AuthInitializer>
  );
}
