"use client";

import { CheckCircle2, X, Clock3 } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { usdToDisplay, fmt } from "@/lib/finance";
import { toast } from "@/lib/store/useToastStore";

export function PendingSalesList() {
  const { sales, rates, deletePendingSale } = useAppStore();
  const loadFromSale = useCartStore((s) => s.loadFromSale);
  const setField = useCartStore((s) => s.setField);

  const pending = sales.filter((s) => s.status === "pending");

  const handleLoad = async (id: string) => {
    const sale = pending.find((s) => s.id === id);
    if (!sale) return;
    loadFromSale({
      items: sale.items,
      client: sale.client_name || "",
      phone: sale.phone || "",
      address: sale.address || "",
      gps: sale.gps_link || "",
      channel: sale.channel || "Mostrador",
      delivery: sale.delivery,
      commission: 0, // se guarda como monto; el % se re-ingresa si aplica
      tip: sale.tip,
      applyIva: sale.apply_iva,
    });
    setField("payment", sale.payment_method || "Efectivo USD");
    await deletePendingSale(id);
    toast("Venta cargada. Confirma el pago.", "info");
  };

  const handleDelete = async (id: string) => {
    await deletePendingSale(id);
  };

  return (
    <div className="card">
      <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--ink-secondary)" }}>
        ⏳ Ventas Pendientes
      </h3>
      {pending.length === 0 ? (
        <div className="text-center py-6" style={{ color: "var(--ink-muted)" }}>
          <Clock3 size={24} className="mx-auto mb-2 opacity-50" />
          No hay ventas pendientes
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-black/5">
          {pending.map((s) => {
            const d = rates ? usdToDisplay(s.total_usd, rates) : null;
            return (
              <div key={s.id} className="flex items-center gap-2.5 py-2.5">
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">
                    {s.channel} — {s.client_name || "Sin nombre"}
                  </div>
                  <div className="text-[11.5px]" style={{ color: "var(--ink-muted)" }}>
                    {s.items.length} items · {new Date(s.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="text-[14px] font-bold" style={{ color: "var(--accent)" }}>
                  {d?.symbol}
                  {fmt(d?.amount)}
                </div>
                <button className="btn-success btn-xs" onClick={() => handleLoad(s.id)} aria-label="Cobrar">
                  <CheckCircle2 size={13} />
                </button>
                <button className="btn-ghost btn-xs" onClick={() => handleDelete(s.id)} aria-label="Eliminar">
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
