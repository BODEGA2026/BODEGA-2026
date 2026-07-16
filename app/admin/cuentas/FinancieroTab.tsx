"use client";

import { useMemo, useState } from "react";
import { DollarSign, TrendingDown, TrendingUp, Target, Download, Receipt } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { StatCard } from "@/components/ui/StatCard";
import { fmt } from "@/lib/finance";
import { exportToExcel } from "@/lib/excel";

function monthKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-VE", { month: "short", year: "2-digit" });
}

export function FinancieroTab() {
  const sales = useAppStore((s) => s.sales);
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState({ from, to });

  const filteredSales = useMemo(() => {
    const start = new Date(applied.from);
    const end = new Date(applied.to + "T23:59:59");
    return sales.filter((s) => {
      const d = new Date(s.created_at);
      return d >= start && d <= end;
    });
  }, [sales, applied]);

  const income = filteredSales.reduce((s, v) => s + v.total_usd, 0);
  const cost = filteredSales.reduce((s, v) => s + v.cost_usd, 0);
  const profit = income - cost;
  const margin = income > 0 ? (profit / income) * 100 : 0;

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; cost: number; profit: number }> = {};
    filteredSales.forEach((s) => {
      const k = monthKey(s.created_at);
      if (!map[k]) map[k] = { income: 0, cost: 0, profit: 0 };
      map[k].income += s.total_usd;
      map[k].cost += s.cost_usd;
      map[k].profit += s.profit_usd;
    });
    return Object.entries(map)
      .map(([month, v]) => ({ month, ...v }))
      .slice(-6);
  }, [filteredSales]);

  const handleExport = () => {
    exportToExcel(
      filteredSales.map((s) => ({
        "#": s.invoice_num ?? "",
        Fecha: new Date(s.created_at).toLocaleString("es-VE"),
        Cliente: s.client_name,
        Canal: s.channel,
        Pago: s.payment_method,
        "Base Imponible USD": s.base_imponible,
        "Exento USD": s.exento,
        "IVA 16% USD": s.iva_usd,
        "Total USD": s.total_usd,
        "Costo USD": s.cost_usd,
        "Utilidad USD": s.profit_usd,
      })),
      "Ventas"
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end flex-wrap gap-2">
        <input type="date" className="input-field !w-[150px]" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="input-field !w-[150px]" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn-primary btn-sm" onClick={() => setApplied({ from, to })}>
          Filtrar
        </button>
        <button className="btn-ghost btn-sm" onClick={handleExport}>
          <Download size={14} /> Excel
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} value={`$${fmt(income)}`} label="Ingresos Totales (USD)" color="#34c759" />
        <StatCard icon={TrendingDown} value={`$${fmt(cost)}`} label="Costos de Ventas" color="#ff3b30" />
        <StatCard icon={TrendingUp} value={`$${fmt(profit)}`} label="Utilidad Bruta" color="#5b8cf7" />
        <StatCard icon={Target} value={`${fmt(margin)}%`} label="Margen de Ganancia" color="#ff9f0a" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            📈 Ingresos vs Costos
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `$${fmt(v)}`} />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#34c759" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cost" name="Costos" fill="#ff3b30" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            📊 Rentabilidad mensual
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `$${fmt(v)}`} />
                <Line type="monotone" dataKey="profit" name="Utilidad USD" stroke="#5b8cf7" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
          📋 Registro de Ventas
        </h3>
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                {["#", "Fecha", "Cliente", "Productos", "Canal", "Pago", "Ingresos", "Costo", "Utilidad", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-[13px]" style={{ color: "var(--ink-muted)" }}>
                    Sin ventas en este rango de fechas
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const items = s.items.map((i) => `${i.name} x${i.qty}`).join(", ");
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-2.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        {s.invoice_num ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-[12px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        {new Date(s.created_at).toLocaleString("es-VE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{s.client_name || "—"}</td>
                      <td className="px-3 py-2.5 text-[12px] max-w-[160px] truncate" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }} title={items}>
                        {items}
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <span className="badge badge-info">{s.channel}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[12px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{s.payment_method}</td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--success)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        ${fmt(s.total_usd)}
                      </td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ fontFamily: "var(--font-mono)", color: "var(--danger)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        ${fmt(s.cost_usd)}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        ${fmt(s.profit_usd)}
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <Link href={`/admin/facturacion?saleId=${s.id}`} className="btn-ghost btn-xs" aria-label="Ver factura">
                          <Receipt size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
