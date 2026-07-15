import type { Sale } from "@/lib/types";

export type Trend = "growth" | "decline" | "stagnant" | "unstable";

/** Unidades vendidas de un producto en los últimos 3 meses — igual que getProductMonthlySales() */
export function getProductMonthlySales(sales: Sale[], productId: string): number[] {
  const now = new Date();
  const months: number[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const total = sales
      .filter((s) => s.status === "completed")
      .filter((s) => {
        const sd = new Date(s.created_at);
        return sd.getFullYear() === y && sd.getMonth() === m;
      })
      .reduce((sum, s) => sum + (s.items.find((it) => it.productId === productId)?.qty || 0), 0);
    months.push(total);
  }
  return months;
}

/** Clasifica la tendencia según los últimos 3 meses — igual que classifyTrend() */
export function classifyTrend(monthlySales: number[]): Trend {
  if (monthlySales.length < 2) return "stagnant";
  const last3 = monthlySales.slice(-3);
  const avg = last3.reduce((s, v) => s + v, 0) / last3.length;
  if (avg === 0) return "stagnant";

  const std = Math.sqrt(last3.reduce((s, v) => s + (v - avg) ** 2, 0) / last3.length);
  const cv = std / avg;
  if (cv > 0.5) return "unstable";

  const firstHalf = last3.slice(0, Math.floor(last3.length / 2)).reduce((s, v) => s + v, 0) || 0.001;
  const secondHalf = last3.slice(Math.floor(last3.length / 2)).reduce((s, v) => s + v, 0) || 0;
  const ratio = secondHalf / firstHalf;
  if (ratio >= 1.15) return "growth";
  if (ratio <= 0.85) return "decline";
  return "stagnant";
}

export const TREND_META: Record<Trend, { label: string; className: string; color: string }> = {
  growth: { label: "🟢 Crecimiento", className: "growth", color: "var(--success)" },
  decline: { label: "🔴 Descenso", className: "decline", color: "var(--danger)" },
  stagnant: { label: "⚫ Estancado", className: "stagnant", color: "rgba(154,163,181,0.8)" },
  unstable: { label: "🟡 Inestable", className: "unstable", color: "var(--warning)" },
};
