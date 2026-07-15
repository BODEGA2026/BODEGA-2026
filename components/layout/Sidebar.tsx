"use client";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Landmark,
  Wallet,
  Megaphone,
  LineChart,
  Calculator,
  Receipt,
  BrainCircuit,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ventas", label: "Ventas / POS", icon: ShoppingCart },
  { href: "/admin/inventario", label: "Inventario", icon: Package },
  { href: "/admin/compras", label: "Compras / Gastos", icon: ShoppingBag },
  { href: "/admin/cuentas", label: "Cuentas", icon: Landmark },
  { href: "/admin/financiero", label: "Financiero", icon: Wallet },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: LineChart },
  { href: "/admin/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/admin/facturacion", label: "Facturación", icon: Receipt },
  { href: "/admin/inteligencia", label: "Inteligencia de Negocios", icon: BrainCircuit },
  { href: "/admin/config", label: "Configuración", icon: Settings },
];

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-[100] w-[240px] glass-panel flex flex-col py-6 transition-transform duration-300 md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ borderRadius: 0 }}
    >
      <div className="px-5 pb-5 mb-3 border-b border-white/50">
        <h1 className="text-[15px] font-bold tracking-tight leading-tight">
          Anthony Rivera <span style={{ color: "var(--accent)" }}>Godoy</span>
        </h1>
        <p className="text-[10px] mt-1 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
          Sistema Facturación
          <br />
          Desechables y Ropa
        </p>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onNavigate} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-2 border-t border-white/50 flex flex-col gap-2 px-2">
        <Link href="/admin/config" onClick={onNavigate} className="btn-ghost btn-sm justify-center">
          <Settings size={14} /> Backup / Config
        </Link>
        <button onClick={handleLogout} className="btn-ghost btn-sm justify-center" style={{ color: "var(--danger)" }}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
