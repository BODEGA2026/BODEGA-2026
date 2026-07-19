"use client";

import { useState } from "react";
import { Wallet, TrendingDown, Clock, Scale, Plus, Download, Check, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { StatCard } from "@/components/ui/StatCard";
import { fmt } from "@/lib/finance";
import { exportToExcel } from "@/lib/excel";
import { toast } from "@/lib/store/useToastStore";
import { AccountModal } from "./AccountModal";
import type { Account, AccountType } from "@/lib/types";

export function CuentasTab() {
  const { accounts, markAccountPaid, deleteAccount } = useAppStore();
  const [modalType, setModalType] = useState<AccountType | null>(null);

  const cxc = accounts.filter((a) => a.type === "CXC");
  const cxp = accounts.filter((a) => a.type === "CXP");
  const cxcTotal = cxc.filter((a) => a.status !== "paid").reduce((s, a) => s + a.amount, 0);
  const cxpTotal = cxp.filter((a) => a.status !== "paid").reduce((s, a) => s + a.amount, 0);
  const overdueCount = cxc.filter((a) => a.status !== "paid" && a.due_date && new Date(a.due_date) < new Date()).length;

  const handleMarkPaid = async (id: string) => {
    const ok = await markAccountPaid(id);
    if (ok) toast("Marcada como pagada", "success");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await deleteAccount(id);
    // el store ya muestra el error si falla
  };

  const handleExport = () => {
    exportToExcel(
      accounts.map((a) => ({
        Tipo: a.type,
        Entidad: a.entity,
        "Monto USD": a.amount,
        Vencimiento: a.due_date,
        Estado: a.status,
        Notas: a.notes,
      })),
      "Cuentas"
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end flex-wrap gap-2">
        <button className="btn-primary btn-sm" onClick={() => setModalType("CXC")}>
          <Plus size={14} /> CXC
        </button>
        <button className="btn-danger btn-sm" onClick={() => setModalType("CXP")}>
          <Plus size={14} /> CXP
        </button>
        <button className="btn-ghost btn-sm" onClick={handleExport}>
          <Download size={14} /> Excel
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Wallet} value={`$${fmt(cxcTotal)}`} label="Por Cobrar (USD)" color="#34c759" />
        <StatCard icon={TrendingDown} value={`$${fmt(cxpTotal)}`} label="Por Pagar (USD)" color="#ff3b30" />
        <StatCard icon={Clock} value={overdueCount} label="CXC Vencidas" color="#ff9f0a" />
        <StatCard icon={Scale} value={`$${fmt(cxcTotal - cxpTotal)}`} label="Balance Neto" color="#5b8cf7" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <AccountTable title="💚 Cuentas por Cobrar (CXC)" accounts={cxc} entityLabel="Cliente" onMarkPaid={handleMarkPaid} onDelete={handleDelete} />
        <AccountTable title="🔴 Cuentas por Pagar (CXP)" accounts={cxp} entityLabel="Proveedor" onMarkPaid={handleMarkPaid} onDelete={handleDelete} />
      </div>

      <AccountModal open={modalType !== null} type={modalType ?? "CXC"} onClose={() => setModalType(null)} />
    </div>
  );
}

function AccountTable({
  title,
  accounts,
  entityLabel,
  onMarkPaid,
  onDelete,
}: {
  title: string;
  accounts: Account[];
  entityLabel: string;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-wide mb-2.5 px-1" style={{ color: "var(--ink-secondary)" }}>
        {title}
      </h3>
      <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(240,245,255,0.5)" }}>
              {[entityLabel, "Monto", "Vence", "Estado", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[13px]" style={{ color: "var(--ink-muted)" }}>
                  Sin registros
                </td>
              </tr>
            ) : (
              accounts.map((a) => {
                const overdue = a.status !== "paid" && a.due_date && new Date(a.due_date) < new Date();
                const badgeClass = a.status === "paid" ? "badge-success" : overdue ? "badge-danger" : "badge-warning";
                const badgeLabel = a.status === "paid" ? "Pagado" : overdue ? "Vencido" : "Pendiente";
                return (
                  <tr key={a.id}>
                    <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                      <strong className="text-[13px]">{a.entity}</strong>
                      {a.notes && (
                        <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>{a.notes}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-semibold" style={{ fontFamily: "var(--font-mono)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                      ${fmt(a.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                      {a.due_date ? new Date(a.due_date).toLocaleDateString("es-VE") : "—"}
                    </td>
                    <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                      <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                    </td>
                    <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                      <div className="flex gap-1.5">
                        {a.status !== "paid" && (
                          <button className="btn-success btn-xs" onClick={() => onMarkPaid(a.id)} aria-label="Marcar pagada">
                            <Check size={12} />
                          </button>
                        )}
                        <button className="btn-danger btn-xs" onClick={() => onDelete(a.id)} aria-label="Eliminar">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
