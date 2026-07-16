"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, Receipt, Users, RefreshCw, AlertOctagon, AlertTriangle, Info, ArrowRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAppStore } from "@/lib/store/useAppStore";
import { useBIStore } from "@/lib/store/useBIStore";
import { StatCard } from "@/components/ui/StatCard";
import { fmt } from "@/lib/finance";
import { filterSales, filterPrevSales, calcKPIs, calcVariation, type Period } from "@/lib/bi/kpi";

const CHANNEL_COLORS = ["#5b8cf7", "#34c759", "#ff9f0a", "#ff3b30", "#8b60ff", "#00bcd4"];
const SEVERITY_ICON = { critical: AlertOctagon, warning: AlertTriangle, info: Info };
const SEVERITY_COLOR = { critical: "var(--danger)", warning: "var(--warning)", info: "var(--accent)" };

export default function DashboardPage() {
  const { sales, products, clients, loadAll } = useAppStore();
  const { alerts, loadBI, generateAlerts } = useBIStore();
  const [period, setPeriod] = useState<Period>("current");

  useEffect(() => {
    loadBI();
  }, [loadBI]);

  // KPIs estilo BI, con variación % vs periodo anterior — mismo motor que Inteligencia de Negocios
  const curr = useMemo(() => calcKPIs(filterSales(sales, products, { period })), [sales, products, period]);
  const prev = useMemo(() => calcKPIs(filterPrevSales(sales, period)), [sales, period]);

  const inventoryValue = products.reduce((s, p) => s + p.cost * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;

  // Ventas de los últimos 7 días
  const weeklySales = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("es-VE", { weekday: "short", day: "2-digit" });
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));
      const total = sales
        .filter((s) => {
          const sd = new Date(s.created_at);
          return sd >= dayStart && sd <= dayEnd;
        })
        .reduce((s, v) => s + v.total_usd, 0);
      days.push({ label, total });
    }
    return days;
  }, [sales]);

  const channelDist = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const ch = s.channel || "Otro";
      map[ch] = (map[ch] || 0) + s.total_usd;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    sales.forEach((s) =>
      s.items.forEach((i) => {
        if (!map[i.name]) map[i.name] = { qty: 0, revenue: 0 };
        map[i.name].qty += i.qty;
        map[i.name].revenue += i.unitPrice * i.qty;
      })
    );
    return Object.entries(map)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);
  }, [sales]);

  const handleRefresh = async () => {
    await Promise.all([loadAll(), loadBI()]);
    await generateAlerts(products, sales);
  };

  const topAlerts = alerts.slice(0, 3);

  const kpiCards = [
    { key: "income", label: "Ventas", value: `$${fmt(curr.income)}`, curr: curr.income, prev: prev.income, icon: DollarSign, color: "#34c759" },
    { key: "profit", label: "Utilidad Bruta", value: `$${fmt(curr.profit)}`, curr: curr.profit, prev: prev.profit, icon: TrendingUp, color: "#5b8cf7" },
    { key: "count", label: "Ventas Realizadas", value: curr.count, curr: curr.count, prev: prev.count, icon: Receipt, color: "#ff9f0a" },
    { key: "clients", label: "Clientes Únicos", value: curr.clients, curr: curr.clients, prev: prev.clients, icon: Users, color: "#8b60ff" },
  ];

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Dashboard</h1>
          <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
            Vista general de tu negocio · en tiempo real
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="input-field max-w-[170px]" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="current">Mes actual</option>
            <option value="prev">Mes anterior</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="all">Todo el historial</option>
          </select>
          <button className="btn-primary btn-sm" onClick={handleRefresh}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPIs con variación % — mismo motor que Inteligencia de Negocios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((c) => {
          const v = calcVariation(Number(c.curr), Number(c.prev));
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

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} value={`$${fmt(inventoryValue)}`} label="Valor Inventario" color="#00bcd4" />
        <StatCard icon={Users} value={clients.length} label="Clientes Totales" color="#5b8cf7" />
      </div>

      {/* Resumen de alertas activas */}
      {topAlerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-secondary)" }}>
              🚨 Alertas activas ({alerts.length})
            </h3>
            <Link href="/admin/inteligencia" className="text-[12.5px] font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {topAlerts.map((a) => {
              const Icon = SEVERITY_ICON[a.severity];
              return (
                <div key={a.id} className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style={{ background: "rgba(240,245,255,0.6)" }}>
                  <Icon size={15} color={SEVERITY_COLOR[a.severity]} className="shrink-0" />
                  <span className="text-[12.5px] font-medium">{a.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lowStockCount > 0 && (
        <div className="card !py-3 !px-4 flex items-center gap-2 text-[13px]" style={{ color: "#9a5900", background: "var(--warning-light)", borderColor: "rgba(255,159,10,0.3)" }}>
          ⚠️ {lowStockCount} producto(s) con stock bajo — revisa el módulo de Inventario.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            📈 Ventas últimos 7 días
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySales}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `$${fmt(v)}`} />
                <Line type="monotone" dataKey="total" stroke="#5b8cf7" strokeWidth={2.5} dot={{ r: 4, fill: "#5b8cf7" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            🍩 Distribución de ingresos por canal
          </h3>
          <div className="h-[240px]">
            {channelDist.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelDist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {channelDist.map((_, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => `$${fmt(v)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[13px]" style={{ color: "var(--ink-muted)" }}>
                Aún no hay ventas registradas.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
          🏆 Top productos
        </h3>
        {topProducts.length ? (
          <div className="flex flex-col divide-y divide-black/5">
            {topProducts.map(([name, d], i) => (
              <div key={name} className="flex items-center gap-3 py-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 text-[14px] font-semibold">{name}</div>
                <div className="text-right">
                  <div className="font-mono font-bold" style={{ color: "var(--success)" }}>
                    ${fmt(d.revenue)}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    {d.qty} unidades
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-center py-6" style={{ color: "var(--ink-muted)" }}>
            Realiza ventas para ver el top de productos.
          </p>
        )}
      </div>
    </div>
  );
}
