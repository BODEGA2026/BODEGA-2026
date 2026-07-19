"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToastStore";

const today = () => new Date().toISOString().slice(0, 10);

export function PurchaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, addPurchase } = useAppStore();
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(today());
  const [productId, setProductId] = useState("");
  const [freeName, setFreeName] = useState("");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setSupplier("");
    setDate(today());
    setProductId("");
    setFreeName("");
    setQty("");
    setUnitCost("");
    setNotes("");
  };

  const handleSave = async () => {
    const q = parseInt(qty) || 0;
    const cost = parseFloat(unitCost);
    if (!supplier.trim() || q <= 0 || isNaN(cost)) {
      toast("Completa los campos obligatorios", "warning");
      return;
    }
    const selectedProduct = products.find((p) => p.id === productId);
    const ok = await addPurchase({
      purchase_date: date,
      supplier: supplier.trim(),
      product_id: productId || null,
      product_name: selectedProduct?.name || freeName.trim() || "Sin especificar",
      qty: q,
      unit_cost: cost,
      notes,
    });
    if (ok) {
      toast("✅ Compra registrada. Stock actualizado.", "success");
      reset();
      onClose();
    }
  };

  return (
    <Modal title="🛍️ Registrar Compra" open={open} onClose={() => { reset(); onClose(); }} onConfirm={handleSave}>
      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Proveedor *">
          <input className="input-field" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nombre del proveedor" />
        </Labeled>
        <Labeled label="Fecha">
          <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </Labeled>
        <Labeled label="Producto del Inventario">
          <select className="input-field" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">— Seleccionar (opcional) —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="O nombre libre">
          <input className="input-field" value={freeName} onChange={(e) => setFreeName(e.target.value)} placeholder="Si no está en inventario" disabled={!!productId} />
        </Labeled>
        <Labeled label="Cantidad *">
          <input type="number" min={1} className="input-field" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" />
        </Labeled>
        <Labeled label="Costo Unitario (USD) *">
          <input type="number" step="0.01" className="input-field" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0.00" />
        </Labeled>
      </div>
      <div className="mt-3">
        <Labeled label="Notas">
          <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" />
        </Labeled>
      </div>
    </Modal>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
