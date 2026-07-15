import type { Product, Sale } from "@/lib/types";

export type Period = "current" | "prev" | "7d" | "30d" | "all";

function inMonth(date: Date, ref: Date, offsetMonths: number) {
  const target = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths, 1);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
}

/** Filtra ventas completadas por periodo, canal y categoría — igual que getSalesInPeriod() */
export function filterSales(
  sales: Sale[],
  products: Product[],
  opts: { period: Period; channel?: string; category?: string }
): Sale[] {
  const now = new Date();
  let result = sales.filter((s) => s.status === "completed");

  result = result.filter((s) => {
    const d = new Date(s.created_at);
    if (opts.period === "current") return inMonth(d, now, 0);
    if (opts.period === "prev") return inMonth(d, now, -1);
    if (opts.period === "7d") return now.getTime() - d.getTime() <= 7 * 86400000;
    if (opts.period === "30d") return now.getTime() - d.getTime() <= 30 * 86400000;
    return true; // 'all'
  });

  if (opts.channel && opts.channel !== "all") {
    result = result.filter((s) => s.channel === opts.channel);
  }
  if (opts.category && opts.category !== "all") {
    result = result.filter((s) =>
      s.items.some((i) => products.find((p) => p.id === i.productId)?.category === opts.category)
    );
  }
  return result;
}

/** El periodo "anterior" comparable, para calcular variación % — igual que getSalesInPrevPeriod() */
export function filterPrevSales(sales: Sale[], period: Period): Sale[] {
  const now = new Date();
  const completed = sales.filter((s) => s.status === "completed");

  if (period === "current") {
    return completed.filter((s) => inMonth(new Date(s.created_at), now, -1));
  }
  if (period === "7d") {
    return completed.filter((s) => {
      const diff = now.getTime() - new Date(s.created_at).getTime();
      return diff > 7 * 86400000 && diff <= 14 * 86400000;
    });
  }
  if (period === "30d") {
    return completed.filter((s) => {
      const diff = now.getTime() - new Date(s.created_at).getTime();
      return diff > 30 * 86400000 && diff <= 60 * 86400000;
    });
  }
  return [];
}

export interface KpiSummary {
  income: number;
  cost: number;
  profit: number;
  units: number;
  clients: number;
  count: number;
  avgTicket: number;
}

export function calcKPIs(sales: Sale[]): KpiSummary {
  const income = sales.reduce((s, v) => s + v.total_usd, 0);
  const cost = sales.reduce((s, v) => s + v.cost_usd, 0);
  const profit = income - cost;
  const units = sales.reduce((s, v) => s + v.items.reduce((a, i) => a + i.qty, 0), 0);
  const clientSet = new Set(sales.map((s) => s.client_name).filter(Boolean));
  const avgTicket = sales.length > 0 ? income / sales.length : 0;
  return { income, cost, profit, units, clients: clientSet.size, count: sales.length, avgTicket };
}

export function calcVariation(curr: number, prev: number): { pct: string; dir: "up" | "down" | "flat" } {
  if (prev === 0 && curr === 0) return { pct: "0", dir: "flat" };
  if (prev === 0) return { pct: "100", dir: "up" };
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return { pct: Math.abs(pct).toFixed(1), dir: pct > 2 ? "up" : pct < -2 ? "down" : "flat" };
}

/** Valor actual de un KPI para un periodo YYYY-MM dado — usado por Metas y Alertas */
export function getKpiValueForMonth(sales: Sale[], kpi: "sales" | "profit" | "clients" | "avgTicket" | "units", period: string): number {
  const [y, m] = period.split("-").map(Number);
  const monthSales = sales.filter((s) => {
    if (s.status !== "completed") return false;
    const d = new Date(s.created_at);
    return d.getFullYear() === y && d.getMonth() === m - 1;
  });
  const k = calcKPIs(monthSales);
  return { sales: k.income, profit: k.profit, clients: k.clients, avgTicket: k.avgTicket, units: k.units }[kpi];
}
