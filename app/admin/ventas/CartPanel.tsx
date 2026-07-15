"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, X, ShoppingCart, Trash2, PauseCircle, CheckCircle2, MessageCircle, Receipt } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { calcTaxBreakdown, usdToDisplay, fmt } from "@/lib/finance";
import { toast } from "@/lib/store/useToastStore";

const CHANNELS = ["Mostrador", "Delivery", "Mesa 1", "Mesa 2", "Mesa 3", "Online"];
const PAYMENTS = ["Efectivo USD", "Efectivo VES", "Pago Móvil", "Transferencia", "Zelle", "Binance Pay", "Crédito"];

export function CartPanel() {
  const router = useRouter();
  const { products, rates, business, clients, confirmSale, savePendingSale } = useAppStore();
  const cart = useCartStore();

  const tax = useMemo(() => calcTaxBreakdown(cart.items, products, cart.applyIva), [cart.items, products, cart.applyIva]);

  const delivery = parseFloat(cart.delivery) || 0;
  const commissionPct = parseFloat(cart.commission) || 0;
  const tip = parseFloat(cart.tip) || 0;
  const commissionAmt = tax.total * (commissionPct / 100);
  const grandTotal = tax.total + commissionAmt + delivery + tip;
  const costUSD = cart.items.reduce((s, i) => s + i.unitCost * i.qty, 0);

  const disp = rates ? usdToDisplay(grandTotal, rates) : null;
  const vesBcv = rates ? grandTotal * (rates.dolar_bcv || 1) : 0;
  const vesBin = rates ? grandTotal * (rates.binance || 1) : 0;
  const eur = rates && rates.dolar_bcv && rates.euro_bcv ? (grandTotal * rates.dolar_bcv) / rates.euro_bcv : 0;

  const autoFillFromClient = (name: string) => {
    cart.setField("client", name);
    const match = clients.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (match) {
      if (match.phone) cart.setField("phone", match.phone);
      if (match.address) cart.setField("address", match.address);
    }
  };

  const buildSalePayload = () => ({
    client_name: cart.client || null,
    client_id: null,
    phone: cart.phone || null,
    address: cart.address || null,
    gps_link: cart.gps || null,
    payment_method: cart.payment,
    channel: cart.channel,
    items: cart.items,
    subtotal_usd: tax.baseImponible + tax.exento,
    base_imponible: tax.baseImponible,
    exento: tax.exento,
    iva_usd: tax.iva,
    total_usd: grandTotal,
    cost_usd: costUSD,
    profit_usd: grandTotal - costUSD,
    delivery,
    commission: commissionAmt,
    tip,
    apply_iva: cart.applyIva,
    rates_snapshot: rates,
  });

  const handleConfirm = async () => {
    if (!cart.items.length) {
      toast("Carrito vacío", "warning");
      return;
    }
    for (const item of cart.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || prod.stock < item.qty) {
        toast(`Sin stock suficiente: ${item.name}`, "error");
        return;
      }
    }
    const sale = await confirmSale(buildSalePayload());
    if (sale) {
      const d = disp;
      toast(`✅ Venta #${sale.invoice_num} confirmada: ${d?.symbol}${fmt(d?.amount)} ${d?.label}`, "success");
      cart.clear();
    } else {
      toast("Error al confirmar la venta", "error");
    }
  };

  const handleSavePending = async () => {
    if (!cart.items.length) {
      toast("Carrito vacío", "warning");
      return;
    }
    await savePendingSale(buildSalePayload());
    toast("Guardado como pendiente", "info");
    cart.clear();
  };

  const handleWhatsApp = () => {
    if (!cart.items.length) {
      toast("Carrito vacío", "warning");
      return;
    }
    const biz = business;
    let msg = `🏪 *${biz?.name || "Anthony Rivera Godoy"}*\n`;
    if (biz?.rif) msg += `📋 RIF: ${biz.rif}\n`;
    if (biz?.address) msg += `📍 ${biz.address}\n`;
    if (biz?.phone) msg += `📞 ${biz.phone}\n`;
    msg += `\n━━━━━━━━━━━━━━━━\n`;
    msg += `📅 ${new Date().toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" })}\n`;
    if (cart.client) msg += `👤 Cliente: ${cart.client}\n`;
    if (cart.phone) msg += `📱 Tel: ${cart.phone}\n`;
    if (cart.address) msg += `📍 Dirección: ${cart.address}\n`;
    if (cart.gps) msg += `🗺️ Ver mapa: ${cart.gps}\n`;
    msg += `🛒 Canal: ${cart.channel}\n\n*DETALLE:*\n`;
    cart.items.forEach((item) => {
      const dItem = rates ? usdToDisplay(item.unitPrice, rates) : null;
      const taxTag = item.taxType === "IVA16" ? "[IVA]" : "[Ex]";
      msg += `• ${item.name} ${taxTag} x${item.qty} = ${dItem?.symbol}${fmt((dItem?.amount ?? 0) * item.qty)}\n`;
    });
    msg += `\n━━━━━━━━━━━━━━━━\n`;
    msg += `Base Imponible: $${fmt(tax.baseImponible)}\n`;
    msg += `Exento: $${fmt(tax.exento)}\n`;
    msg += `IVA 16%: $${fmt(tax.iva)}\n`;
    msg += `💰 *TOTAL: ${disp?.symbol}${fmt(disp?.amount)} ${disp?.label}*\n`;
    msg += `🇻🇪 Equivalente BCV: Bs. ${fmt(vesBcv)}\n\n¡Gracias por su compra! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleInvoicePreview = () => {
    if (!cart.items.length) {
      toast("Carrito vacío", "warning");
      return;
    }
    // El módulo de Facturación (próximo) lee este objeto de sessionStorage.
    sessionStorage.setItem(
      "pos-preview-sale",
      JSON.stringify({ ...buildSalePayload(), invoice_num: "PREV", created_at: new Date().toISOString() })
    );
    router.push("/admin/facturacion?preview=1");
  };

  return (
    <div className="card sticky top-[76px]">
      <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
        🧾 Orden Actual
      </h3>

      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Cliente</label>
        <input
          className="input-field"
          list="clients-datalist"
          value={cart.client}
          placeholder="Nombre del cliente"
          onChange={(e) => autoFillFromClient(e.target.value)}
        />
        <datalist id="clients-datalist">
          {clients.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Labeled label="Teléfono">
          <input className="input-field" value={cart.phone} placeholder="+58 412..." onChange={(e) => cart.setField("phone", e.target.value)} />
        </Labeled>
        <Labeled label="Dirección entrega">
          <input className="input-field" value={cart.address} placeholder="Dirección" onChange={(e) => cart.setField("address", e.target.value)} />
        </Labeled>
      </div>
      <div className="mb-4">
        <Labeled label="Link GPS (Google Maps)">
          <input className="input-field" value={cart.gps} placeholder="https://maps.google.com/..." onChange={(e) => cart.setField("gps", e.target.value)} />
        </Labeled>
      </div>

      {/* Toggle de IVA por venta */}
      <div
        className="rounded-xl px-3.5 py-3 mb-4 flex items-center justify-between gap-3"
        style={{ background: "rgba(255,244,224,0.8)", border: "1.5px solid rgba(255,159,10,0.3)" }}
      >
        <div>
          <div className="text-[12.5px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
            📋 Procesar IVA en esta venta
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
            Desactivar para marcar toda la venta como exenta
          </div>
        </div>
        <button
          onClick={() => cart.setField("applyIva", !cart.applyIva)}
          className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
          style={{ background: cart.applyIva ? "var(--accent)" : "rgba(200,210,230,0.6)" }}
          aria-label="Alternar IVA"
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
            style={{ transform: cart.applyIva ? "translateX(20px)" : "translateX(0)" }}
          />
        </button>
      </div>

      {/* Items del carrito */}
      {cart.items.length === 0 ? (
        <div className="text-center py-6" style={{ color: "var(--ink-muted)" }}>
          <ShoppingCart size={26} className="mx-auto mb-2 opacity-50" />
          Agrega productos al carrito
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-black/5 mb-2">
          {cart.items.map((item) => {
            const prod = products.find((p) => p.id === item.productId);
            const d = rates ? usdToDisplay(item.unitPrice * item.qty, rates) : null;
            return (
              <div key={item.productId} className="flex items-center gap-2.5 py-2">
                <div className="flex-1 text-[13px] font-medium">
                  {item.name}
                  <span className={`badge ml-1.5 !text-[9px] ${item.taxType === "IVA16" ? "badge-warning" : "badge-success"}`}>
                    {item.taxType === "IVA16" ? "IVA" : "Ex."}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="neu-soft w-6 h-6 rounded-lg flex items-center justify-center" onClick={() => cart.changeQty(item.productId, -1, prod?.stock ?? 99)}>
                    <Minus size={12} />
                  </button>
                  <span className="text-[14px] font-semibold min-w-[20px] text-center">{item.qty}</span>
                  <button className="neu-soft w-6 h-6 rounded-lg flex items-center justify-center" onClick={() => cart.changeQty(item.productId, 1, prod?.stock ?? 99)}>
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-[13px] font-semibold min-w-[60px] text-right" style={{ fontFamily: "var(--font-mono)" }}>
                  {d?.symbol}
                  {fmt(d?.amount)}
                </div>
                <button onClick={() => cart.removeItem(item.productId)} aria-label="Quitar" style={{ color: "var(--danger)" }}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <hr className="my-4 border-black/10" />

      <h4 className="text-[13px] font-semibold mb-2.5">➕ Cargos Adicionales</h4>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Labeled label="Delivery">
          <input type="number" step="0.01" className="input-field" value={cart.delivery} placeholder="0" onChange={(e) => cart.setField("delivery", e.target.value)} />
        </Labeled>
        <Labeled label="Comisión %">
          <input type="number" step="0.1" className="input-field" value={cart.commission} placeholder="0" onChange={(e) => cart.setField("commission", e.target.value)} />
        </Labeled>
        <Labeled label="Propina">
          <input type="number" step="0.01" className="input-field" value={cart.tip} placeholder="0" onChange={(e) => cart.setField("tip", e.target.value)} />
        </Labeled>
      </div>

      <div className="mb-4">
        <Labeled label="Forma de Pago">
          <select className="input-field" value={cart.payment} onChange={(e) => cart.setField("payment", e.target.value)}>
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Labeled>
      </div>
      <div className="mb-4">
        <Labeled label="Canal">
          <select className="input-field" value={cart.channel} onChange={(e) => cart.setField("channel", e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Labeled>
      </div>

      {/* Desglose de IVA */}
      <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(240,245,255,0.7)", border: "1px solid rgba(200,220,255,0.5)" }}>
        <TaxRow label="Base Imponible (Gravada)" value={`$${fmt(tax.baseImponible)}`} />
        <TaxRow label="Exento" value={`$${fmt(tax.exento)}`} />
        <TaxRow label="IVA 16%" value={`$${fmt(tax.iva)}`} color="var(--warning)" />
        <TaxRow label="Total General" value={`$${fmt(grandTotal)}`} bold />
      </div>

      {/* Multi-moneda */}
      <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(240,245,255,0.7)", border: "1px solid rgba(200,220,255,0.5)" }}>
        <TaxRow label="💵 USD" value={`$${fmt(grandTotal)}`} />
        <TaxRow label="📱 Bs. Binance" value={`Bs. ${fmt(vesBin)}`} />
        <TaxRow label="🏦 Bs. BCV" value={`Bs. ${fmt(vesBcv)}`} />
        <TaxRow label="💶 Euros BCV" value={`€ ${fmt(eur)}`} />
      </div>

      {/* Total a cobrar */}
      <div className="rounded-2xl p-4 text-white mb-3" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)" }}>
        <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wide">Monto a cobrar al cliente</div>
        <div className="flex items-end gap-2 my-1.5">
          <div className="text-[28px] font-bold" style={{ fontFamily: "var(--font-mono)", letterSpacing: "-1px" }}>
            {fmt(disp?.amount)}
          </div>
          <div className="text-[14px] font-medium opacity-85">{disp?.label}</div>
        </div>
        <div className="text-[12px] opacity-75">≈ {fmt(vesBcv)} VES</div>
      </div>

      <div className="flex gap-2 mb-2">
        <button className="btn-ghost btn-sm flex-1 justify-center" onClick={() => cart.clear()}>
          <Trash2 size={14} /> Limpiar
        </button>
        <button className="btn-warning btn-sm flex-1 justify-center" onClick={handleSavePending}>
          <PauseCircle size={14} /> Pendiente
        </button>
        <button className="btn-success flex-[2] justify-center" onClick={handleConfirm}>
          <CheckCircle2 size={16} /> Confirmar
        </button>
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost btn-sm flex-1 justify-center" onClick={handleWhatsApp}>
          <MessageCircle size={14} /> WhatsApp
        </button>
        <button className="btn-ghost btn-sm flex-1 justify-center" onClick={handleInvoicePreview}>
          <Receipt size={14} /> Factura
        </button>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11.5px] font-semibold" style={{ color: "var(--ink-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

function TaxRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 ${bold ? "border-t border-black/10 mt-1 pt-2" : ""}`}>
      <span className="text-[12px]" style={{ color: "var(--ink-muted)" }}>{label}</span>
      <span
        className="font-mono font-semibold"
        style={{ color: color ?? "var(--ink)", fontSize: bold ? 13.5 : 12, fontWeight: bold ? 700 : 600 }}
      >
        {value}
      </span>
    </div>
  );
}
