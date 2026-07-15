"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useBIStore } from "@/lib/store/useBIStore";
import { getKpiValueForMonth } from "@/lib/bi/kpi";
import { toast } from "@/lib/store/useToastStore";
import type { GoalKpi } from "@/lib/types";

const KPI_LABELS: Record<GoalKpi, string> = {
  sales: "💰 Ventas (USD)",
  profit: "📈 Utilidad (USD)",
  clients: "👥 Clientes únicos",
  avgTicket: "🧾 Ticket promedio (USD)",
  units: "📦 Unidades",
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MetasTab() {
  const sales = useAppStore((s) => s.sales);
  const { goals, saveGoal, deleteGoal } = useBIStore();
  const [kpi, setKpi] = useState<GoalKpi>("sales");
  const [period, setPeriod] = useState(currentMonth());
  const [target, setTarget] = useState("");

  const handleSave = async () => {
    const t = parseFloat(target);
    if (!period || isNaN(t) || t <= 0) {
      toast("Completa todos los campos de la meta", "warning");
      return;
    }
    await saveGoal({ kpi, period, target: t });
    toast("Meta guardada", "success");
    setTarget("");
  };

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
    toast("Meta eliminada", "info");
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
          🎯 Definir Meta Mensual
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>KPI</label>
            <select className="input-field" value={kpi} onChange={(e) => setKpi(e.target.value as GoalKpi)}>
              {(Object.keys(KPI_LABELS) as GoalKpi[]).map((k) => <option key={k} value={k}>{KPI_LABELS[k]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Mes objetivo</label>
            <input type="month" className="input-field" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Objetivo</label>
            <input type="number" step="0.01" className="input-field" placeholder="Ej: 5000" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <button className="btn-primary btn-sm" onClick={handleSave}>+ Agregar meta</button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
          📋 Cumplimiento vs Objetivo
        </h3>
        {goals.length === 0 ? (
          <p className="text-[13px] py-2" style={{ color: "var(--ink-muted)" }}>Aún no hay metas definidas. Agrega una arriba.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((g) => {
              const curr = getKpiValueForMonth(sales, g.kpi, g.period);
              const pct = Math.min((curr / g.target) * 100, 100);
              const barColor = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--accent)" : "var(--danger)";
              const icon = pct >= 100 ? "🏆" : pct >= 80 ? "🎯" : pct >= 50 ? "📊" : "⚠️";
              const isCount = g.kpi === "clients" || g.kpi === "units";
              return (
                <div key={g.id} className="rounded-xl px-3.5 py-3" style={{ background: "rgba(240,245,255,0.7)", border: "1.5px solid rgba(200,215,235,0.4)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[13.5px] font-semibold">{icon} {KPI_LABELS[g.kpi]} — {g.period}</div>
                      <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                        Objetivo: {isCount ? g.target : `$${fmt2(g.target)}`} · Actual: {isCount ? curr.toFixed(0) : `$${fmt2(curr)}`}
                      </div>
                    </div>
                    <button className="btn-ghost btn-xs" onClick={() => handleDelete(g.id)}><Trash2 size={12} /></button>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(200,215,235,0.25)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <div className="text-[11px] font-bold mt-1" style={{ color: "var(--ink-secondary)" }}>{pct.toFixed(1)}% completado</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fmt2(n: number) {
  return n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
