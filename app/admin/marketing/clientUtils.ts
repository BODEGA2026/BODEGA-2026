import type { Client } from "@/lib/types";

/** Un cliente se considera activo si compró en los últimos 90 días — igual que el original */
export function isActiveClient(c: Client): boolean {
  if (!c.last_purchase) return false;
  return Date.now() - new Date(c.last_purchase).getTime() < 90 * 86400000;
}
