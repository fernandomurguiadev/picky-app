import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store/store-header";
import type { StorePublicData, StoreStatus } from "@/lib/types/store";

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;

  const [storeRes, statusRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}`, {
      next: { revalidate: 60 },
    }),
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/status`, {
      next: { revalidate: 30 },
    }),
  ]);

  if (!storeRes.ok) notFound();

  const storeJson = await storeRes.json();
  const statusJson: { data: StoreStatus } = statusRes.ok
    ? await statusRes.json()
    : { data: { isOpen: false } };

  const store: StorePublicData = storeJson.data;
  const { isOpen } = statusJson.data;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        "--color-primary": store.theme?.primaryColor ?? "#f97316",
        "--store-primary": store.theme?.primaryColor ?? "#f97316",
        "--store-accent": store.theme?.accentColor ?? "#fb923c",
      } as React.CSSProperties}
    >
      <StoreHeader store={store} isOpen={isOpen} />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Powered by PickyApp
      </footer>
    </div>
  );
}
