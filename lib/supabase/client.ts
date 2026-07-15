import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para componentes de cliente ("use client").
// Requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
// configuradas como variables de entorno en Vercel.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
