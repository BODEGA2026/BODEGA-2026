"use client";

import { useMemo, useState } from "react";
import { Users, UserCheck, UserMinus, Trophy, Plus, MessageCircle, Download, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { StatCard } from "@/components/ui/StatCard";
import { fmt } from "@/lib/finance";
import { exportToExcel } from "@/lib/excel";
import { toast } from "@/lib/store/useToastStore";
import { ClientModal } from "./ClientModal";
import { MassMessageModal } from "./MassMessageModal";
import { isActiveClient } from "./clientUtils";
import type { Client } from "@/lib/types";

type Filter = "all" | "active" | "inactive";

export default function MarketingPage() {
  const { clients, deleteClient } = useAppStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [massModalOpen, setMassModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const activeCount = clients.filter(isActiveClient).length;
  const topClient = clients.reduce<Client | null>((best, c) => (!best || c.total_bought > best.total_bought ? c : best), null);

  const filtered = useMemo(() => {
    if (filter === "active") return clients.filter(isActiveClient);
    if (filter === "inactive") return clients.filter((c) => !isActiveClient(c));
    return clients;
  }, [clients, filter]);

  const openNew = () => {
    setEditingClient(null);
    setClientModalOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditingClient(c);
    setClientModalOpen(true);
  };
  const handleDelete = async (c: Client) => {
    if (!confirm(`¿Eliminar cliente "${c.name}"?`)) return;
    await deleteClient(c.id);
    toast("Cliente eliminado", "info");
  };

  const handleExport = () => {
    exportToExcel(
      clients.map((c) => ({
        Nombre: c.name,
        Teléfono: c.phone,
        Email: c.email,
        Dirección: c.address,
        "Total Comprado USD": c.total_bought,
        Compras: c.purchases_count,
        "Última Compra": c.last_purchase ? new Date(c.last_purchase).toLocaleDateString("es-VE") : "—",
      })),
      "Clientes"
    );
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Marketing</h1>
          <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
            Gestión de clientes y campañas
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} /> Nuevo Cliente
          </button>
          <button className="btn-ghost btn-sm" onClick={handleExport}>
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} value={clients.length} label="Clientes Totales" color="#5b8cf7" />
        <StatCard icon={UserCheck} value={activeCount} label="Clientes Activos" sub="(últ. 90 días)" color="#34c759" />
        <StatCard icon={UserMinus} value={clients.length - activeCount} label="Clientes Inactivos" color="#ff9f0a" />
        <StatCard
          icon={Trophy}
          value={topClient?.name.split(" ")[0] ?? "—"}
          label="Mejor Cliente"
          sub={topClient ? `$${fmt(topClient.total_bought)}` : ""}
          color="#8b60ff"
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1.5">
            {(["all", "active", "inactive"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full px-4 py-2 text-[13px] font-semibold transition-all"
                style={{
                  background: filter === f ? "var(--accent)" : "rgba(255,255,255,0.5)",
                  color: filter === f ? "#fff" : "var(--ink-secondary)",
                  border: filter === f ? "none" : "1.5px solid rgba(200,215,235,0.5)",
                }}
              >
                {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
          <button className="btn-warning btn-sm" onClick={() => setMassModalOpen(true)}>
            <MessageCircle size={14} /> Mensajería Masiva
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                {["Cliente", "Teléfono", "Email", "Última Compra", "Total Comprado", "Estado", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[13px]" style={{ color: "var(--ink-muted)" }}>
                    Sin clientes registrados
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const active = isActiveClient(c);
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <strong>{c.name}</strong>
                      </td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{c.phone || "—"}</td>
                      <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{c.email || "—"}</td>
                      <td className="px-3 py-2.5 text-[12px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        {c.last_purchase ? new Date(c.last_purchase).toLocaleDateString("es-VE") : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        ${fmt(c.total_bought)}
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <span className={`badge ${active ? "badge-success" : "badge-neutral"}`}>{active ? "Activo" : "Inactivo"}</span>
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <div className="flex gap-1.5">
                          <button className="btn-ghost btn-xs" onClick={() => openEdit(c)} aria-label="Editar">
                            <Pencil size={12} />
                          </button>
                          <button className="btn-danger btn-xs" onClick={() => handleDelete(c)} aria-label="Eliminar">
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

      <ClientModal open={clientModalOpen} onClose={() => setClientModalOpen(false)} client={editingClient} />
      <MassMessageModal open={massModalOpen} onClose={() => setMassModalOpen(false)} />
    </div>
  );
}
