"use client";

import { useMemo, useState } from "react";
import { Search, Receipt, FileText } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { fmt } from "@/lib/finance";
import type { Sale } from "@/lib/types";

export function SaleList({ onSelect }: { onSelect: (sale: Sale) => void }) {
  const sales = useAppStore((s) => s.sales);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sales
      .filter((s) => s.status === "completed")
      .filter((s) => !q || (s.client_name ?? "").toLowerCase().includes(q) || String(s.invoice_num ?? "").includes(q))
      .slice(0, 40);
  }, [sales, search]);

  return (
    <div className="card">
      <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--ink-secondary)" }}>
        🔍 Seleccionar Venta para Facturar
      </h3>
      <div className="relative max-w-[320px] mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
        <input
          className="input-field !pl-9"
          placeholder="Nombre cliente o #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10" style={{ color: "var(--ink-muted)" }}>
          <Receipt size={28} className="mx-auto mb-2 opacity-50" />
          No hay ventas registradas aún. Realiza ventas desde el POS.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                {["#Factura", "Fecha", "Cliente", "Productos", "Total", "Canal", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2.5 text-[13px] font-semibold" style={{ fontFamily: "var(--font-mono)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                    {String(s.invoice_num ?? "—").padStart(5, "0")}
                  </td>
                  <td className="px-3 py-2.5 text-[12px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                    {new Date(s.created_at).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-3 py-2.5 text-[13px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{s.client_name || "—"}</td>
                  <td className="px-3 py-2.5 text-[12px] max-w-[200px] truncate" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                    {s.items.map((i) => i.name).join(", ")}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                    ${fmt(s.total_usd)}
                  </td>
                  <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                    <span className="badge badge-info">{s.channel}</span>
                  </td>
                  <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                    <button className="btn-primary btn-xs" onClick={() => onSelect(s)}>
                      <FileText size={12} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
