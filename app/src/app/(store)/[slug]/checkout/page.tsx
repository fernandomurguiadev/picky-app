import { notFound } from "next/navigation";
import { CheckoutPageClient } from "./_components/checkout-client";
import type { StorePublicData } from "@/lib/types/store";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * RSC wrapper: hidrata datos de la tienda en servidor y delega la interactividad
 * al componente cliente CheckoutPageClient.
 */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;

  const storeRes = await fetch(`${BACKEND_URL}/api/v1/stores/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!storeRes.ok) notFound();

  const storeJson = await storeRes.json();
  const store: StorePublicData = storeJson.data;

  return <CheckoutPageClient store={store} />;
}
