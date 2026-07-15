import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // ⚠️ AUTH TEMPORALMENTE DESACTIVADA ⚠️
    // Este matcher no coincide con ninguna ruta real, así que el
    // middleware nunca se ejecuta y /admin queda abierto sin login.
    // Úsalo solo mientras resuelves el usuario admin en Supabase.
    //
    // Para reactivar la protección, reemplaza el array de abajo por:
    // "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/__disabled_middleware_route_that_never_matches__",
  ],
};
