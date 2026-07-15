"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { classifyTrend, getProductMonthlySales, TREND_META, type Trend } from "@/lib/bi/trends";

const MONTH_LABELS = ["Hace 2 m.", "Mes ant.", "Este mes"];

export function TendenciasTab() {
  const { products, sales } = useAppStore();
  const [trendFilter, setTrendFilter] = useState<Trend | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[], [products]);

  const enriched = useMemo(() => {
    return products
      .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
      .map((p) => {
        const monthly = getProductMonthlySales(sales, p.id);
        return { ...p, monthly, trend: classifyTrend(monthly) };
      })
      .filter((p) => trendFilter === "all" || p.trend === trendFilter);
  }, [products, sales, categoryFilter, trendFilter]);

  return (
    <div className="card">
      <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-secondary)" }}>
        📈 Análisis de Tendencias por Producto
      </h3>
      <p className="text-[12.5px] mb-4" style={{ color: "var(--ink-muted)" }}>
        Clasificación automática basada en los últimos 3 meses de ventas.
      </p>

      <div className="flex gap-2.5 flex-wrap mb-5">
        <select className="input-field max-w-[200px]" value={trendFilter} onChange={(e) => setTrendFilter(e.target.value as Trend | "all")}>
          <option value="all">Todas las tendencias</option>
          <option value="growth">🟢 Crecimiento</option>
          <option value="decline">🔴 Descenso</option>
          <option value="stagnant">⚫ Estancado</option>
          <option value="unstable">🟡 Inestable</option>
        </select>
        <select className="input-field max-w-[200px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {enriched.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>Sin productos para mostrar en este filtro.</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {enriched.map((p) => {
            const meta = TREND_META[p.trend];
            const maxV = Math.max(...p.monthly, 1);
            return (
              <div key={p.id} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(255,255,255,0.9)" }}>
                <div className="text-[13px] font-semibold mb-0.5 truncate">{p.name}</div>
                <div className="text-[11px] mb-2.5" style={{ color: "var(--ink-muted)" }}>{p.category || "—"}</div>
                <div className="flex gap-1.5 items-end mb-2.5" style={{ height: 56 }}>
                  {p.monthly.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[10px] font-mono" style={{ color: "var(--ink-muted)" }}>{v}</span>
                      <div
                        className="w-full rounded-t"
                        style={{ height: Math.max(Math.round((v / maxV) * 34), 3), background: meta.color }}
                      />
                      <span className="text-[9px] whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>{MONTH_LABELS[i]}</span>
                    </div>
                  ))}
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: p.trend === "growth" ? "var(--success-light)" : p.trend === "decline" ? "var(--danger-light)" : p.trend === "unstable" ? "var(--warning-light)" : "rgba(200,215,235,0.4)",
                    color: p.trend === "growth" ? "#1a7a35" : p.trend === "decline" ? "#c0281f" : p.trend === "unstable" ? "#9a5900" : "var(--ink-secondary)",
                  }}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
