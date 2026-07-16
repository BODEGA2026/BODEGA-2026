import { type NextRequest, NextResponse } from "next/server";

/**
 * Autenticación DESACTIVADA PERMANENTEMENTE por decisión del negocio.
 * El panel /admin queda accesible sin login para cualquiera con el link.
 *
 * Si en el futuro quieres volver a proteger el panel, la forma correcta
 * es restaurar la llamada a updateSession() desde
 * lib/supabase/middleware.ts (ese archivo puede quedarse en el proyecto
 * sin usarse, no rompe nada por sí solo).
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
