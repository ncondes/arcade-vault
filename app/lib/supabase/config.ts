/**
 * Configuración pública de Supabase, compartida por el cliente de navegador,
 * el de servidor y el proxy.
 *
 * Las dos variables son públicas a propósito: `NEXT_PUBLIC_` viaja al
 * navegador. Aquí nunca entra la contraseña de la base de datos, ni una clave
 * secreta, ni la del rol de servicio.
 *
 * A diferencia de `app/actions/contact.ts`, que lee su entorno dentro de la
 * acción, este módulo valida al importarse y lanza. La diferencia es
 * deliberada: Resend solo hace falta al pulsar el botón de /about, mientras que
 * estas dos variables las necesita cualquier petición que pase por el proxy.
 * Si faltan, no hay ningún camino que siga funcionando, así que es mejor un
 * error con el nombre de la variable que un `undefined` viajando hasta dentro
 * del cliente.
 */
// El acceso tiene que ser literal (`process.env.NOMBRE`, nunca
// `process.env[nombre]`): el bundler sustituye esa expresión exacta por su
// valor en tiempo de compilación para el paquete del navegador. Una lectura
// dinámica sale como `undefined` en el navegador aunque la variable exista.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !publishableKey) {
  const faltan = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ]
    .filter(Boolean)
    .join(", ");
  throw new Error(
    `Falta configuración de Supabase en el entorno: ${faltan}. ` +
      `Copia .env.example a .env y rellena esas claves.`
  );
}
export const SUPABASE_URL: string = url;
export const SUPABASE_PUBLISHABLE_KEY: string = publishableKey;
