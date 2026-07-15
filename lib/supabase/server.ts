import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptionsWithName };

// Cliente de Supabase para Server Components y Route Handlers.
// Úsalo en /app/admin/* para validar la sesión del admin único
// antes de renderizar (misma estrategia que Délice Gourmet:
// sign-ups públicos deshabilitados, un solo usuario admin creado a mano).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se llama desde un Server Component — el middleware refresca la sesión.
          }
        },
      },
    }
  );
}
