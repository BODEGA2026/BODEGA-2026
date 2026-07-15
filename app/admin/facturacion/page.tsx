"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { SaleList } from "./SaleList";
import { InvoiceViewer } from "./InvoiceViewer";
import type { InvoiceLike, Sale } from "@/lib/types";

function saleToInvoice(sale: Sale): InvoiceLike {
  return {
    invoice_num: sale.invoice_num,
    client_name: sale.client_name,
    phone: sale.phone,
    address: sale.address,
    gps_link: sale.gps_link,
    payment_method: sale.payment_method,
    channel: sale.channel,
    items: sale.items,
    base_imponible: sale.base_imponible,
    exento: sale.exento,
    iva_usd: sale.iva_usd,
    total_usd: sale.total_usd,
    delivery: sale.delivery,
    commission: sale.commission,
    tip: sale.tip,
    rates_snapshot: sale.rates_snapshot,
    created_at: sale.created_at,
  };
}

function FacturacionContent() {
  const searchParams = useSearchParams();
  const sales = useAppStore((s) => s.sales);
  const [selected, setSelected] = useState<InvoiceLike | null>(null);

  const saleId = searchParams.get("saleId");
  const preview = searchParams.get("preview");

  useEffect(() => {
    if (preview === "1") {
      const raw = sessionStorage.getItem("pos-preview-sale");
      if (raw) {
        try {
          setSelected(JSON.parse(raw) as InvoiceLike);
        } catch {
          // ignorar preview corrupto
        }
      }
      return;
    }
    if (saleId) {
      const sale = sales.find((s) => s.id === saleId);
      if (sale) setSelected(saleToInvoice(sale));
    }
  }, [saleId, preview, sales]);

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Facturación</h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Visor de resumen optimizado para copiar · Anthony Rivera Godoy
        </p>
      </div>

      {selected ? (
        <InvoiceViewer sale={selected} onClose={() => setSelected(null)} />
      ) : (
        <SaleList onSelect={(sale) => setSelected(saleToInvoice(sale))} />
      )}
    </div>
  );
}

export default function FacturacionPage() {
  return (
    <Suspense fallback={null}>
      <FacturacionContent />
    </Suspense>
  );
}
