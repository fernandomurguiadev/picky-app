"use client";

import { useQuery } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import type { ProfitabilitySummary, ProfitabilityQueryParams } from "@/lib/types/reports";

export const reportsKeys = {
  all: ["admin", "reports"] as const,
  profitability: (params: ProfitabilityQueryParams) =>
    [...reportsKeys.all, "profitability", params] as const,
};

export function useProfitability(params: ProfitabilityQueryParams) {
  return useQuery({
    queryKey: reportsKeys.profitability(params),
    queryFn: async () => {
      const { data } = await apiBff.get<{ data: ProfitabilitySummary }>(
        "/admin/reports/profitability",
        { params }
      );
      return data.data;
    },
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      // 403 (sin feature ANALYTICS o rol no admin) no se reintenta — es un estado, no un error transitorio
      if (status === 403) return false;
      return failureCount < 3;
    },
  });
}
