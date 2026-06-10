import { PlatformAuthInitializer } from "@/components/platform/platform-auth-initializer";
import { PlatformSidebar } from "@/components/platform/platform-sidebar";

export default function PlatformAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlatformAuthInitializer>
      <div className="flex min-h-screen bg-background">
        <PlatformSidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </PlatformAuthInitializer>
  );
}
