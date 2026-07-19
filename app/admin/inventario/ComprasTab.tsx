"use client";

import { useMemo, useState } from "react";
import { Plus, Download, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { fmt } from "@/lib/finance";
import { exportToExcel } from "@/lib/excel";
import { toast } from "@/lib/store/useToastStore";
import { PurchaseModal } from "./PurchaseModal";
import { ExpenseModal } from "./ExpenseModal";

function isToday(iso: string) {
  return iso?.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function ComprasTab() {
  const { sales, purchases, expenses, deletePurchase, deleteExpense } = useAppStore();
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const cierre = useMemo(() => {
    const ventasHoy = sales.filter((s) => isToday(s.created_at));
    const gastosHoy = expenses.filter((e) => isToday(e.expense_date));
    const comprasHoy = purchases.filter((p) => isToday(p.purchase_date));
    const totalVentas = ventasHoy.reduce((s, v) => s + v.total_usd, 0);
    const totalGastos = gastosHoy.reduce((s, e) => s + e.amount, 0);
    const totalCompras = comprasHoy.reduce((s, c) => s + c.total, 0);
    const utilidad = totalVentas - totalGastos - totalCompras;
    return { ventasCount: ventasHoy.length, totalVentas, totalGastos, totalCompras, utilidad };
  }, [sales, purchases, expenses]);

  const handleDeletePurchase = async (id: string) => {
    if (!confirm("¿Eliminar esta compra? El stock NO se revertirá automáticamente.")) return;
    const ok = await deletePurchase(id);
    if (ok) toast("Compra eliminada", "info");
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    const ok = await deleteExpense(id);
    if (ok) toast("Gasto eliminado", "info");
  };

  const handleExport = () => {
    exportToExcel(
      [
        ...purchases.map((p) => ({
          Tipo: "Compra",
          Fecha: p.purchase_date,
          Concepto: p.product_name,
          Contraparte: p.supplier,
          Cantidad: p.qty,
          "Monto USD": p.total,
        })),
        ...expenses.map((e) => ({
          Tipo: "Gasto",
          Fecha: e.expense_date,
          Concepto: e.concept,
          Contraparte: e.category,
          Cantidad: 1,
          "Monto USD": e.amount,
        })),
      ],
      "Compras_Gastos"
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end flex-wrap gap-2">
        <button className="btn-primary btn-sm" onClick={() => setPurchaseModalOpen(true)}>
          <Plus size={14} /> Registrar Compra
        </button>
        <button className="btn-danger btn-sm" onClick={() => setExpenseModalOpen(true)}>
          <Plus size={14} /> Registrar Gasto
        </button>
        <button className="btn-ghost btn-sm" onClick={handleExport}>
          <Download size={14} /> Excel
        </button>
      </div>

      {/* Cierre de caja */}
      <div
        className="card"
        style={{ background: "linear-gradient(135deg, rgba(91,140,247,0.12) 0%, rgba(52,199,89,0.08) 100%)", borderColor: "rgba(91,140,247,0.2)", borderWidth: 2 }}
      >
        <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--ink-secondary)" }}>
          🏧 Cierre de Caja — Resumen del Día
        </h3>
        <CierreRow label={`💰 Ventas del día (${cierre.ventasCount} ventas)`} value={`$${fmt(cierre.totalVentas)}`} color="var(--success)" />
        <CierreRow label="💸 Gastos operativos del día" value={`−$${fmt(cierre.totalGastos)}`} />
        <CierreRow label="🛍️ Compras / Inventario del día" value={`−$${fmt(cierre.totalCompras)}`} />
        <CierreRow
          label="📈 Utilidad Neta del Día"
          value={`$${fmt(cierre.utilidad)}`}
          color={cierre.utilidad >= 0 ? "var(--success)" : "var(--danger)"}
          big
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide mb-2.5 px-1" style={{ color: "var(--ink-secondary)" }}>
            📦 Compras (afectan inventario)
          </h3>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                  {["Fecha", "Proveedor", "Producto", "Cant.", "Costo/U", "Total", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[13px]" style={{ color: "var(--ink-muted)" }}>Sin compras registradas</td>
                  </tr>
                ) : (
                  purchases.slice(0, 50).map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2.5 text-[11px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        {new Date(p.purchase_date).toLocaleDateString("es-VE")}
                      </td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{p.supplier}</td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{p.product_name}</td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ fontFamily: "var(--font-mono)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{p.qty}</td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ fontFamily: "var(--font-mono)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>${fmt(p.unit_cost)}</td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--danger)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>${fmt(p.total)}</td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <button className="btn-danger btn-xs" onClick={() => handleDeletePurchase(p.id)}><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide mb-2.5 px-1" style={{ color: "var(--ink-secondary)" }}>
            💸 Gastos Operativos
          </h3>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                  {["Fecha", "Concepto", "Categoría", "Monto USD", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[13px]" style={{ color: "var(--ink-muted)" }}>Sin gastos registrados</td>
                  </tr>
                ) : (
                  expenses.slice(0, 50).map((e) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2.5 text-[11px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        {new Date(e.expense_date).toLocaleDateString("es-VE")}
                      </td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{e.concept}</td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <span className="badge badge-neutral">{e.category}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--danger)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>${fmt(e.amount)}</td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <button className="btn-danger btn-xs" onClick={() => handleDeleteExpense(e.id)}><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PurchaseModal open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} />
      <ExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
    </div>
  );
}

function CierreRow({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div
      className="flex justify-between items-center py-2.5"
      style={{ borderBottom: big ? "none" : "1px solid rgba(200,215,235,0.3)", paddingTop: big ? 14 : undefined }}
    >
      <span className="text-[14px]" style={{ color: "var(--ink-secondary)" }}>{label}</span>
      <span
        className="font-semibold"
        style={{ fontFamily: "var(--font-mono)", color: color ?? "var(--ink)", fontSize: big ? 20 : 15, fontWeight: big ? 700 : 600 }}
      >
        {value}
      </span>
    </div>
  );
}
