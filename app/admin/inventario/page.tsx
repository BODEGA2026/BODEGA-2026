"use client";

import { useState } from "react";
import { ProductosTab } from "./ProductosTab";
import { ComprasTab } from "./ComprasTab";
import { CargaMasivaTab } from "./CargaMasivaTab";

const TABS = [
  { id: "productos", label: "📦 Productos" },
  { id: "compras", label: "🛍️ Compras y Gastos" },
  { id: "carga", label: "📥 Carga Masiva" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function InventarioPage() {
  const [tab, setTab] = useState<TabId>("productos");

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Inventario y Compras</h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Productos, existencias, compras, gastos y carga masiva
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap" style={{ borderBottom: "2px solid rgba(200,215,235,0.3)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-[13.5px] font-semibold rounded-t-xl transition-all"
            style={{
              color: tab === t.id ? "var(--accent-dark)" : "var(--ink-muted)",
              background: tab === t.id ? "var(--accent-light)" : "transparent",
              borderBottom: tab === t.id ? "2.5px solid var(--accent)" : "2.5px solid transparent",
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "productos" && <ProductosTab />}
      {tab === "compras" && <ComprasTab />}
      {tab === "carga" && <CargaMasivaTab />}
    </div>
  );
}
