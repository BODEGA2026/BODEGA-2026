import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_NAME = "Sistema de Gestión";

export async function generateMetadata(): Promise<Metadata> {
  // Intenta leer el nombre del negocio (solo funciona con sesión activa,
  // por RLS). En /login o sin sesión, cae al nombre genérico.
  let name = FALLBACK_NAME;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("business_settings").select("name").limit(1).maybeSingle();
    if (data?.name) name = data.name;
  } catch {
    // Sin sesión o sin conexión — usa el nombre genérico.
  }

  return {
    title: `${name} · Sistema Facturación`,
    description: "ERP — inventario, ventas, facturación e inteligencia de negocios.",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
