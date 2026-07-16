"use client";

import { useState } from "react";
import { CuentasTab } from "./CuentasTab";
import { FinancieroTab } from "./FinancieroTab";

const TABS = [
  { id: "cuentas", label: "🏦 Cuentas (CXC/CXP)" },
  { id: "financiero", label: "💰 Financiero" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CuentasFinancieroPage() {
  const [tab, setTab] = useState<TabId>("cuentas");

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Cuentas y Financiero</h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Cuentas por cobrar/pagar, ingresos, egresos y rentabilidad
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

      {tab === "cuentas" && <CuentasTab />}
      {tab === "financiero" && <FinancieroTab />}
    </div>
  );
}
