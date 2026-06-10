import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatCurrency, toCents, fromCents } from "./utils/currency";

/** @deprecated usar toCents */
export { toCents as tosCents } from "./utils/currency";
