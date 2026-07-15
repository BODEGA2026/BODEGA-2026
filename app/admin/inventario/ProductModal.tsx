"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToastStore";
import type { Product, TaxType } from "@/lib/types";

const EMPTY = {
  name: "",
  sku: "",
  category: "",
  supplier: "",
  cost: "",
  sale_price: "",
  stock: "",
  min_stock: "5",
  variant: "",
  tax_type: "EXENTO" as TaxType,
};

export function ProductModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const upsertProduct = useAppStore((s) => s.upsertProduct);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku ?? "",
        category: product.category ?? "",
        supplier: product.supplier ?? "",
        cost: String(product.cost),
        sale_price: String(product.sale_price),
        stock: String(product.stock),
        min_stock: String(product.min_stock),
        variant: product.variant ?? "",
        tax_type: product.tax_type,
      });
    } else {
      setForm(EMPTY);
    }
  }, [product, open]);

  const handleSave = async () => {
    const cost = parseFloat(form.cost);
    const salePrice = parseFloat(form.sale_price);
    if (!form.name.trim() || isNaN(cost) || isNaN(salePrice)) {
      toast("Completa los campos obligatorios", "warning");
      return;
    }

    const payload: Partial<Product> & { id?: string } = {
      id: product?.id,
      name: form.name.trim(),
      sku: form.sku || null,
      category: form.category || null,
      supplier: form.supplier || null,
      variant: form.variant || null,
      cost,
      sale_price: salePrice,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      tax_type: form.tax_type,
    };
    // Si el costo sube, guarda el costo anterior (misma lógica que el original)
    if (product && cost > product.cost) payload.previous_cost = product.cost;

    await upsertProduct(payload);
    toast(product ? "Producto actualizado" : "Producto agregado", "success");
    onClose();
  };

  return (
    <Modal
      title={product ? "✏️ Editar Producto" : "+ Nuevo Producto"}
      open={open}
      onClose={onClose}
      onConfirm={handleSave}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ej: Camisa Polo" />
        <Field label="SKU / Código" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} placeholder="CAM-001" />
        <Field label="Categoría" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Ropa, Desechables..." />
        <Field label="Proveedor" value={form.supplier} onChange={(v) => setForm({ ...form, supplier: v })} placeholder="Nombre del proveedor" />
        <Field label="Costo de Compra (USD) *" value={form.cost} onChange={(v) => setForm({ ...form, cost: v })} type="number" placeholder="0.00" />
        <Field label="Precio de Venta (USD) *" value={form.sale_price} onChange={(v) => setForm({ ...form, sale_price: v })} type="number" placeholder="0.00" />
        <Field label="Stock Actual" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} type="number" placeholder="0" />
        <Field label="Stock Mínimo" value={form.min_stock} onChange={(v) => setForm({ ...form, min_stock: v })} type="number" placeholder="5" />
      </div>

      {/* Selector de tipo de impuesto — obligatorio, igual que el HTML original */}
      <div
        className="mt-4 rounded-xl p-3.5"
        style={{ background: "rgba(255,244,224,0.6)", border: "1.5px solid rgba(255,159,10,0.25)" }}
      >
        <label className="text-[13px] font-bold block mb-2">🧾 Tipo de Impuesto *</label>
        <div className="flex gap-3">
          <TaxOption
            label="IVA 16%"
            sub="Producto gravado"
            color="var(--warning)"
            selected={form.tax_type === "IVA16"}
            onClick={() => setForm({ ...form, tax_type: "IVA16" })}
          />
          <TaxOption
            label="Exento"
            sub="Sin impuesto aplicado"
            color="var(--success)"
            selected={form.tax_type === "EXENTO"}
            onClick={() => setForm({ ...form, tax_type: "EXENTO" })}
          />
        </div>
      </div>

      <div className="mt-3">
        <Field label="Talla / Color / Variante" value={form.variant} onChange={(v) => setForm({ ...form, variant: v })} placeholder="Ej: Talla M, Color Azul" />
      </div>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
        {label}
      </label>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        className="input-field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TaxOption({
  label,
  sub,
  color,
  selected,
  onClick,
}: {
  label: string;
  sub: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 text-left rounded-xl px-3.5 py-2.5 transition-all"
      style={{
        background: "rgba(255,255,255,0.7)",
        border: `1.5px solid ${selected ? color : "rgba(200,215,235,0.6)"}`,
      }}
    >
      <strong style={{ color }}>{label}</strong>
      <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
        {sub}
      </div>
    </button>
  );
}
