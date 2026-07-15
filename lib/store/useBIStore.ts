import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Alert, AlertSeverity, AlertType, Goal, GoalKpi, Product, Sale } from "@/lib/types";
import { getKpiValueForMonth } from "@/lib/bi/kpi";
import { classifyTrend, getProductMonthlySales } from "@/lib/bi/trends";

interface BIState {
  goals: Goal[];
  alerts: Alert[];
  loading: boolean;

  loadBI: () => Promise<void>;
  saveGoal: (input: { kpi: GoalKpi; period: string; target: number }) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  /** Recalcula todas las alertas automáticas y las reemplaza en la base — igual que generateAlerts() */
  generateAlerts: (products: Product[], sales: Sale[]) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useBIStore = create<BIState>((set, get) => ({
  goals: [],
  alerts: [],
  loading: true,

  loadBI: async () => {
    const supabase = createClient();
    set({ loading: true });
    const [goals, alerts] = await Promise.all([
      supabase.from("goals").select("*").order("created_at", { ascending: false }),
      supabase.from("alerts").select("*").order("triggered_at", { ascending: false }),
    ]);
    set({
      goals: (goals.data ?? []) as Goal[],
      alerts: (alerts.data ?? []) as Alert[],
      loading: false,
    });
  },

  saveGoal: async ({ kpi, period, target }) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("goals")
      .upsert({ kpi, period, target }, { onConflict: "kpi,period" })
      .select()
      .single();
    if (data) {
      const g = data as Goal;
      set({ goals: [g, ...get().goals.filter((x) => !(x.kpi === g.kpi && x.period === g.period))] });
    }
  },

  deleteGoal: async (id) => {
    const supabase = createClient();
    await supabase.from("goals").delete().eq("id", id);
    set({ goals: get().goals.filter((g) => g.id !== id) });
  },

  generateAlerts: async (products, sales) => {
    const supabase = createClient();
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const completedSales = sales.filter((s) => s.status === "completed");

    type NewAlert = Omit<Alert, "id" | "triggered_at" | "read">;
    const newAlerts: NewAlert[] = [];

    // 1. Stock bajo / sin stock
    products.forEach((p) => {
      if (p.stock === 0) {
        newAlerts.push({
          type: "stock_low" as AlertType,
          severity: "critical" as AlertSeverity,
          message: `Sin stock: ${p.name}`,
          meta: `SKU: ${p.sku || "—"} · Categoría: ${p.category || "—"}`,
          filters: { product: p.id, category: p.category || null },
          auto_generated: true,
        });
      } else if (p.stock <= p.min_stock) {
        newAlerts.push({
          type: "stock_low",
          severity: "warning",
          message: `Stock bajo: ${p.name} (${p.stock} uds, mín: ${p.min_stock})`,
          meta: `SKU: ${p.sku || "—"} · Categoría: ${p.category || "—"}`,
          filters: { product: p.id, category: p.category || null },
          auto_generated: true,
        });
      }
    });

    // 2. Metas en riesgo (mes actual)
    get()
      .goals.filter((g) => g.period === curMonth)
      .forEach((g) => {
        const curr = getKpiValueForMonth(sales, g.kpi, g.period);
        const pct = (curr / g.target) * 100;
        if (pct < 50) {
          newAlerts.push({
            type: "goal_risk",
            severity: "critical",
            message: `Meta en riesgo: ${g.kpi} — ${pct.toFixed(0)}% completado`,
            meta: `Objetivo: ${g.target} · Actual: ${curr.toFixed(2)}`,
            filters: null,
            auto_generated: true,
          });
        } else if (pct < 80) {
          newAlerts.push({
            type: "goal_risk",
            severity: "warning",
            message: `Meta por debajo del 80%: ${g.kpi} — ${pct.toFixed(0)}%`,
            meta: `Objetivo: ${g.target} · Actual: ${curr.toFixed(2)}`,
            filters: null,
            auto_generated: true,
          });
        }
      });

    // 3. Tendencia negativa
    products.forEach((p) => {
      const monthly = getProductMonthlySales(sales, p.id);
      if (classifyTrend(monthly) === "decline" && monthly[monthly.length - 1] > 0) {
        newAlerts.push({
          type: "trend_drop",
          severity: "warning",
          message: `Tendencia negativa: ${p.name}`,
          meta: `Ventas: ${monthly.join(" → ")} uds · Cat: ${p.category || "—"}`,
          filters: { product: p.id, category: p.category || null },
          auto_generated: true,
        });
      }
    });

    // 4. Sin movimiento >30 días con stock
    products
      .filter((p) => p.stock > 0)
      .forEach((p) => {
        const lastSale = [...completedSales].reverse().find((s) => s.items.some((i) => i.productId === p.id));
        const daysSince = lastSale ? Math.floor((now.getTime() - new Date(lastSale.created_at).getTime()) / 86400000) : 999;
        if (daysSince > 30) {
          newAlerts.push({
            type: "kpi_below",
            severity: "info",
            message: `Sin movimiento: ${p.name} — ${daysSince > 900 ? "nunca vendido" : daysSince + " días sin venta"}`,
            meta: `Stock actual: ${p.stock} uds · Valor inmovilizado: $${(p.cost * p.stock).toFixed(2)}`,
            filters: { product: p.id, category: p.category || null },
            auto_generated: true,
          });
        }
      });

    // Reemplazar solo las auto-generadas, conservar las manuales
    await supabase.from("alerts").delete().eq("auto_generated", true);
    if (newAlerts.length) {
      await supabase.from("alerts").insert(newAlerts);
    }
    await get().loadBI();
  },

  dismissAlert: async (id) => {
    const supabase = createClient();
    await supabase.from("alerts").delete().eq("id", id);
    set({ alerts: get().alerts.filter((a) => a.id !== id) });
  },

  markAllRead: async () => {
    const supabase = createClient();
    await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    set({ alerts: [] });
  },
}));
