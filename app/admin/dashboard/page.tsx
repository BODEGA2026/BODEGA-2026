"use client";

import { useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Package, Users, RefreshCw } from "lucide-react";
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
import { StatCard } from "@/components/ui/StatCard";
import { fmt } from "@/lib/finance";

const CHANNEL_COLORS = ["#5b8cf7", "#34c759", "#ff9f0a", "#ff3b30", "#8b60ff", "#00bcd4"];

export default function DashboardPage() {
  const { sales, expenses, purchases, products, clients, loadAll } = useAppStore();

  const income = sales.reduce((s, v) => s + v.total_usd, 0);
  const profit = sales.reduce((s, v) => s + v.profit_usd, 0);
  const outflow = expenses.reduce((s, e) => s + e.amount, 0) + purchases.reduce((s, p) => s + p.total, 0);
  const inventoryValue = products.reduce((s, p) => s + p.cost * p.stock, 0);

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

  // Distribución de ingresos por canal
  const channelDist = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const ch = s.channel || "Otro";
      map[ch] = (map[ch] || 0) + s.total_usd;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  // Top 5 productos por ingresos
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

  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Dashboard</h1>
          <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
            Vista general de tu negocio
          </p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => loadAll()}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={DollarSign} value={`$${fmt(income)}`} label="Ingresos Totales" color="#34c759" />
        <StatCard icon={TrendingUp} value={`$${fmt(profit)}`} label="Utilidad Bruta" color="#5b8cf7" />
        <StatCard icon={TrendingDown} value={`$${fmt(outflow)}`} label="Egresos Totales" color="#ff3b30" />
        <StatCard icon={Receipt} value={sales.length} label="Ventas Realizadas" color="#ff9f0a" />
        <StatCard icon={Package} value={`$${fmt(inventoryValue)}`} label="Valor Inventario" color="#8b60ff" />
        <StatCard icon={Users} value={clients.length} label="Clientes" color="#00bcd4" />
      </div>

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
