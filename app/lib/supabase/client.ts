import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/app/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/app/lib/supabase/config";
/**
 * Cliente de Supabase para Client Components — todo lo que corre en el
 * navegador.
 *
 * `createBrowserClient` ya devuelve un singleton: llamar a `createClient()` en
 * diez componentes no crea diez clientes ni diez conexiones. Por eso se llama
 * en cada componente que lo necesite, en vez de exportar una instancia de
 * módulo.
 *
 * Para Server Components, Server Actions y Route Handlers va el otro fichero:
 * `@/app/lib/supabase/server`. Están separados a propósito — fusionarlos
 * arrastraría `next/headers` al paquete del navegador.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
