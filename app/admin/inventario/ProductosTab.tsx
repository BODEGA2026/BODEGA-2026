"use client";

import { useMemo, useState } from "react";
import { Package, DollarSign, AlertTriangle, XCircle, Pencil, Trash2, Download, Plus, Search } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { StatCard } from "@/components/ui/StatCard";
import { fmt, usdToDisplay, getCurrencySymbol } from "@/lib/finance";
import { exportToExcel } from "@/lib/excel";
import { toast } from "@/lib/store/useToastStore";
import { ProductModal } from "./ProductModal";
import type { Product } from "@/lib/types";

export function ProductosTab() {
  const { products, rates, deleteProduct } = useAppStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"" | "low" | "ok">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[],
    [products]
  );

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    const matchesSearch = !s || p.name.toLowerCase().includes(s) || (p.sku ?? "").toLowerCase().includes(s);
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesStock =
      !stockFilter || (stockFilter === "low" ? p.stock <= p.min_stock : p.stock > p.min_stock);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalValue = products.reduce((s, p) => s + p.cost * p.stock, 0);
  const lowCount = products.filter((p) => p.stock <= p.min_stock).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  const openNew = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setModalOpen(true);
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    await deleteProduct(p.id);
    toast("Producto eliminado", "info");
  };

  const handleExport = () => {
    exportToExcel(
      products.map((p) => ({
        Producto: p.name,
        SKU: p.sku,
        Categoría: p.category,
        "Tipo Impuesto": p.tax_type === "IVA16" ? "IVA 16%" : "Exento",
        "Costo USD": p.cost,
        "Precio Venta USD": p.sale_price,
        Stock: p.stock,
        "Stock Mínimo": p.min_stock,
        "Valor Total USD": (p.cost * p.stock).toFixed(2),
        Proveedor: p.supplier,
        Variante: p.variant,
      })),
      "Inventario"
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end flex-wrap gap-2">
        <button className="btn-ghost btn-sm" onClick={handleExport}>
          <Download size={14} /> Excel
        </button>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Package} value={products.length} label="Productos" color="#5b8cf7" />
        <StatCard icon={DollarSign} value={`$${fmt(totalValue)}`} label="Valor del Inventario (USD)" color="#34c759" />
        <StatCard icon={AlertTriangle} value={lowCount} label="Stock Bajo" color="#ff9f0a" />
        <StatCard icon={XCircle} value={outCount} label="Sin Stock" color="#ff3b30" />
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative max-w-[260px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
            <input
              className="input-field !pl-9"
              placeholder="Buscar producto, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field max-w-[160px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="input-field max-w-[160px]"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as "" | "low" | "ok")}
          >
            <option value="">Todo el stock</option>
            <option value="low">⚠️ Stock bajo</option>
            <option value="ok">✅ Stock OK</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                {["Producto", "SKU", "Categoría", "Impuesto", "Costo (USD)", "Precio Venta", "Stock", "Valor Inv.", "Acciones"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10" style={{ color: "var(--ink-muted)" }}>
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    {products.length ? "Sin coincidencias" : "Agrega tu primer producto"}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stock <= p.min_stock;
                  const isRise = p.previous_cost != null && p.cost > p.previous_cost;
                  const spd = rates ? usdToDisplay(p.sale_price, rates) : null;
                  return (
                    <tr key={p.id} style={{ background: isRise ? "rgba(255,159,10,0.08)" : undefined }}>
                      <td className="px-4 py-3 text-[13.5px]" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <strong>{p.name}</strong>
                        {isRise && (
                          <span className="badge badge-warning ml-2">⚠️ Actualizar Precio</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
                        {p.sku || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-info">{p.category || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.tax_type === "IVA16" ? (
                          <span className="badge badge-warning">IVA 16%</span>
                        ) : (
                          <span className="badge badge-success">Exento</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]" style={{ fontFamily: "var(--font-mono)", color: isRise ? "var(--warning)" : undefined }}>
                        ${fmt(p.cost)}
                        {isRise && (
                          <div className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                            (ant: ${fmt(p.previous_cost)})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
                        ${fmt(p.sale_price)}
                        {spd && (
                          <div className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                            {getCurrencySymbol(rates!.global_currency)}
                            {fmt(spd.amount)} {spd.label}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        <span style={{ color: isLow ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                          {p.stock} {isLow ? "⚠️" : "✓"}
                        </span>
                        <div className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                          Mín: {p.min_stock}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                        ${(p.cost * p.stock).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button className="btn-ghost btn-xs" onClick={() => openEdit(p)} aria-label="Editar">
                            <Pencil size={13} />
                          </button>
                          <button className="btn-danger btn-xs" onClick={() => handleDelete(p)} aria-label="Eliminar">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} product={editingProduct} />
    </div>
  );
}
