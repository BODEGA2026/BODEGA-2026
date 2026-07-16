"use client";

import { useMemo, useState } from "react";
import { Search, Package, Plus, Minus, X, CheckCircle2, Zap } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { calcTaxBreakdown, fmt } from "@/lib/finance";
import { toast } from "@/lib/store/useToastStore";
import type { CartItem } from "@/lib/types";

const PAYMENTS = ["Efectivo USD", "Efectivo VES", "Pago Móvil", "Zelle", "Binance Pay"];

/**
 * Venta Rápida — versión simplificada del POS.
 * Solo busca productos y muestra el total a cobrar en USD y Bs.
 * Sin datos de cliente, sin canal, sin cargos adicionales: pensada
 * para un cobro mostrador al instante.
 */
export default function VentaRapidaPage() {
  const { products, rates, confirmSale } = useAppStore();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState(PAYMENTS[0]);
  const [charging, setCharging] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.stock > 0 && (p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)))
      .slice(0, 8);
  }, [products, search]);

  const addItem = (p: (typeof products)[number]) => {
    setItems((curr) => {
      const existing = curr.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.qty >= p.stock) {
          toast("No hay más stock disponible", "warning");
          return curr;
        }
        return curr.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...curr, { productId: p.id, name: p.name, qty: 1, unitPrice: p.sale_price, unitCost: p.cost, taxType: p.tax_type }];
    });
    setSearch("");
  };

  const changeQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    setItems((curr) =>
      curr.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, prod?.stock ?? 99)) } : i))
    );
  };

  const removeItem = (productId: string) => setItems((curr) => curr.filter((i) => i.productId !== productId));

  const tax = useMemo(() => calcTaxBreakdown(items, products, true), [items, products]);
  const vesRate = rates?.dolar_bcv || 0;
  const totalVes = tax.total * vesRate;
  const costUSD = items.reduce((s, i) => s + i.unitCost * i.qty, 0);

  const handleCharge = async () => {
    if (!items.length) {
      toast("Agrega al menos un producto", "warning");
      return;
    }
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || prod.stock < item.qty) {
        toast(`Sin stock suficiente: ${item.name}`, "error");
        return;
      }
    }
    setCharging(true);
    const sale = await confirmSale({
      client_name: null,
      client_id: null,
      phone: null,
      address: null,
      gps_link: null,
      payment_method: payment,
      channel: "Mostrador",
      items,
      subtotal_usd: tax.baseImponible + tax.exento,
      base_imponible: tax.baseImponible,
      exento: tax.exento,
      iva_usd: tax.iva,
      total_usd: tax.total,
      cost_usd: costUSD,
      profit_usd: tax.total - costUSD,
      delivery: 0,
      commission: 0,
      tip: 0,
      apply_iva: true,
      rates_snapshot: rates,
    });
    setCharging(false);

    if (sale) {
      toast(`✅ Venta #${sale.invoice_num} cobrada: $${fmt(tax.total)}`, "success");
      setItems([]);
    } else {
      toast("Error al confirmar la venta", "error");
    }
  };

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight flex items-center gap-2">
          <Zap size={24} style={{ color: "var(--accent)" }} /> Venta Rápida
        </h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Busca el producto y cobra al instante — sin datos de cliente
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Buscador + resultados */}
        <div className="card">
          <div className="relative mb-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
            <input
              autoFocus
              className="input-field !pl-9 !text-[15px] !py-3"
              placeholder="Buscar producto por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search && (
            <div className="mt-3 flex flex-col divide-y divide-black/5 rounded-xl overflow-hidden" style={{ border: filtered.length ? "1.5px solid rgba(200,215,235,0.5)" : "none" }}>
              {filtered.length === 0 ? (
                <div className="text-center py-6 text-[13px]" style={{ color: "var(--ink-muted)" }}>
                  Sin coincidencias
                </div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ background: "rgba(255,255,255,0.6)" }}
                  >
                    <Package size={16} style={{ color: "var(--ink-muted)" }} />
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold">{p.name}</div>
                      <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>Stock: {p.stock}</div>
                    </div>
                    <div className="text-[13px] font-bold font-mono" style={{ color: "var(--accent)" }}>${fmt(p.sale_price)}</div>
                    <Plus size={15} style={{ color: "var(--accent)" }} />
                  </button>
                ))
              )}
            </div>
          )}

          <hr className="my-4 border-black/10" />

          {items.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--ink-muted)" }}>
              <Package size={28} className="mx-auto mb-2 opacity-50" />
              Busca un producto arriba para agregarlo
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-black/5">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 py-3">
                  <div className="flex-1 text-[14px] font-medium">{item.name}</div>
                  <div className="flex items-center gap-2">
                    <button className="neu-soft w-7 h-7 rounded-lg flex items-center justify-center" onClick={() => changeQty(item.productId, -1)}>
                      <Minus size={13} />
                    </button>
                    <span className="text-[15px] font-semibold min-w-[22px] text-center">{item.qty}</span>
                    <button className="neu-soft w-7 h-7 rounded-lg flex items-center justify-center" onClick={() => changeQty(item.productId, 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="text-[14px] font-bold font-mono min-w-[70px] text-right">${fmt(item.unitPrice * item.qty)}</div>
                  <button onClick={() => removeItem(item.productId)} style={{ color: "var(--danger)" }} aria-label="Quitar">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total a cobrar */}
        <div className="card sticky top-[76px]">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            💰 Total a Cobrar
          </h3>

          <div className="rounded-2xl p-5 text-white text-center mb-4" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)" }}>
            <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wide">En Divisas</div>
            <div className="text-[36px] font-bold my-1" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
              ${fmt(tax.total)}
            </div>
            <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.25)" }} />
            <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wide">En Bolívares</div>
            <div className="text-[26px] font-bold my-1" style={{ fontFamily: "var(--font-mono)" }}>
              {vesRate ? `Bs. ${fmt(totalVes)}` : "Configura la tasa BCV"}
            </div>
          </div>

          {tax.iva > 0 && (
            <div className="text-[11.5px] mb-4 px-1" style={{ color: "var(--ink-muted)" }}>
              Incluye ${fmt(tax.iva)} de IVA 16% sobre productos gravados.
            </div>
          )}

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Forma de Pago</label>
            <select className="input-field" value={payment} onChange={(e) => setPayment(e.target.value)}>
              {PAYMENTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-success w-full justify-center"
            disabled={charging || !items.length}
            style={{ opacity: charging || !items.length ? 0.6 : 1 }}
            onClick={handleCharge}
          >
            <CheckCircle2 size={16} /> {charging ? "Cobrando..." : "Cobrar Venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
