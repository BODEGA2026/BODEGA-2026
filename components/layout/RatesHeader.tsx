"use client";

import { Menu, ExternalLink } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Currency } from "@/lib/types";

export function RatesHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const rates = useAppStore((s) => s.rates);
  const saveRates = useAppStore((s) => s.saveRates);

  if (!rates) return null;

  return (
    <header className="glass-panel flex items-center gap-4 px-5 py-3 flex-wrap sticky top-0 z-50">
      <button className="md:hidden btn-ghost btn-sm" onClick={onMenuClick} aria-label="Abrir menú">
        <Menu size={18} />
      </button>

      <RateField
        label="Binance"
        href="https://p2p.binance.com/es/trade/buy/USDT?fiat=VES"
        value={rates.binance}
        onChange={(v) => saveRates({ binance: v })}
      />
      <RateField
        label="Euro BCV"
        href="https://www.bcv.org.ve/"
        value={rates.euro_bcv}
        onChange={(v) => saveRates({ euro_bcv: v })}
      />
      <RateField
        label="Dólar BCV"
        href="https://www.bcv.org.ve/"
        value={rates.dolar_bcv}
        onChange={(v) => saveRates({ dolar_bcv: v })}
      />

      <div className="ml-auto flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
          Moneda de cobro
        </label>
        <select
          className="rounded-xl text-white text-[13px] font-semibold px-3.5 py-1.5 outline-none cursor-pointer"
          style={{ background: "var(--accent)" }}
          value={rates.global_currency}
          onChange={(e) => saveRates({ global_currency: e.target.value as Currency })}
        >
          <option value="USD">USD — Dólar</option>
          <option value="EUR">EUR — Euro BCV</option>
          <option value="BCVUSD">BCV — Dólar BCV</option>
          <option value="BINANCE">BIN — Binance</option>
          <option value="VES">VES — Bolívares</option>
        </select>
      </div>
    </header>
  );
}

function RateField({
  label,
  href,
  value,
  onChange,
}: {
  label: string;
  href: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1" style={{ color: "var(--ink-muted)" }}>
        {label}
        <a href={href} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
          <ExternalLink size={10} />
        </a>
      </label>
      <div className="flex items-center rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,210,230,0.6)" }}>
        <span className="px-2 text-[12px]" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
          Bs.
        </span>
        <input
          type="number"
          step="0.01"
          defaultValue={value || ""}
          placeholder="0.00"
          className="w-[90px] bg-transparent outline-none py-1.5 pr-2 text-[14px] font-semibold"
          style={{ fontFamily: "var(--font-mono)" }}
          onBlur={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}
