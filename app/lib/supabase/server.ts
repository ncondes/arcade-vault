import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/app/lib/supabase/database.types";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/app/lib/supabase/config";
/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Asíncrono porque en Next 16 las API de petición son promesas: `cookies()` se
 * espera. Devuelve un cliente nuevo en cada llamada y **nunca** se guarda en una
 * variable de módulo ni en una global: cada petición tiene sus propias cookies,
 * y compartir el cliente entre peticiones mezcla la sesión de un usuario con la
 * de otro.
 *
 * Para el navegador va el otro fichero: `@/app/lib/supabase/client`.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // `setAll` recibe un segundo argumento `headers` con las cabeceras de
      // caché que deben acompañar a las cookies de sesión. Aquí se omite porque
      // desde `cookies()` no se pueden tocar las cabeceras de la respuesta: de
      // eso se encarga el proxy, que sí las aplica.
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component, que no puede escribir cookies.
          // Es inofensivo mientras el proxy refresque la sesión, que es
          // justamente lo que hace `app/lib/supabase/proxy.ts`.
        }
      },
    },
  });
}
