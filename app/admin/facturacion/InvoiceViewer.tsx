"use client";

import { Printer, Copy, X } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { fmt } from "@/lib/finance";
import { toast } from "@/lib/store/useToastStore";
import type { InvoiceLike } from "@/lib/types";

export function InvoiceViewer({ sale, onClose }: { sale: InvoiceLike; onClose: () => void }) {
  const { business, rates: currentRates } = useAppStore();

  const invoiceNum =
    typeof sale.invoice_num === "number" ? String(sale.invoice_num).padStart(5, "0") : sale.invoice_num || "—";
  const date = new Date(sale.created_at).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const vesRate = sale.rates_snapshot?.dolar_bcv || currentRates?.dolar_bcv || 1;

  const total = sale.total_usd;
  const baseVes = sale.base_imponible * vesRate;
  const exentoVes = sale.exento * vesRate;
  const ivaVes = sale.iva_usd * vesRate;
  const totalVes = total * vesRate;

  const handlePrint = () => window.print();

  const handleCopy = async () => {
    const lines = [
      `${business?.name || "Anthony Rivera Godoy"}`,
      business?.rif ? `RIF: ${business.rif}` : "",
      business?.phone ? `Tel: ${business.phone}` : "",
      business?.address || "",
      "",
      `Comprobante N° ${invoiceNum} · ${date}`,
      `Cliente: ${sale.client_name || "Cliente General"}`,
      sale.phone ? `Tel: ${sale.phone}` : "",
      "",
      "Uds.\tDescripción\tP. Unit.\tTotal",
      ...sale.items.map((i) => `${i.qty}\t${i.name} [${i.taxType === "IVA16" ? "IVA" : "Ex"}]\t$${fmt(i.unitPrice)}\t$${fmt(i.unitPrice * i.qty)}`),
      "",
      `Base Imponible: $${fmt(sale.base_imponible)} · Bs. ${fmt(baseVes)}`,
      `Exento: $${fmt(sale.exento)} · Bs. ${fmt(exentoVes)}`,
      `IVA 16%: $${fmt(sale.iva_usd)} · Bs. ${fmt(ivaVes)}`,
      `TOTAL: $${fmt(total)} · Bs. ${fmt(totalVes)}`,
      "",
      business?.footer_note || "¡Gracias por su preferencia!",
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast("📋 Contenido copiado al portapapeles", "success");
    } catch {
      toast("No se pudo copiar automáticamente. Selecciona el texto manualmente.", "info");
    }
  };

  return (
    <div>
      <div className="flex gap-2.5 mb-4 flex-wrap" data-no-print>
        <button className="btn-primary" onClick={handlePrint}>
          <Printer size={15} /> Imprimir / Guardar PDF
        </button>
        <button className="btn-success btn-sm" onClick={handleCopy}>
          <Copy size={14} /> Copiar Texto
        </button>
        <button className="btn-ghost btn-sm" onClick={onClose}>
          <X size={14} /> Cerrar
        </button>
      </div>

      <div data-print-area>
        <div className="rounded-2xl p-8 bg-white" style={{ border: "1px solid rgba(200,215,235,0.6)", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)" }}>
          {/* Encabezado del negocio */}
          <div className="mb-6 pb-4" style={{ borderBottom: "2px solid rgba(91,140,247,0.2)" }}>
            <div className="text-[18px] font-bold" style={{ fontFamily: "var(--font-sans)", color: "var(--accent-dark)" }}>
              {business?.name || "Anthony Rivera Godoy"}
            </div>
            <div className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)" }}>
              {business?.rif && <>RIF: {business.rif} &nbsp;·&nbsp; </>}
              {business?.phone && <>Tel: {business.phone} &nbsp;·&nbsp; </>}
              {business?.address}
              {business?.email && (
                <>
                  <br />✉️ {business.email}
                </>
              )}
            </div>
          </div>

          {/* Cliente + número */}
          <div className="flex justify-between items-start gap-5 mb-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)" }}>
                Facturado a
              </div>
              <div className="text-[15px] font-bold" style={{ fontFamily: "var(--font-sans)" }}>
                {sale.client_name || "Cliente General"}
              </div>
              <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--ink-secondary)", fontFamily: "var(--font-sans)" }}>
                {sale.phone && <>📱 {sale.phone}<br /></>}
                {sale.address && <>📍 {sale.address}<br /></>}
                {sale.gps_link && (
                  <a href={sale.gps_link} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                    🗺️ Ver ubicación
                  </a>
                )}
              </div>
              <div className="mt-1.5 flex gap-1">
                {sale.payment_method && <span className="badge badge-info">{sale.payment_method}</span>}
                {sale.channel && <span className="badge badge-neutral">{sale.channel}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)" }}>
                Comprobante
              </div>
              <div className="text-[22px] font-bold" style={{ color: "var(--accent)" }}>N° {invoiceNum}</div>
              <div className="text-[11px]" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)" }}>📅 {date}</div>
            </div>
          </div>

          {/* Tabla de líneas */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr>
                <th className="text-right w-[50px] pb-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)", borderBottom: "2px solid rgba(91,140,247,0.25)" }}>Uds.</th>
                <th className="text-left pb-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)", borderBottom: "2px solid rgba(91,140,247,0.25)" }}>Descripción</th>
                <th className="text-right w-[120px] pb-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)", borderBottom: "2px solid rgba(91,140,247,0.25)" }}>P. Unitario</th>
                <th className="text-right w-[120px] pb-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)", borderBottom: "2px solid rgba(91,140,247,0.25)" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td className="text-right py-2 font-bold" style={{ borderBottom: "1px solid rgba(200,215,235,0.18)" }}>{item.qty}</td>
                  <td className="py-2" style={{ fontFamily: "var(--font-sans)", borderBottom: "1px solid rgba(200,215,235,0.18)" }}>
                    {item.name}
                    <span
                      className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: item.taxType === "IVA16" ? "#fff0e8" : "#e8fff0", color: item.taxType === "IVA16" ? "#c05500" : "#1a7a35" }}
                    >
                      {item.taxType === "IVA16" ? "IVA" : "Ex."}
                    </span>
                  </td>
                  <td className="text-right py-2" style={{ borderBottom: "1px solid rgba(200,215,235,0.18)" }}>${fmt(item.unitPrice)}</td>
                  <td className="text-right py-2 font-bold" style={{ borderBottom: "1px solid rgba(200,215,235,0.18)" }}>${fmt(item.unitPrice * item.qty)}</td>
                </tr>
              ))}
              {sale.delivery > 0 && <ExtraRow label="Delivery" total={sale.delivery} />}
              {sale.commission > 0 && <ExtraRow label="Comisión" total={sale.commission} />}
              {sale.tip > 0 && <ExtraRow label="Propina" total={sale.tip} />}
            </tbody>
          </table>

          {/* Totales — dos columnas */}
          <div className="grid grid-cols-2 gap-6 pt-4" style={{ borderTop: "2px solid rgba(91,140,247,0.25)" }}>
            <TotalsBlock
              title="💵 Totales en USD"
              rows={[
                ["Base Imponible (Gravada)", `$${fmt(sale.base_imponible)}`],
                ["Exento", `$${fmt(sale.exento)}`, "var(--success)"],
                ["IVA 16%", `$${fmt(sale.iva_usd)}`, "var(--warning)"],
                ["Total", `$${fmt(total)}`, "var(--accent)", true],
              ]}
            />
            <TotalsBlock
              title={`🇻🇪 Totales en Bs. (BCV Bs. ${fmt(vesRate)})`}
              rows={[
                ["Base Imponible (Gravada)", `Bs. ${fmt(baseVes)}`],
                ["Exento", `Bs. ${fmt(exentoVes)}`, "var(--success)"],
                ["IVA 16%", `Bs. ${fmt(ivaVes)}`, "var(--warning)"],
                ["Total", `Bs. ${fmt(totalVes)}`, "var(--accent)", true],
              ]}
            />
          </div>

          <div
            className="mt-5 pt-3 text-center text-[11px]"
            style={{ borderTop: "1px dashed rgba(200,215,235,0.5)", color: "var(--ink-muted)", fontFamily: "var(--font-sans)" }}
          >
            {business?.footer_note || "¡Gracias por su preferencia!"} &nbsp;·&nbsp; {business?.name || "Anthony Rivera Godoy"}
          </div>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5 text-[12px] flex items-center gap-2 mt-4"
          style={{ background: "rgba(91,140,247,0.06)", border: "1px solid rgba(91,140,247,0.18)", color: "var(--ink-muted)", fontFamily: "var(--font-sans)" }}
          data-no-print
        >
          💡 Selecciona el texto de la tabla con el mouse para copiar, o usa el botón &quot;Copiar Texto&quot;.
        </div>
      </div>
    </div>
  );
}

function ExtraRow({ label, total }: { label: string; total: number }) {
  return (
    <tr>
      <td className="text-right py-2" style={{ borderBottom: "1px solid rgba(200,215,235,0.18)" }}>—</td>
      <td className="py-2" style={{ fontFamily: "var(--font-sans)", borderBottom: "1px solid rgba(200,215,235,0.18)" }}>{label}</td>
      <td className="text-right py-2" style={{ borderBottom: "1px solid rgba(200,215,235,0.18)" }}>—</td>
      <td className="text-right py-2 font-bold" style={{ borderBottom: "1px solid rgba(200,215,235,0.18)" }}>${fmt(total)}</td>
    </tr>
  );
}

function TotalsBlock({ title, rows }: { title: string; rows: [string, string, string?, boolean?][] }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(248,250,255,0.8)", border: "1px solid rgba(200,215,235,0.5)" }}>
      <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-sans)" }}>
        {title}
      </div>
      {rows.map(([label, value, color, isTotal], i) => (
        <div
          key={label}
          className="flex justify-between items-center py-1"
          style={{
            borderBottom: isTotal ? "none" : i < rows.length - 1 ? "1px dashed rgba(200,215,235,0.35)" : "none",
            borderTop: isTotal ? "1.5px solid rgba(91,140,247,0.3)" : "none",
            paddingTop: isTotal ? 10 : undefined,
            marginTop: isTotal ? 4 : undefined,
          }}
        >
          <span className="text-[12.5px]" style={{ color: "var(--ink-secondary)", fontFamily: "var(--font-sans)" }}>{label}</span>
          <span className="font-semibold" style={{ color: color ?? "var(--ink)", fontSize: isTotal ? 15 : 12.5, fontWeight: isTotal ? 700 : 600 }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
