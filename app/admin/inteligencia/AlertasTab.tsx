"use client";

import { useState } from "react";
import { RefreshCw, CheckCheck, X, AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useBIStore } from "@/lib/store/useBIStore";
import { toast } from "@/lib/store/useToastStore";
import type { AlertSeverity, AlertType } from "@/lib/types";

const SEVERITY_ICON = { critical: AlertOctagon, warning: AlertTriangle, info: Info };
const SEVERITY_COLOR = { critical: "var(--danger)", warning: "var(--warning)", info: "var(--accent)" };

export function AlertasTab() {
  const { products, sales } = useAppStore();
  const { alerts, generateAlerts, dismissAlert, markAllRead } = useBIStore();
  const [severity, setSeverity] = useState<AlertSeverity | "all">("all");
  const [type, setType] = useState<AlertType | "all">("all");

  const filtered = alerts.filter((a) => (severity === "all" || a.severity === severity) && (type === "all" || a.type === type));

  const handleRegenerate = async () => {
    await generateAlerts(products, sales);
    toast("Alertas regeneradas", "success");
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast("Todas las alertas descartadas", "info");
  };

  return (
    <div className="card">
      <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
        🚨 Sistema de Alertas de Rendimiento
      </h3>

      <div className="flex gap-2.5 flex-wrap mb-5">
        <select className="input-field max-w-[190px]" value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity | "all")}>
          <option value="all">Todas las severidades</option>
          <option value="critical">🔴 Crítico</option>
          <option value="warning">🟡 Advertencia</option>
          <option value="info">🔵 Informativo</option>
        </select>
        <select className="input-field max-w-[200px]" value={type} onChange={(e) => setType(e.target.value as AlertType | "all")}>
          <option value="all">Todos los tipos</option>
          <option value="stock_low">📦 Stock bajo</option>
          <option value="kpi_below">📉 KPI bajo objetivo</option>
          <option value="trend_drop">📊 Tendencia negativa</option>
          <option value="goal_risk">🎯 Meta en riesgo</option>
        </select>
        <button className="btn-ghost btn-sm" onClick={handleRegenerate}>
          <RefreshCw size={14} /> Regenerar alertas
        </button>
        <button className="btn-ghost btn-sm" onClick={handleMarkAllRead}>
          <CheckCheck size={14} /> Marcar todas leídas
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10" style={{ color: "var(--ink-muted)" }}>
          <div className="text-[40px] mb-2">✅</div>
          Sin alertas para los filtros seleccionados.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((a) => {
            const Icon = SEVERITY_ICON[a.severity];
            return (
              <div
                key={a.id}
                className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
                style={{
                  background: a.severity === "critical" ? "var(--danger-light)" : a.severity === "warning" ? "var(--warning-light)" : "var(--accent-light)",
                  border: `1.5px solid ${SEVERITY_COLOR[a.severity]}33`,
                }}
              >
                <Icon size={16} color={SEVERITY_COLOR[a.severity]} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium">{a.message}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    {a.meta} · {new Date(a.triggered_at).toLocaleString("es-VE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <button onClick={() => dismissAlert(a.id)} aria-label="Descartar" style={{ color: "var(--ink-muted)" }}>
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
