export interface ProfitabilityByProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number; // centavos
  cost: number; // centavos
  grossMargin: number; // centavos
  marginPercent: number;
  unitsMissingCost: number;
}

export interface PeriodComparison {
  revenueChangePercent: number | null;
  costChangePercent: number | null;
  grossMarginChangePercent: number | null;
}

export interface ProfitabilitySummary {
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
  byProduct: ProfitabilityByProduct[];
  comparison: PeriodComparison;
}

export interface ProfitabilityQueryParams {
  from: string;
  to: string;
  categoryId?: string;
  productId?: string;
}
