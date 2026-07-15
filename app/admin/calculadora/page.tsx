"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { fmt } from "@/lib/finance";

type RateKey = "binance" | "euro_bcv" | "dolar_bcv";

const RATE_LABELS: Record<RateKey, string> = {
  binance: "Dólar Binance",
  euro_bcv: "Euro BCV",
  dolar_bcv: "Dólar BCV",
};

export default function CalculadoraPage() {
  const rates = useAppStore((s) => s.rates);
  const [priceUsd, setPriceUsd] = useState("");
  const [rateIn, setRateIn] = useState<RateKey>("binance");
  const [rateOut, setRateOut] = useState<RateKey>("euro_bcv");
  const [margin, setMargin] = useState("");

  const result = useMemo(() => {
    const usd = parseFloat(priceUsd) || 0;
    const rIn = rates?.[rateIn] || 0;
    const rOut = rates?.[rateOut] || 0;
    const m = parseFloat(margin) || 0;

    const ves = usd * rIn;
    const final = rOut > 0 ? ves / rOut : 0;
    const finalWithMargin = final * (1 + m / 100);
    const differential = rIn > 0 && rOut > 0 ? (rIn / rOut).toFixed(4) : "—";

    return { usd, rIn, rOut, ves, finalWithMargin, differential };
  }, [priceUsd, rateIn, rateOut, margin, rates]);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Calculadora Cambiaria</h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Conversión con diferencial de tasas
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div
          className="card"
          style={{ background: "linear-gradient(135deg, rgba(91,140,247,0.12) 0%, rgba(139,96,255,0.10) 100%)", borderColor: "rgba(91,140,247,0.2)", borderWidth: 2 }}
        >
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-5" style={{ color: "var(--ink-secondary)" }}>
            ⚙️ Parámetros de Cálculo
          </h3>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
              💵 Precio del Producto (USD)
            </label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
                📥 Tasa de Entrada (Costo)
              </label>
              <select className="input-field" value={rateIn} onChange={(e) => setRateIn(e.target.value as RateKey)}>
                {(Object.keys(RATE_LABELS) as RateKey[]).map((k) => (
                  <option key={k} value={k}>{RATE_LABELS[k]}</option>
                ))}
              </select>
              <small className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                Tasa actual: {result.rIn ? `Bs. ${fmt(result.rIn)}` : "—"}
              </small>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
                📤 Tasa de Salida (Cobro)
              </label>
              <select className="input-field" value={rateOut} onChange={(e) => setRateOut(e.target.value as RateKey)}>
                {(Object.keys(RATE_LABELS) as RateKey[]).map((k) => (
                  <option key={k} value={k}>{RATE_LABELS[k]}</option>
                ))}
              </select>
              <small className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                Tasa actual: {result.rOut ? `Bs. ${fmt(result.rOut)}` : "—"}
              </small>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-5">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
              💰 Margen de ganancia (%)
            </label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="0"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
          </div>

          <div className="rounded-2xl p-5 text-white text-center" style={{ background: "linear-gradient(135deg, var(--accent) 0%, #8b60ff 100%)" }}>
            <ResultBlock label="Total en Bolívares (VES)" value={result.usd > 0 ? `${fmt(result.ves)} Bs.` : "—"} />
            <Divider />
            <ResultBlock label="Precio Final de Venta" value={result.usd > 0 ? fmt(result.finalWithMargin) : "—"} />
            <div className="text-[13px] opacity-85">
              {result.usd > 0 ? `en ${RATE_LABELS[rateOut]}` : "Ingresa un precio"}
            </div>
            <Divider />
            <ResultBlock label="Diferencial Cambiario" value="" />
            <div className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
              1 {RATE_LABELS[rateIn]} = {result.differential} {RATE_LABELS[rateOut]}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--ink-secondary)" }}>
              📊 Tasas Actuales
            </h3>
            <div className="flex flex-col divide-y divide-black/5">
              {(Object.keys(RATE_LABELS) as RateKey[]).map((k) => {
                const emoji = k === "euro_bcv" ? "💶" : "💵";
                const v = rates?.[k] || 0;
                return (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <span className="text-[14px]">{emoji} {RATE_LABELS[k]}</span>
                    {v > 0 ? (
                      <span className="text-[15px] font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                        Bs. {fmt(v)}
                      </span>
                    ) : (
                      <span className="text-[13px]" style={{ color: "var(--ink-muted)" }}>No configurada</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--ink-secondary)" }}>
              💡 Cómo funciona
            </h3>
            <div className="text-[13px] leading-relaxed space-y-3" style={{ color: "var(--ink-secondary)" }}>
              <p><strong>Paso 1:</strong> Precio USD × Tasa Entrada = Bolívares.</p>
              <p><strong>Paso 2:</strong> Bolívares ÷ Tasa Salida = Precio de cobro.</p>
              <p><strong>Diferencial:</strong> Si Tasa Entrada &gt; Tasa Salida, generas ganancia cambiaria adicional.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultBlock({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-[12px] font-semibold opacity-80 uppercase tracking-wide">{label}</div>
      {value && (
        <div className="text-[32px] font-bold my-1" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
          {value}
        </div>
      )}
    </>
  );
}

function Divider() {
  return <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.2)" }} />;
}
