"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useBIStore } from "@/lib/store/useBIStore";
import { KPIsTab } from "./KPIsTab";
import { MetasTab } from "./MetasTab";
import { TendenciasTab } from "./TendenciasTab";
import { AlertasTab } from "./AlertasTab";
import { MarketingTab } from "./MarketingTab";
import { EstadisticasTab } from "./EstadisticasTab";

const TABS = [
  { id: "kpis", label: "📊 KPIs en Tiempo Real" },
  { id: "estadisticas", label: "📈 Estadísticas" },
  { id: "marketing", label: "📣 Marketing" },
  { id: "metas", label: "🎯 Metas" },
  { id: "tendencias", label: "📉 Tendencias" },
  { id: "alertas", label: "🚨 Alertas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function InteligenciaPage() {
  const [tab, setTab] = useState<TabId>("kpis");
  const loadBI = useBIStore((s) => s.loadBI);
  const { products, sales } = useAppStore();
  const generateAlerts = useBIStore((s) => s.generateAlerts);

  useEffect(() => {
    loadBI();
  }, [loadBI]);

  useEffect(() => {
    if (tab === "alertas") generateAlerts(products, sales);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Inteligencia de Negocios</h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          KPIs, estadísticas, marketing, metas, tendencias y alertas
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap" style={{ borderBottom: "2px solid rgba(200,215,235,0.3)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-[13.5px] font-semibold rounded-t-xl transition-all"
            style={{
              color: tab === t.id ? "var(--accent-dark)" : "var(--ink-muted)",
              background: tab === t.id ? "var(--accent-light)" : "transparent",
              borderBottom: tab === t.id ? "2.5px solid var(--accent)" : "2.5px solid transparent",
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "kpis" && <KPIsTab />}
      {tab === "estadisticas" && <EstadisticasTab />}
      {tab === "marketing" && <MarketingTab />}
      {tab === "metas" && <MetasTab />}
      {tab === "tendencias" && <TendenciasTab />}
      {tab === "alertas" && <AlertasTab />}
    </div>
  );
}
