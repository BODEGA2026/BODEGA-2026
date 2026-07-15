"use client";

import { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { usdToDisplay, fmt } from "@/lib/finance";
import { toast } from "@/lib/store/useToastStore";

export function ProductGrid() {
  const { products, rates } = useAppStore();
  const addItem = useCartStore((s) => s.addItem);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.stock > 0 && (p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleAdd = (p: (typeof products)[number]) => {
    if (p.stock <= 0) {
      toast("Sin stock disponible", "warning");
      return;
    }
    addItem(
      { productId: p.id, name: p.name, qty: 1, unitPrice: p.sale_price, unitCost: p.cost, taxType: p.tax_type },
      p.stock
    );
    toast(`${p.name} agregado`, "success");
  };

  return (
    <div className="card mb-4">
      <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--ink-secondary)" }}>
        📦 Productos
      </h3>
      <div className="relative mb-3.5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
        <input
          className="input-field !pl-9"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-8" style={{ color: "var(--ink-muted)" }}>
            <Package size={28} className="mx-auto mb-2 opacity-50" />
            {products.length ? "Sin coincidencias" : "Agrega productos al inventario"}
          </div>
        ) : (
          filtered.map((p) => {
            const d = rates ? usdToDisplay(p.sale_price, rates) : null;
            return (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                className="text-center rounded-2xl px-3 py-3.5 transition-all"
                style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(200,215,235,0.5)" }}
              >
                <div className="text-[12.5px] font-semibold mb-1 line-clamp-2">{p.name}</div>
                {d && (
                  <div className="text-[12px] font-mono" style={{ color: "var(--accent)" }}>
                    {d.symbol}
                    {fmt(d.amount)} {d.label}
                  </div>
                )}
                <div className="text-[10.5px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                  Stock: {p.stock}
                </div>
                {p.tax_type === "IVA16" ? (
                  <span className="badge badge-warning mt-1.5 !text-[9px]">IVA 16%</span>
                ) : (
                  <span className="badge badge-success mt-1.5 !text-[9px]">Exento</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
