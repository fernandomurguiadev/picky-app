"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import ProductFormPage from "@/components/admin/product-form";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import type { Product } from "@/lib/types/catalog";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin", "products", "detail", id],
    queryFn: async () => {
      const { data } = await apiBff.get<Product>(`/admin/products/${id}`);
      return data;
    },
  });

  if (isLoading) return <SkeletonLoader rows={8} columns={1} />;
  if (!product) return <p className="text-destructive">Producto no encontrado.</p>;

  return <ProductFormPage product={product} />;
}
