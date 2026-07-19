"use client";

import { useMemo } from "react";
import { Receipt, DollarSign, TrendingUp, Package, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAppStore } from "@/lib/store/useAppStore";
import { StatCard } from "@/components/ui/StatCard";
import { DataCapNotice } from "@/components/ui/DataCapNotice";
import { fmt } from "@/lib/finance";
import { exportToExcel } from "@/lib/excel";

const BAR_COLORS = ["#5b8cf7", "#34c759", "#ff9f0a", "#ff3b30", "#8b60ff", "#00bcd4", "#e91e8c", "#ff6b35"];

export function EstadisticasTab() {
  const { sales, products, salesTotalCount } = useAppStore();

  const completedSales = sales.filter((s) => s.status === "completed");
  const totalSales = completedSales.length;
  const totalIncome = completedSales.reduce((s, v) => s + v.total_usd, 0);
  const avgTicket = totalSales > 0 ? totalIncome / totalSales : 0;
  const inventoryValue = products.reduce((s, p) => s + p.cost * p.stock, 0);

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    completedSales.forEach((s) => s.items.forEach((i) => (map[i.name] = (map[i.name] || 0) + i.qty)));
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, units]) => ({ name, units }));
  }, [completedSales]);

  const byChannel = useMemo(() => {
    const map: Record<string, number> = {};
    completedSales.forEach((s) => {
      const ch = s.channel || "Otro";
      map[ch] = (map[ch] || 0) + s.total_usd;
    });
    return Object.entries(map).map(([channel, income]) => ({ channel, income }));
  }, [completedSales]);

  const lowRotation = useMemo(() => {
    const soldQty: Record<string, number> = {};
    completedSales.forEach((s) => s.items.forEach((i) => (soldQty[i.productId] = (soldQty[i.productId] || 0) + i.qty)));
    return [...products]
      .filter((p) => (soldQty[p.id] || 0) < 2)
      .sort((a, b) => (soldQty[a.id] || 0) - (soldQty[b.id] || 0))
      .slice(0, 8)
      .map((p) => ({ ...p, sold: soldQty[p.id] || 0 }));
  }, [products, completedSales]);

  const handleExport = () => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    completedSales.forEach((s) =>
      s.items.forEach((i) => {
        if (!map[i.name]) map[i.name] = { qty: 0, revenue: 0 };
        map[i.name].qty += i.qty;
        map[i.name].revenue += i.unitPrice * i.qty;
      })
    );
    exportToExcel(
      Object.entries(map).map(([Producto, d]) => ({ Producto, Unidades: d.qty, "Ingresos USD": d.revenue.toFixed(2) })),
      "Estadísticas"
    );
  };

  return (
    <div className="space-y-5">
      <DataCapNotice loaded={sales.length} total={salesTotalCount} label="ventas" />

      <div className="flex items-center justify-end">
        <button className="btn-ghost btn-sm" onClick={handleExport}>
          <Download size={14} /> Exportar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Receipt} value={totalSales} label="Ventas Totales" color="#5b8cf7" />
        <StatCard icon={DollarSign} value={`$${fmt(totalIncome)}`} label="Facturación Total USD" color="#34c759" />
        <StatCard icon={TrendingUp} value={`$${fmt(avgTicket)}`} label="Ticket Promedio" color="#ff9f0a" />
        <StatCard icon={Package} value={`$${fmt(inventoryValue)}`} label="Valor Inventario" color="#8b60ff" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            🏆 Productos más vendidos
          </h3>
          <div className="h-[280px]">
            {topProducts.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => `${v} unidades`} />
                  <Bar dataKey="units" radius={[0, 8, 8, 0]}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="Realiza ventas para ver el top de productos." />
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            📉 Baja rotación
          </h3>
          {lowRotation.length === 0 ? (
            <EmptyState text="Todos los productos tienen rotación." />
          ) : (
            <div className="flex flex-col divide-y divide-black/5">
              {lowRotation.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 py-2.5">
                  <Package size={18} style={{ color: "var(--ink-muted)" }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{p.name}</div>
                    <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                      Stock: {p.stock}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold" style={{ color: "var(--warning)" }}>
                      {p.sold} uds
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                      vendidas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
          📊 Ventas por canal
        </h3>
        <div className="h-[260px]">
          {byChannel.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byChannel}>
                <XAxis dataKey="channel" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `$${fmt(v)}`} />
                <Bar dataKey="income" fill="#5b8cf7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Aún no hay ventas registradas." />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-[13px]" style={{ color: "var(--ink-muted)" }}>
      {text}
    </div>
  );
}
