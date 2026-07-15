"use client";

import { ProductGrid } from "./ProductGrid";
import { CartPanel } from "./CartPanel";
import { PendingSalesList } from "./PendingSalesList";

export default function VentasPage() {
  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Punto de Venta</h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Gestión de ventas y cobros
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 items-start">
        <div>
          <ProductGrid />
          <PendingSalesList />
        </div>
        <CartPanel />
      </div>
    </div>
  );
}
