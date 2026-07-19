"use client";

import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, Receipt, Users, Package, ShoppingBag, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { DataCapNotice } from "@/components/ui/DataCapNotice";
import { fmt } from "@/lib/finance";
import { filterSales, filterPrevSales, calcKPIs, calcVariation, type Period } from "@/lib/bi/kpi";

export function KPIsTab() {
  const { sales, products, loadAll, salesTotalCount } = useAppStore();
  const [period, setPeriod] = useState<Period>("current");
  const [channel, setChannel] = useState("all");
  const [category, setCategory] = useState("all");

  const channels = useMemo(() => [...new Set(sales.map((s) => s.channel).filter(Boolean))] as string[], [sales]);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[], [products]);

  const curr = useMemo(() => calcKPIs(filterSales(sales, products, { period, channel, category })), [sales, products, period, channel, category]);
  const prev = useMemo(() => calcKPIs(filterPrevSales(sales, period)), [sales, period]);

  const cards = [
    { key: "income", label: "Ventas Totales", value: `$${fmt(curr.income)}`, curr: curr.income, prev: prev.income, icon: DollarSign, color: "#34c759" },
    { key: "profit", label: "Utilidad Bruta", value: `$${fmt(curr.profit)}`, curr: curr.profit, prev: prev.profit, icon: TrendingUp, color: "#5b8cf7" },
    { key: "avgTicket", label: "Ticket Promedio", value: `$${fmt(curr.avgTicket)}`, curr: curr.avgTicket, prev: prev.avgTicket, icon: Receipt, color: "#ff9f0a" },
    { key: "clients", label: "Clientes Únicos", value: curr.clients, curr: curr.clients, prev: prev.clients, icon: Users, color: "#8b60ff" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2.5 flex-wrap">
        <select className="input-field max-w-[180px]" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <option value="current">Mes actual</option>
          <option value="prev">Mes anterior</option>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="all">Todo el historial</option>
        </select>
        <select className="input-field max-w-[180px]" value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="all">Todos los canales</option>
          {channels.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-field max-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-ghost btn-sm" onClick={() => loadAll()}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {period === "all" && <DataCapNotice loaded={sales.length} total={salesTotalCount} label="ventas" />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => {
          const v = calcVariation(c.curr, c.prev);
          return (
            <div key={c.key} className="stat-card">
              <c.icon size={20} color={c.color} strokeWidth={1.8} className="mb-2" />
              <div className="text-[22px] font-bold" style={{ color: c.color, fontFamily: "var(--font-mono)" }}>{c.value}</div>
              <div className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>{c.label}</div>
              <span
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full mt-2"
                style={{
                  background: v.dir === "up" ? "var(--success-light)" : v.dir === "down" ? "var(--danger-light)" : "rgba(200,215,235,0.4)",
                  color: v.dir === "up" ? "#1a7a35" : v.dir === "down" ? "#c0281f" : "var(--ink-secondary)",
                }}
              >
                {v.dir === "up" ? "↑" : v.dir === "down" ? "↓" : "→"} {v.pct}% vs anterior
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <SecondaryCard icon={Package} label="Unidades Vendidas" value={curr.units} prev={prev.units} color="#5b8cf7" />
        <SecondaryCard icon={ShoppingBag} label="Transacciones" value={curr.count} prev={prev.count} color="#34c759" />
      </div>
    </div>
  );
}

function SecondaryCard({ icon: Icon, label, value, prev, color }: { icon: typeof Package; label: string; value: number; prev: number; color: string }) {
  const v = calcVariation(value, prev);
  return (
    <div className="stat-card">
      <Icon size={20} color={color} strokeWidth={1.8} className="mb-2" />
      <div className="text-[22px] font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
      <div className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>{label}</div>
      <span
        className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full mt-2"
        style={{
          background: v.dir === "up" ? "var(--success-light)" : v.dir === "down" ? "var(--danger-light)" : "rgba(200,215,235,0.4)",
          color: v.dir === "up" ? "#1a7a35" : v.dir === "down" ? "#c0281f" : "var(--ink-secondary)",
        }}
      >
        {v.dir === "up" ? "↑" : v.dir === "down" ? "↓" : "→"} {v.pct}% vs anterior
      </span>
    </div>
  );
}
