import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/app/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/app/lib/supabase/config";
/**
 * Refresca la cookie de sesión y devuelve la respuesta con las cookies y las
 * cabeceras ya aplicadas.
 *
 * Esto es fontanería, no política de acceso: **siempre** devuelve una respuesta
 * de continuación. No decide quién pasa, no protege rutas y no manda a nadie a
 * ninguna parte. Quien quiera proteger una ruta lo hace en la ruta.
 *
 * Existe desde antes de que haya sesión a propósito: sin este refresco, en
 * cuanto llegue la autenticación los tokens dejan de renovarse y los usuarios
 * se deslogean de forma aparentemente aleatoria — el fallo más caro de
 * diagnosticar de toda la integración.
 *
 * En Next 16 el proxy corre en el runtime de Node.js por defecto. No declares
 * `runtime` en un fichero de proxy: es un error de compilación.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });
  // El cliente se crea aquí, en cada petición. Nunca en una variable de módulo
  // ni en una global: con Fluid compute el módulo sobrevive entre peticiones y
  // se mezclarían las sesiones de dos usuarios.
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        // El segundo argumento trae `Cache-Control: private, no-store…`,
        // `Expires: 0` y `Pragma: no-cache`. Aplicarlas no es opcional: una
        // respuesta que escribe cookies de sesión y acaba en la caché de un
        // CDN le sirve la sesión de un usuario a otro.
        Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });
  // Entre `createServerClient` y esta llamada no va ninguna otra línea: es la
  // advertencia explícita de la documentación, y saltársela provoca deslogueos
  // aleatorios dificilísimos de reproducir.
  //
  // `getClaims()` y nunca `getSession()`: `getSession()` no revalida el token y
  // las cookies son falsificables, mientras que `getClaims()` verifica la firma
  // del JWT contra las claves públicas del proyecto. El valor se descarta —
  // esta spec no lee al usuario —, pero la llamada es la que dispara el
  // refresco del token.
  await supabase.auth.getClaims();
  return supabaseResponse;
}
