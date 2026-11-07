import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(1) + "k";
  }
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}

