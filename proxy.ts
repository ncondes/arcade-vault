import type { NextRequest } from "next/server";
import { updateSession } from "@/app/lib/supabase/proxy";
/**
 * Punto de entrada del proxy de Next. Lo único que hace es refrescar la sesión
 * de Supabase y dejar pasar la petición.
 *
 * En Next 16 este fichero se llama `proxy.ts` — antes era `middleware.ts` — y
 * corre en el runtime de Node.js por defecto.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
export const config = {
  matcher: [
    // Todo menos los estáticos y las imágenes: ejecutar el proxy en cada .svg
    // es coste puro, porque ahí no hay ninguna sesión que refrescar.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
