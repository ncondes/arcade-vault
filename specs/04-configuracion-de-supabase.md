# SPEC 04 — Configuración de Supabase

> **Estado:** Implementado
> **Depende de:** 01-mvp-pantallas-visuales (implementada), 02-pantalla-de-inicio (implementada),
> 03-acerca-de-y-contacto (implementada)
> **Fecha:** 2026-08-28
> **Objetivo:** Conectar la aplicación al proyecto de Supabase `vrepjeurrsaekrosmuye` dejando
> instalados los clientes de navegador y servidor, el refresco de sesión en `proxy.ts`, la CLI
> enlazada con migraciones versionadas y los tipos generados — sin crear ni una tabla ni tocar la
> maqueta de login.

---

## Por qué existe esta spec

La spec 03 rompió la regla de "cero servidor" con Resend, pero siguió sin base de datos: su
sección _Lo que no entra_ dice literalmente "Persistir los mensajes: no hay base de datos, ni
panel, ni historial". Las tres specs anteriores dejan fuera "juego real, autenticación, concepto
de usuario, persistencia".

Esta spec no levanta ninguna de esas cosas. Levanta **el suelo** sobre el que se apoyarán: las
tres piezas canónicas de `@supabase/ssr`, la CLI enlazada y los tipos generados. Es
deliberadamente aburrida y deliberadamente pequeña, porque su valor está en que la spec de
autenticación y la del catálogo empiecen sin tener que decidir dónde viven los clientes ni cómo
se versiona el SQL.

Al terminar, **nada cambia para quien usa la web**. Ese es el criterio, no un defecto.

Estado del que se parte, comprobado: el proyecto `vrepjeurrsaekrosmuye` tiene **cero tablas** en
el esquema `public`; no hay carpeta `supabase/`, no hay `proxy.ts` y no hay ninguna dependencia
de Supabase en `package.json`.

---

## Alcance

**Dentro:**

- **Dependencias**: `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`; `supabase` (la
  CLI) en `devDependencies`. Versiones fijadas y `package-lock.json` commiteado.
- **Variables de entorno**: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  en `.env`, documentadas en `.env.example` junto a las tres claves que ya existen.
- **`app/lib/supabase/config.ts`** — lee y valida las dos variables públicas, con un error legible
  si falta alguna.
- **`app/lib/supabase/client.ts`** — `createBrowserClient<Database>`, para Client Components.
- **`app/lib/supabase/server.ts`** — `createServerClient<Database>` con `await cookies()` (las API
  de petición son asíncronas en Next 16) y el `setAll` envuelto en `try/catch`.
- **`app/lib/supabase/proxy.ts`** — `updateSession(request)`: refresca la cookie de sesión, aplica
  las cabeceras de caché a la respuesta y **devuelve siempre una respuesta de continuación**. No
  redirige, no protege, no decide nada.
- **`proxy.ts` en la raíz** — export `proxy` y `config.matcher` que excluye `_next/static`,
  `_next/image`, `favicon.ico` y los ficheros de imagen.
- **`app/lib/supabase/database.types.ts`** — generado desde el proyecto remoto. Con `public` vacío
  saldrá prácticamente hueco; se genera igual para fijar el patrón.
- **Carpeta `supabase/` versionada**: `config.toml` con `project_id`, el `.gitignore` que crea
  `supabase init`, y `migrations/` vacía con un `.gitkeep`.
- **Enlace al proyecto remoto** `vrepjeurrsaekrosmuye` (`supabase link`), con la salvedad de que
  `supabase login` es interactivo y lo ejecuta la persona, no el agente.
- **Scripts npm nuevos**: `db:types`, `db:push` y `db:migration`.
- **`CLAUDE.md` actualizado**: sección nueva de Supabase, los comandos que faltan y la corrección
  de dos párrafos obsoletos (ver _Cambios en CLAUDE.md_).

**Fuera** — cada uno, si llega, en su propia spec:

- Autenticación real. `AuthForm.tsx` sigue siendo maqueta y sigue haciendo `router.push("/games")`.
  No hay registro, ni login, ni logout, ni sesión, ni tabla `profiles`.
- Ninguna tabla, ninguna política RLS, ningún trigger, ninguna migración con contenido.
  `supabase/migrations/` queda vacía a propósito.
- Mover `GAMES`, `PLAYERS`, `seededScores`, `HOME` o `ABOUT` a la base de datos. Siguen estáticos.
- Realtime, Storage, Edge Functions, `pg_cron`, colas y vectores.
- Stack local con Docker (`supabase start`). Se trabaja contra el proyecto remoto.
- Cualquier cliente con clave secreta o `service_role`. En esta spec no existe ningún cliente
  privilegiado.
- Route handler de salud o script de comprobación (descartados, ver _Decisiones_).
- Tests. Sigue sin haber runner configurado.
- Desplegar o declarar las variables en el panel de ningún proveedor.

---

## Modelo de datos

**Esta spec no introduce ninguna tabla ni ningún tipo de dominio.** `app/lib/types.ts` no se toca.

Lo que sí introduce es un contrato de módulos, y ese es el que hay que respetar.

### `app/lib/supabase/config.ts`

```ts
/** Lanza al cargar el módulo si falta la variable, en vez de fallar con `undefined` durante una petición. */
export const SUPABASE_URL: string;
export const SUPABASE_PUBLISHABLE_KEY: string;
```

El acceso a las variables tiene que ser **literal** en este fichero
(`process.env.NEXT_PUBLIC_SUPABASE_URL`, nunca `process.env[nombre]`), porque el bundler sustituye
la expresión literal en tiempo de compilación para el paquete del navegador.

### `app/lib/supabase/client.ts`

```ts
/** Cliente de navegador. `createBrowserClient` ya es singleton: llamarlo varias veces no crea varios clientes. */
export function createClient(): SupabaseClient<Database>;
```

### `app/lib/supabase/server.ts`

```ts
/**
 * Cliente de servidor. Asíncrono porque `cookies()` es una promesa en Next 16.
 * Se crea uno nuevo por petición: nunca se guarda en un módulo ni en una global.
 */
export async function createClient(): Promise<SupabaseClient<Database>>;
```

### `app/lib/supabase/proxy.ts`

```ts
/**
 * Refresca la cookie de sesión y devuelve la respuesta con las cookies y las cabeceras aplicadas.
 * En esta spec NUNCA devuelve una redirección.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse>;
```

### `app/lib/supabase/database.types.ts`

Generado, no editado a mano. Exporta el tipo `Database`. Lleva una cabecera de comentario que dice
que se regenera con `npm run db:types` y que no se toca a mano.

---

## Plan de implementación

Cada paso deja el proyecto compilando.

1. **Dependencias.** `npm i @supabase/supabase-js @supabase/ssr` y `npm i -D supabase`. Commitear
   `package-lock.json`. Comprobar que `npm run build` sigue pasando sin usar nada todavía.

2. **Variables de entorno.** Añadir a `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL=https://vrepjeurrsaekrosmuye.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…` (la clave publicable del proyecto,
     no la `anon` heredada).

   Y en `.env.example`, las cinco claves vacías y comentadas: las dos nuevas, más `RESEND_API_KEY`,
   `CONTACT_TO_EMAIL` y `SUPABASE_DB_PASSWORD`, que hoy está en `.env` sin documentar.
   `.gitignore` ya cubre `.env*` con la excepción `!.env.example`: no se toca.

3. **`app/lib/supabase/config.ts`.** Lectura y validación de las dos variables públicas.

4. **Clientes.** `client.ts` y `server.ts`, todavía sin genérico. `npm run build` tiene que pasar
   con los dos ficheros presentes aunque nadie los importe.

5. **CLI y enlace al proyecto.**
   - `npx supabase login` — **paso manual e interactivo: lo ejecuta la persona, no el agente.**
   - `npx supabase init` — crea `supabase/config.toml` y `supabase/.gitignore`.
   - `npx supabase link --project-ref vrepjeurrsaekrosmuye` — usa `SUPABASE_DB_PASSWORD` de `.env`.
   - Crear `supabase/migrations/.gitkeep`.
   - Comprobar con `npx supabase migration list --linked`: la lista sale vacía y sin error.

6. **Tipos generados.** Confirmar los flags exactos con `npx supabase gen types --help` — no darlos
   por sabidos, la CLI los cambia entre versiones —, generar `app/lib/supabase/database.types.ts`
   y añadir el script `db:types`. Después, tipar los dos clientes con `<Database>`.

7. **Refresco de sesión.** `app/lib/supabase/proxy.ts` con `updateSession`, y `proxy.ts` en la raíz
   con su `matcher`. Arrancar `npm run dev` y confirmar que `/`, `/games`,
   `/games/bloque-buster`, `/about` y `/login` siguen respondiendo 200 y renderizando igual.

8. **Scripts npm restantes**: `db:push` y `db:migration`.

9. **`CLAUDE.md`**, con los tres cambios de la sección siguiente.

10. **Verificación final**: `npm run lint`, `npm run build` y `npm run format:check` en verde.

---

## Cambios en CLAUDE.md

Tres cosas, y solo tres:

1. **Bloque `## Commands`** — añadir los scripts que faltan. Hoy solo lista `dev`, `build`, `start`
   y `lint`: no están ni `format` ni `format:check`, que existen desde el hook de Prettier. Se
   añaden esos dos, más `db:types`, `db:push` y `db:migration`.

2. **Sección `## Supabase` nueva**, con lo que un agente necesita para no equivocarse:
   - Project ref `vrepjeurrsaekrosmuye`; la URL y la clave publicable viven en `.env`.
   - Qué cliente se usa dónde: `client.ts` solo en Client Components; `server.ts` en Server
     Components, Server Actions y Route Handlers, **creando uno nuevo por petición**.
   - `proxy.ts` refresca la sesión y **no protege rutas**: quien quiera proteger algo lo hace en
     la ruta, no ahí.
   - Nunca poner una clave secreta detrás de `NEXT_PUBLIC_`: todo lo que lleve ese prefijo viaja
     al navegador.
   - El esquema se cambia con migraciones versionadas en `supabase/migrations/`, creadas con
     `npm run db:migration <nombre>` y aplicadas con `npm run db:push`. Nunca SQL suelto contra el
     remoto sin fichero que lo respalde.
   - En cuanto exista la primera tabla en `public`: RLS activado, políticas explícitas y
     `database.types.ts` regenerado.
   - Existe el skill `supabase` en `.claude/skills/`: úsalo antes de tocar nada de Supabase.

3. **Corregir dos párrafos obsoletos** de `## What this project is`, desfasados desde la spec 01 y
   que confunden a cualquier agente que lea el fichero:
   - "the codebase is currently the unmodified `create-next-app` scaffold (`app/page.tsx` is still
     the starter page)" → **falso**: hay landing, biblioteca, detalle de juego, hall of fame,
     `/about` con Resend y login de maqueta.
   - "Those skills … are **not installed yet**" → **falso**: `.claude/skills/spec` y
     `.claude/skills/spec-impl` existen, y `specs/` tiene tres specs implementadas.

`AGENTS.md` no se toca.

---

## Criterios de aceptación

### Compilación y formato

- [ ] `npm run lint` termina sin errores ni warnings.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run format:check` pasa.
- [ ] `npx tsc --noEmit` no da errores: el genérico `<Database>` compila con el esquema vacío.

### Dependencias

- [ ] `package.json` tiene `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`.
- [ ] `package.json` tiene `supabase` en `devDependencies`.
- [ ] `package-lock.json` está actualizado y commiteado.
- [ ] `package.json` tiene los scripts `db:types`, `db:push` y `db:migration`.

### Entorno

- [ ] `.env` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con valor.
- [ ] `.env.example` documenta las cinco claves, todas con el valor vacío.
- [ ] `git status` no muestra `.env` como fichero a añadir.
- [ ] `grep -rn "sb_secret\|service_role" app/ proxy.ts` no devuelve nada.
- [ ] `grep -rn "NEXT_PUBLIC_" app/lib/supabase/` solo devuelve líneas de `config.ts`.

### Ficheros creados

- [ ] Existen `app/lib/supabase/config.ts`, `client.ts`, `server.ts`, `proxy.ts` y
      `database.types.ts`.
- [ ] Existe `proxy.ts` en la raíz, al mismo nivel que `app/`.
- [ ] `proxy.ts` exporta una función `proxy` y un `config` con `matcher`.
- [ ] `app/lib/supabase/database.types.ts` exporta el tipo `Database`.

### CLI enlazada

- [ ] Existe `supabase/config.toml` con `project_id = "vrepjeurrsaekrosmuye"`.
- [ ] Existe `supabase/migrations/`, vacía salvo el `.gitkeep`.
- [ ] `npx supabase migration list --linked` responde sin error.
- [ ] `npm run db:types` regenera `database.types.ts` sin error, y el resultado es idéntico al
      fichero commiteado.

### El proxy no cambia el comportamiento

- [ ] Con `npm run dev`, responden 200: `/`, `/games`, `/games/bloque-buster`,
      `/games/bloque-buster/play`, `/about`, `/hall-of-fame` y `/login`.
- [ ] Ninguna de esas rutas redirige a `/login`.
- [ ] `grep -n "redirect" app/lib/supabase/proxy.ts proxy.ts` no devuelve nada.
- [ ] Una ruta inexistente (`/no-existe`) sigue mostrando `app/not-found.tsx`.

### Regresión de las specs 01–03

- [ ] La biblioteca sigue filtrando por categoría, y los rankings siguen saliendo de
      `seededScores` con los mismos valores que antes.
- [ ] El formulario de `/about` sigue enviando por Resend.
- [ ] `AuthForm` sigue navegando a `/games` sin validar: esta spec no lo toca.
- [ ] `git diff` no muestra cambios en `app/lib/games.ts`, `app/lib/scores.ts`, `app/lib/home.ts`,
      `app/lib/about.ts` ni `app/lib/types.ts`.

### CLAUDE.md

- [ ] Tiene una sección `## Supabase`.
- [ ] `## Commands` lista `format`, `format:check`, `db:types`, `db:push` y `db:migration`.
- [ ] No queda ninguna frase que diga que el código es el scaffold sin modificar de
      `create-next-app`, ni que los skills de spec no están instalados.

---

## Decisiones

### Alcance

- **Solo configuración, sin ningún consumidor.** Pedido explícitamente y por duplicado durante la
  fase de preguntas ("solamente vamos a configurar supabase por ahora"). Se descartaron meter
  autenticación real y migrar el catálogo. El coste asumido: al terminar, la web se ve exactamente
  igual, y la única prueba de que algo funciona es que compila y que las páginas no se rompen.
- **Cero tablas.** `supabase/migrations/` queda vacía. La primera migración pertenece a la spec que
  necesite la primera tabla, junto con su RLS. Crear tablas "por adelantado" y sin políticas es
  precisamente el error que el skill de Supabase marca como crítico.

### Claves y entorno

- **Clave publicable moderna (`sb_publishable_…`), no la `anon` heredada.** El proyecto tiene las
  dos activas; la publicable se rota de forma independiente y es la recomendada para proyectos
  nuevos. La `anon` se deja sin usar y sin documentar en `.env.example`, para que nadie la copie.
- **Nombres `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**, que son los que
  usa la documentación actual de Supabase para Next.js. Descartado inventar nombres propios: así
  cualquier ejemplo copiado de la documentación encaja sin traducir.
- **`config.ts` valida y lanza si falta una variable.** Sin route handler de salud, una variable
  ausente solo se notaría como un fallo raro en tiempo de petición; un error con el nombre de la
  variable ahorra ese rato. Descartado el `!` de los ejemplos oficiales, que silencia el problema.
- **`SUPABASE_DB_PASSWORD` se documenta en `.env.example`** aunque ya estuviera en `.env`: la usa
  la CLI y hoy no aparece en ningún sitio versionado.

### Estructura

- **Los clientes van en `app/lib/supabase/`, no en un `lib/` de la raíz.** La documentación de
  Supabase usa `lib/supabase/`, pero este repo tiene todo su código compartido en `app/lib/` y no
  existe `src/`. Gana la coherencia del repo sobre la literalidad del ejemplo.
- **Un fichero por tipo de cliente.** `client.ts` y `server.ts` no se fusionan en un `index.ts`:
  mezclarlos arrastra `next/headers` al paquete del navegador.
- **La función se llama `createClient` en los dos ficheros**, y se distingue por la ruta de
  importación. Es la convención de la documentación y de la mayoría de proyectos.

### Refresco de sesión

- **`proxy.ts` entra ahora, sin redirecciones.** Sin él, en cuanto llegue la sesión los tokens
  dejan de refrescarse y los usuarios se desloguean de forma aparentemente aleatoria: el fallo más
  caro de diagnosticar de toda la integración. Entra la fontanería; la política de acceso —a quién
  se deja pasar— es de la spec de autenticación.
- **`getClaims()` y nunca `getSession()` dentro del proxy.** `getSession()` no revalida el token y
  las cookies son falsificables; `getClaims()` verifica la firma del JWT contra las claves públicas
  del proyecto. Queda escrito aquí porque la spec de autenticación heredará este fichero.
- **Entre `createServerClient` y la llamada a `getClaims()` no va ninguna otra línea.** Es la
  advertencia explícita de la documentación: cualquier cosa en medio provoca deslogueos aleatorios.
- **El `matcher` excluye estáticos e imágenes.** Ejecutar el proxy en cada `.svg` es coste puro.
- Nota de Next 16: el proxy corre en el runtime de **Node.js** por defecto, y declarar `runtime` en
  un fichero de proxy es un error de compilación.

### Verificación

- **Solo `build`, `lint` y comprobación manual en `dev`.** Se descartaron dos alternativas:
  - un route handler `/api/health/supabase`, que sí probaba las claves contra el proyecto pero
    añade una ruta pública que nadie pidió y que habría que acordarse de borrar;
  - un script `scripts/check-supabase.ts`, que no prueba el camino real de Next.

  Coste asumido y explícito: **esta spec no demuestra que las claves sean correctas.** Si la URL o
  la clave están mal, no se sabrá hasta la primera consulta real, en la spec siguiente.

### Tipos

- **`database.types.ts` se genera ya, con el esquema vacío.** El fichero casi no tendrá contenido,
  pero fija el patrón: los clientes nacen con `<Database>` y la primera spec con tablas solo tiene
  que ejecutar `npm run db:types`, sin volver a tocar `client.ts` ni `server.ts`.
- **Se genera con la CLI enlazada, no con el MCP.** Así el comando queda escrito en `package.json`
  y cualquiera puede repetirlo sin tener el MCP configurado.

### CLI

- **`supabase` como devDependency, no global.** La versión queda fijada en el lockfile: quien clone
  el repo tiene exactamente la misma CLI. Descartado Homebrew, que deja la versión fuera del
  control del repo.
- **Contra el remoto, sin `supabase start`.** Docker está disponible, pero levantar el stack local
  añade un requisito al arranque diario de un proyecto que hoy no tiene ni una tabla. Cuando haya
  esquema y RLS que probar, el stack local será su propia decisión.
- **`supabase login` es un paso manual.** Es interactivo y abre el navegador: el agente no puede
  completarlo. La spec lo marca como tal en vez de fingir que es automatizable.

---

## Riesgos

- **`supabase login` / `link` pueden bloquear la implementación.** Si la persona no ejecuta el
  login, los pasos 5 y 6 no se pueden completar y la spec queda a medias: clientes escritos, pero
  sin tipos ni carpeta `supabase/`. Mitigación: los pasos 1–4 y 7 no dependen del enlace, así que
  el trabajo se puede dividir.
- **La firma de `setAll` cambió entre versiones de `@supabase/ssr`.** Las versiones actuales pasan
  un segundo argumento `headers` con las cabeceras de caché que hay que aplicar a la respuesta en
  el proxy —si no se aplican, un CDN puede cachear la respuesta y filtrar la sesión a otro
  usuario—. Mitigación: comprobar la firma en los tipos de la versión que quede instalada, en vez
  de copiar un ejemplo de memoria.
- **El genérico `<Database>` con `public` vacío puede no compilar.** Según cómo genere la CLI el
  tipo sin tablas, `SupabaseClient<Database>` podría dar error. Mitigación: si pasa, dejar los
  clientes sin genérico y añadirlo en la spec que cree la primera tabla, anotándolo allí.
- **El proxy se ejecuta en todas las rutas HTML.** Sin cookie de sesión, `getClaims()` no hace
  petición de red, así que hoy el coste es despreciable — pero deja de serlo cuando haya sesión.
  Vigilarlo en la spec de autenticación.
- **Alguien puede meter la clave secreta con prefijo `NEXT_PUBLIC_`** y publicarla al navegador sin
  darse cuenta. Mitigación: la regla queda escrita en `CLAUDE.md` y hay un criterio de aceptación
  que lo comprueba con `grep`.
- **`config.ts` lanza si falta una variable**, así que un `.env` incompleto tumba la app entera en
  vez de degradar. Es intencionado: falla pronto y con el nombre de la variable en el mensaje.

---

## Lo que **no** entra en esta spec

- Autenticación real, `profiles`, sesión, logout y protección de rutas. `AuthForm` sigue siendo
  maqueta.
- Cualquier tabla, política RLS, trigger, vista o función. `supabase/migrations/` queda vacía.
- Mover `GAMES`, `PLAYERS`, `seededScores`, `HOME` o `ABOUT` a la base de datos.
- Persistir los mensajes del formulario de contacto de la spec 03.
- Realtime, Storage, Edge Functions, `pg_cron`, colas y vectores.
- Stack local con Docker.
- Cliente con clave secreta o `service_role`.
- Tests, que siguen fuera desde la spec 01.
- Despliegue y declaración de las variables en el panel del proveedor.
- La incoherencia entre `game.best` y `seededScores`, arrastrada desde la spec 02.

Cada uno de ellos, si llega, va en su propia spec.
