import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea centavos a pesos con símbolo $ */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/** Convierte pesos (UI) a centavos (backend) */
export function tosCents(pesos: number): number {
  return Math.round(pesos * 100);
}

/** Convierte centavos (backend) a pesos (UI) */
export function fromCents(cents: number): number {
  return cents / 100;
}
