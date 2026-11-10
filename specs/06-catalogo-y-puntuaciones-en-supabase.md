# SPEC 06 — Catálogo y puntuaciones en Supabase

> **Estado:** Implementado
> **Depende de:** 04-configuracion-de-supabase (implementada), 05-juego-asteroides (implementada)
> **Fecha:** 2026-11-09
> **Objetivo:** Mover el catálogo de juegos a una tabla `games` en Supabase y guardar de verdad las
> puntuaciones de los juegos jugables en una tabla `scores`, de la que salen todos los rankings,
> récords y estadísticas de la web — incluida una tabla nueva de mejores marcas por jugador en el
> hall of fame.

---

## Alcance

**Dentro:**

### Base de datos (una migración versionada)

- **Tabla `games`** con `id`, `title`, `short`, `long`, `category`, `cover`, `color` y `position`.
  `category`, `cover` y `color` son `text` con `check`, sin enums. Se siembran los 9 juegos actuales
  en la misma migración, en el orden de hoy (`asteroides` primero).
- **Tabla `scores`**: `id`, `game_id` (FK a `games.id`), `name`, `score` y `created_at`. Lleva
  `check` en la tabla: nombre `^[A-Z0-9_]{1,10}$` y score entero entre 0 y 10.000.000.
- **RLS activado en las dos tablas**, con políticas explícitas:
  - `games`: solo `select` para `anon` y `authenticated`.
  - `scores`: `select` e `insert` para `anon` y `authenticated`.
  - Ninguna política de `update` ni de `delete` en ninguna de las dos.
- **Agregados en Postgres, no en JS**: la mejor marca por jugador y juego, y lo que haga falta para
  el top global y la matriz. Su forma concreta está en _Modelo de datos_.
- **`database.types.ts` regenerado** con `npm run db:types`.

### Capa de datos (solo servidor)

- **`app/lib/data/games.ts`** — lectura del catálogo: la lista ordenada por `position` y un juego
  por `id`.
- **`app/lib/data/scores.ts`** — lectura de todos los rankings y estadísticas que listan las
  pantallas de abajo.
- **`app/actions/scores.ts`** — Server Action `saveScore`. Valida el nombre, el rango del score, que
  el juego exista y que `isPlayable(game_id)`. Inserta con el cliente de
  `app/lib/supabase/server.ts`.
- **`app/lib/games.ts`** se queda solo con `CATEGORY_FILTERS`, que es de UI. `GAMES` y `getGame`
  desaparecen.
- **Se borran** `app/lib/scores.ts` (`seededScores`, `gameSeed`, `PLAYERS`) y, de
  `app/lib/home.ts`, `RECENT_SCORES` y `TOP_PLAYERS`.
- **`Game` en `app/lib/types.ts`** pierde `best` y `plays`. Se derivan de `scores`.

### Pantallas

- **Todas se renderizan en cada petición.** El detalle pierde `generateStaticParams`.
- **Biblioteca (`/games`)**:
  - lee el catálogo de la BD;
  - `GameLibrary` lo recibe por props;
  - `GameCard` muestra la mejor marca real, o "—" si no hay ninguna.
- **Detalle (`/games/[id]`)**:
  - el leaderboard pasa a ser el top 10 real, con una fila por nombre;
  - el récord es el top 1;
  - la estadística `plays` se renombra a **PUNTUACIONES** y cuenta las filas de `scores` del juego.
- **Juego (`/games/[id]/play`)**:
  - en los juegos jugables, GUARDAR PUNTUACIÓN llama a `saveScore` y tiene tres estados: enviando,
    guardado y error con reintento;
  - el modal de las maquetas sigue sin guardar nada.
- **Hall of fame (`/hall-of-fame`)**:
  - pestañas desde la BD;
  - podio y top 12 reales por juego, con una fila por nombre;
  - el podio tolera 0, 1 o 2 filas;
  - sección nueva **POR JUGADOR**: matriz responsive (tabla en ≥ 768px, tarjetas en móvil), con el
    top 20 por marca individual más alta y columnas solo para los juegos que tienen puntuaciones;
  - los datos se leen en el servidor y se pasan al componente cliente de las pestañas: el
    navegador no habla con Supabase.
- **Home (`/`)**:
  - los destacados y la estadística `N+` salen del catálogo de la BD;
  - "últimas puntuaciones" pasa a ser las 7 más recientes, con "hace X" calculado en el servidor;
  - "top jugadores" pasa a ser el top 5 por marca individual más alta.
- **Estados vacíos**: "SIN PUNTUACIONES TODAVÍA" en todos los bloques de ranking.
- **Estados de error**:
  - si falla el catálogo, sale `error.tsx` con REINTENTAR;
  - si fallan solo las puntuaciones, cada bloque muestra "RANKING NO DISPONIBLE" y el resto de la
    página sigue.

### Matriz POR JUGADOR

- **Columnas**: solo los juegos con al menos una puntuación guardada, en el orden del catálogo. Hoy
  sería una columna (ASTEROIDES). Crece sola cuando entren tetris y arkanoid.
- **Escritorio (≥ 768px)**: tabla con una fila por jugador. Columnas: rango, nombre, una por cada
  juego con puntuaciones y "MEJOR" (su marca más alta, que es el criterio de orden).
- **Móvil (< 768px)**: cada jugador es una tarjeta apilada. Cabecera con rango, nombre y mejor
  marca; debajo, una línea por juego con `TÍTULO ····· score`, solo de los juegos en los que ha
  jugado. Ni "—" ni scroll horizontal.
- **Vacía**: "SIN PUNTUACIONES TODAVÍA".

### Documentación

- **`CLAUDE.md`** se actualiza para reflejar lo que cambia:
  - el catálogo y las puntuaciones viven en Supabase, y ya no es todo estático;
  - las dos tablas, las tres vistas y sus reglas de RLS;
  - la Server Action;
  - "añadir un juego" ahora incluye una migración que lo siembra en `games`.

**Fuera** — cada uno, si llega, en su propia spec:

- Autenticación real, `profiles` y asociar puntuaciones a un usuario. `AuthForm` sigue siendo
  maqueta.
- Anti-trampas y rate limiting. Un score falso enviado a mano se acepta como riesgo conocido.
- Editar, borrar o moderar puntuaciones, y cualquier panel de administración.
- Contador de partidas jugadas: `plays` desaparece en vez de medirse.
- Mover `HOME_STATS` (salvo el número de juegos), `FEATURES`, `FAQ` o `ABOUT` a la BD.
- Cambiar el texto de la FAQ que menciona "regístrate".
- Realtime: los rankings no se actualizan solos sin recargar.
- Paginación de rankings, página de perfil por jugador y búsqueda de jugadores.
- Unificar identidades: dos personas con las mismas iniciales cuentan como el mismo jugador.
- Guardar puntuaciones de juegos no jugables.
- Stack local con Docker, tests y runner de tests.

---

## Modelo de datos

### Migración

Un solo fichero, `supabase/migrations/<timestamp>_games_and_scores.sql`, creado con
`npm run db:migration games_and_scores`. Contiene tablas, índices, RLS, políticas, grants, vistas y
la siembra de los 9 juegos.

```sql
-- Catálogo
create table public.games (
  id        text primary key check (id ~ '^[a-z0-9-]+$'),
  title     text not null,
  short     text not null,
  long      text not null,
  category  text not null check (category in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover     text not null check (cover like 'cover-%'),
  color     text not null check (color in ('cyan','magenta','yellow','green')),
  position  smallint not null unique
);
-- Puntuaciones
create table public.scores (
  id          bigint generated always as identity primary key,
  game_id     text not null references public.games(id),
  name        text not null check (name ~ '^[A-Z0-9_]{1,10}$'),
  score       integer not null check (score between 0 and 10000000),
  created_at  timestamptz not null default now()
);
create index scores_game_score_idx on public.scores (game_id, score desc, created_at);
create index scores_created_idx    on public.scores (created_at desc);
```

### Seguridad

| Objeto         | RLS                 | `anon` y `authenticated`                                                                     |
| -------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `games`        | sí                  | `GRANT select` + política `select using (true)`                                              |
| `scores`       | sí                  | `GRANT select, insert` + política `select using (true)` + política `insert with check (...)` |
| vistas (abajo) | heredan de `scores` | `GRANT select`                                                                               |

- Ninguna tabla tiene política de `update` ni de `delete`, y no se hace ningún `GRANT` de esas
  operaciones.
- La política de `insert` repite en su `with check` la validación de nombre y rango. No queda como
  `with check (true)`, que el advisor marca como política permisiva.
- `cover` usa un `check` laxo (`like 'cover-%'`). La lista cerrada vive en el tipo TS `CoverClass`,
  y repetirla en SQL obligaría a una migración por cada portada nueva.

### Vistas (todas `with (security_invoker = true)`)

```sql
-- Una fila por (juego, nombre): su mejor marca y cuándo la consiguió por primera vez.
game_player_bests (game_id, name, score, achieved_at)
-- Una fila por juego con puntuaciones: récord y número total de filas guardadas.
game_stats (game_id, best, score_count)
-- Una fila por nombre: su marca individual más alta en cualquier juego.
player_bests (name, best, achieved_at)
```

- **Desempate:** con la misma puntuación gana quien la consiguió antes (`achieved_at` ascendente).
  Así un ranking no cambia de orden entre recargas.
- **Rango:** no se guarda en ninguna parte. Es el índice + 1 tras ordenar.

### Tipos de TypeScript (`app/lib/types.ts`)

```ts
// `Game` pierde `best` y `plays`; el resto de campos no cambia de nombre.
// `cat` se mapea desde la columna `category` en la capa de datos.
export type GameStats = { best: number; count: number };
// `ScoreRow` se mantiene: { rank, name, score, date: "07/03/2026" }.
// `RecentScore` se mantiene; `accent` sale de `games.color` y `ago` se calcula en el servidor.
// `TopPlayer` se mantiene: { player, score }.
export type PlayerRow = {
  rank: number;
  name: string;
  best: number;
  /** Solo los juegos en los que tiene marca: gameId -> mejor score. */
  scores: Record<string, number>;
};
```

### Capa de datos (`app/lib/data/`, con `import "server-only"`)

```ts
// games.ts — si falla, lanza (lo recoge error.tsx)
getGames(): Promise<Game[]>                       // ordenados por position
getGame(id: string): Promise<Game | null>         // null => notFound()
// scores.ts — null = "RANKING NO DISPONIBLE", [] = "SIN PUNTUACIONES TODAVÍA"
getGameStats(): Promise<Map<string, GameStats> | null>
getLeaderboard(gameId: string, limit: number): Promise<ScoreRow[] | null>  // 10 detalle, 12 hall
getRecentScores(limit: number): Promise<RecentScore[] | null>              // 7, home
getTopPlayers(limit: number): Promise<TopPlayer[] | null>                  // 5, home
getPlayerMatrix(limit: number): Promise<PlayerRow[] | null>                // 20, hall
```

### Server Action (`app/actions/scores.ts`)

```ts
export type SaveScoreResult = { ok: true } | { ok: false; error: string };
export async function saveScore(input: {
  gameId: string;
  name: string;
  score: number;
}): Promise<SaveScoreResult>;
```

La entrada se trata como no fiable y se valida en este orden: tipos, regex del nombre, entero en
rango, `isPlayable(gameId)` y que el juego exista. Si algo falla, devuelve `ok: false` con un
mensaje para el modal y no inserta nada.

### Convenciones

- **Fechas:** `dd/mm/aaaa` con `toLocaleDateString("es-ES")` en la zona horaria `Europe/Madrid`,
  fijada para que servidor y desarrollo den el mismo día.
- **"hace X":** calculado en el servidor al renderizar. "hace N s", "hace N min" y "hace N h" por
  debajo de 24 h; a partir de ahí, la fecha.

---

## Plan de implementación

Cada paso deja `npm run build` en verde y la web funcionando.

1. **Migración y tipos.**
   - Comprobar con `npx supabase migration --help` y `npx supabase db push --help` que los comandos
     siguen como en la spec 04.
   - `npm run db:migration games_and_scores </dev/null` y escribir en el fichero el SQL del modelo
     de datos: tablas, índices, RLS, políticas, grants, las 3 vistas y la siembra de los 9 juegos
     copiada de `GAMES`.
   - `npm run db:push -- --dry-run` para revisar qué se va a aplicar.
   - ⚠️ `npm run db:push` escribe en la **base de datos remota de producción**
     `vrepjeurrsaekrosmuye`. Antes de ejecutarlo se pide confirmación explícita a la persona.
   - Verificar con el MCP: `list_tables` muestra `games` (9 filas) y `scores` (0 filas), con RLS
     activado, y `get_advisors` (security) no da avisos sobre estas tablas ni vistas.
   - `npm run db:types`.
   - La app no cambia: nadie lee todavía de la BD.

2. **Tipos de dominio.**
   - `Game` pierde `best` y `plays`. Se añaden `GameStats` y `PlayerRow`.
   - `GAMES` en `app/lib/games.ts` pasa a tiparse como `(Game & { best: number; plays: string })[]`,
     con un comentario de que es transitorio hasta el paso 12.

3. **Capa de datos.**
   - `app/lib/data/games.ts` y `app/lib/data/scores.ts`, con `import "server-only"` (comprobar en
     `node_modules/next/dist/docs/` si hace falta instalar el paquete).
   - `getGames`/`getGame` lanzan si hay error; las funciones de `scores.ts` devuelven `null`.
   - Nadie las importa todavía.

4. **`app/error.tsx`** con REINTENTAR. Antes de escribirlo, leer en los docs de Next 16 la firma
   actual de las props de `error.js`.

5. **Estados de ranking.**
   - `Leaderboard` acepta `rows: ScoreRow[] | null`.
   - `null` pinta "RANKING NO DISPONIBLE" y `[]` pinta "SIN PUNTUACIONES TODAVÍA".

6. **Detalle y pantalla de juego.**
   - `/games/[id]` y `/games/[id]/play` leen `getGame` de la BD.
   - Se borra `generateStaticParams`.
   - El detalle usa `getLeaderboard(id, 10)` y `getGameStats()`: récord real o "—", y
     **PUNTUACIONES** con el conteo en lugar de `plays`.
   - En la maqueta, la puntuación del HUD pasa a ser `0`.

7. **Guardar puntuación.**
   - `app/actions/scores.ts` con `saveScore`.
   - El modal de `GamePlayerScreen`, solo en la rama jugable, tiene cuatro estados: listo, enviando
     (botón desactivado), guardado y error con reintento.
   - La rama maqueta sigue con su `setSaved(true)` de siempre.
   - Prueba manual: jugar a asteroides, guardar y ver la fila en el detalle tras recargar.

8. **Biblioteca.**
   - `/games` lee `getGames()` y `getGameStats()` en el servidor y se los pasa a `GameLibrary`.
   - `GameCard` muestra el récord real o "—".

9. **Hall of fame, ranking por juego.**
   - `page.tsx` lee los juegos y un `getLeaderboard(id, 12)` por juego, en paralelo, y se los pasa a
     `HallOfFameBoard`, que deja de importar `GAMES` y `seededScores`.
   - El podio pinta solo las posiciones que existen.
   - Si no hay filas, sale el estado vacío.

10. **Hall of fame, matriz POR JUGADOR.**
    - Componente nuevo `PlayerMatrix` (Server Component), alimentado con `getPlayerMatrix(20)` y
      los juegos con `score_count > 0`.
    - Tabla en ≥ 768px y tarjetas en móvil, con CSS en `globals.css`.
    - Usar el skill `/frontend-design` para su diseño.

11. **Home.**
    - Destacados y `N+` salen de `getGames()`.
    - "últimas puntuaciones" sale de `getRecentScores(7)`, con "hace X".
    - "top jugadores" sale de `getTopPlayers(5)`.
    - Los dos bloques tienen estado vacío y estado no disponible.

12. **Borrar lo estático.**
    - `app/lib/scores.ts` entero.
    - `GAMES` y `getGame` de `app/lib/games.ts`, junto con el tipo transitorio: queda solo
      `CATEGORY_FILTERS`.
    - `RECENT_SCORES` y `TOP_PLAYERS` de `app/lib/home.ts`.
    - `grep` para confirmar que no queda ningún import.

13. **`CLAUDE.md`.**
    - Corregir "All domain data is still static" y "The database still has zero tables".
    - Describir `games`/`scores`, las vistas, sus reglas de RLS y la Server Action.
    - En "Adding the next game", añadir que la ficha se siembra con una migración en `games`, no en
      `games.ts`.

---

## Criterios de aceptación

### Compilación y formato

- [ ] `npm run lint` termina sin errores ni warnings.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run format:check` pasa.
- [ ] `npx tsc --noEmit` no da errores.

### Base de datos

- [ ] `supabase/migrations/` contiene exactamente un fichero, `<timestamp>_games_and_scores.sql`.
- [ ] `npx supabase migration list --linked` muestra esa migración aplicada en local y en remoto.
- [ ] `games` tiene 9 filas, y la de `position` más baja es `asteroides`.
- [ ] `games` y `scores` tienen RLS activado.
- [ ] Las vistas `game_player_bests`, `game_stats` y `player_bests` existen con
      `security_invoker = true`.
- [ ] `get_advisors` (security) no devuelve avisos sobre `games`, `scores` ni las tres vistas.
- [ ] `npm run db:types` regenera `database.types.ts` idéntico al commiteado, y este incluye
      `games`, `scores` y las tres vistas.

### Seguridad (con `curl` contra la REST API y la clave publicable)

- [ ] `GET /rest/v1/games` devuelve las 9 filas.
- [ ] Un `POST` a `/rest/v1/games` se rechaza.
- [ ] Un `PATCH` y un `DELETE` contra `/rest/v1/scores` no modifican ni borran ninguna fila.
- [ ] Un `POST` a `/rest/v1/scores` con `name: "kai"` (minúsculas) se rechaza.
- [ ] Un `POST` a `/rest/v1/scores` con `score: 10000001` se rechaza.
- [ ] Un `POST` a `/rest/v1/scores` con un `game_id` inexistente se rechaza.
- [ ] `grep -rn "sb_secret\|service_role" app/ proxy.ts` no devuelve nada.
- [ ] `grep -rln "lib/supabase/client" app/` no devuelve nada: ninguna pantalla lee Supabase desde
      el navegador.

### Guardar puntuación

- [ ] Al terminar una partida de asteroides con nombre `KAI` y score > 0 y pulsar GUARDAR
      PUNTUACIÓN, aparece "PUNTUACIÓN GUARDADA" y `scores` tiene esa fila.
- [ ] Mientras se envía, el botón está desactivado, y un doble clic inserta una sola fila.
- [ ] Llamar a `saveScore` con `gameId: "rocas"` devuelve `ok: false` y no inserta nada.
- [ ] Llamar a `saveScore` con `name: ""` devuelve `ok: false` y no inserta nada.
- [ ] Llamar a `saveScore` con `score: -1` devuelve `ok: false` y no inserta nada.
- [ ] Llamar a `saveScore` con `score: 1.5` devuelve `ok: false` y no inserta nada.
- [ ] Con la red cortada en DevTools, el modal muestra un error, y el reintento guarda al restaurar
      la red.
- [ ] En el modal de una maqueta (p. ej. `/games/rocas/play`), GUARDAR PUNTUACIÓN no inserta
      ninguna fila.
- [ ] El HUD de una maqueta muestra `0` en Puntuación.

### Rankings y estadísticas (con datos reales)

Partida de prueba: `KAI` guarda 3 partidas de asteroides (500, 1200, 800) y `NEO` guarda 1 (1200,
después que KAI).

- [ ] El leaderboard de `/games/asteroides` muestra exactamente 2 filas, en este orden:
      `#01 KAI 1.200` y `#02 NEO 1.200`.
- [ ] El récord de `/games/asteroides` es `1.200`.
- [ ] La estadística PUNTUACIONES de `/games/asteroides` vale `4`.
- [ ] En `/games`, la tarjeta de asteroides muestra `1.200` y las demás tarjetas muestran "—".
- [ ] En `/hall-of-fame`, con la pestaña asteroides, el podio muestra KAI en oro, NEO en plata, y la
      plaza de bronce no se pinta.
- [ ] La tabla de esa pestaña tiene 2 filas.
- [ ] En `/hall-of-fame`, cualquier otra pestaña muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] En la home, "últimas puntuaciones" lista las 4 partidas, la más reciente primero, con
      "hace N s" o "hace N min".
- [ ] En la home, "top jugadores" muestra KAI y NEO con 1.200.
- [ ] Tras guardar una puntuación nueva, recargar el detalle y el hall of fame la muestra, sin
      rebuild ni espera de caché.
- [ ] Las fechas de los rankings salen como `dd/mm/aaaa` en `Europe/Madrid`.

### Matriz POR JUGADOR

- [ ] Sin puntuaciones, muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] Con los datos de prueba, tiene una sola columna de juego (ASTEROIDES), más rango, nombre y
      MEJOR.
- [ ] Muestra exactamente 2 jugadores.
- [ ] A 1280px de ancho, se ve como tabla.
- [ ] A 375px de ancho, se ve como tarjetas apiladas.
- [ ] A 375px, `document.documentElement.scrollWidth` es igual a `clientWidth` en `/hall-of-fame`,
      es decir, no hay scroll horizontal.
- [ ] Con más de 20 nombres en `scores`, muestra exactamente 20.

### Degradación

Prueba con la URL de Supabase rota temporalmente en `.env`:

- [ ] `/games` muestra `error.tsx` con REINTENTAR, no una página en blanco ni un 500 sin estilo.

Prueba con el catálogo bien pero sin poder leer las puntuaciones (forzando el `null` en
desarrollo):

- [ ] Los bloques de ranking muestran "RANKING NO DISPONIBLE".
- [ ] El resto de la página se renderiza.
- [ ] Un id inexistente (`/games/no-existe`) sigue mostrando `app/not-found.tsx`.

### Limpieza

- [ ] `app/lib/scores.ts` no existe.
- [ ] `grep -rn "seededScores\|gameSeed\|PLAYERS\|RECENT_SCORES\|TOP_PLAYERS\|GAMES\b" app/` no
      devuelve nada.
- [ ] `app/lib/games.ts` solo exporta `CATEGORY_FILTERS`.
- [ ] `Game` no tiene `best` ni `plays`.
- [ ] `grep -rn "generateStaticParams" app/games/` no devuelve nada.

### Regresión de las specs 01–05

- [ ] La biblioteca sigue filtrando por categoría.
- [ ] Asteroides se sigue jugando igual: HUD en vivo, pausa con Esc y auto-pausa al perder el foco.
- [ ] El formulario de `/about` sigue enviando por Resend.
- [ ] `AuthForm` sigue navegando a `/games` sin validar.

### CLAUDE.md

- [ ] No queda "All domain data is still static" ni "The database still has zero tables".
- [ ] Describe `games`, `scores`, las tres vistas, sus reglas de RLS y `saveScore`.
- [ ] "Adding the next game" incluye sembrar la ficha con una migración en `games`.

---

## Decisiones

### Alcance

- **Sí: catálogo y puntuaciones en una sola spec.** Lo pidió la persona de forma explícita, para
  hacerlo todo a la vez. Se descartó partirlo en "06 catálogo" + "07 puntuaciones", que era la
  recomendación inicial porque `scores.game_id` depende de `games`. Coste asumido: una spec grande
  que toca BD, servidor y cinco pantallas. Mitigación: el plan migra pantalla a pantalla con el
  sitio funcionando en cada paso.
- **Sí: solo guardan puntuación los juegos registrados en `registry.ts`.** En una maqueta no hay
  partida, así que lo que se guardaría sería inventado.
- **Sí: se borran `seededScores`, `PLAYERS`, `RECENT_SCORES` y `TOP_PLAYERS`, y se muestran estados
  vacíos.** No: mantener los datos inventados como relleno de los juegos no jugables. Mezclar datos
  reales e inventados es la incoherencia que se arrastra desde la spec 02, y esta spec existe para
  cerrarla.
- **Sí: `plays` desaparece y se sustituye por PUNTUACIONES (número de filas guardadas).**
  - No: un contador de partidas que sube en cada arranque. Sería otro endpoint de escritura
    anónima, trivial de inflar.
  - No: quitar la estadística sin más.

### Identidad y confianza

- **Sí: inserción anónima por Server Action, sin login.** No: esperar a la spec de autenticación.
  Así la web gana rankings reales ya, y la columna de usuario podrá añadirse después en otra
  migración.
- **Sí: un "jugador" es el texto de sus iniciales.** Dos personas que escriban `KAI` cuentan como el
  mismo jugador, y se acepta.
- **Sí: anti-trampas y rate limiting quedan fuera, como riesgo conocido.** Quien quiera mandar un
  score falso puede hacerlo, por la Server Action o directamente por la REST API con la clave
  publicable.
- **Sí: la validación se hace dos veces, en la Server Action y en la BD (`check` de la tabla más el
  `with check` de la política).** La Server Action da mensajes legibles. La BD es la única barrera
  real, porque la REST API es pública.
- **Sí: `isPlayable` solo se comprueba en la Server Action.** No: una columna `playable` en
  `games`. `CLAUDE.md` establece el registro como la única fuente de verdad de "jugable", y no se
  duplica. Coste: un insert directo por REST puede colar puntuaciones de maquetas (ver _Riesgos_).

### Esquema

- **Sí: `text` con `check` para `category`, `cover` y `color`.** No: enums de Postgres, porque
  añadir un valor exigiría `ALTER TYPE` en una migración aparte.
- **Sí: `cover` con un `check` laxo (`like 'cover-%'`).** La lista cerrada vive en `CoverClass`, en
  TS, y repetirla en SQL obligaría a una migración por cada portada nueva.
- **Sí: `position` explícito para el orden del catálogo.** No: ordenar por `title` o por fecha de
  alta, que perdería `asteroides` en primera posición.
- **Sí: `best` y `plays` salen de `games` y se derivan de `scores`.** Un valor guardado se
  desincroniza; uno derivado no.
- **Sí: una fila por nombre en los rankings, con su mejor marca.** No: todas las entradas al estilo
  recreativa, que dejaría a un solo jugador llenar el top 10.
- **Sí: desempate por quien llegó antes (`achieved_at` ascendente).** El orden es estable entre
  recargas y premia al primero que lo consiguió.
- **Sí: el top de jugadores se ordena por la marca individual más alta.** No: la suma de las mejores
  marcas por juego. Mezcla escalas incomparables (184.000 en CAÍDA frente a 12.800 en ASTEROIDES),
  y con un solo juego real la diferencia aún no importa.
- **Sí: los agregados se hacen en vistas de Postgres con `security_invoker = true`.**
  - No: agregar en JS, que trae todas las filas para quedarse con unas pocas.
  - No: funciones `SECURITY DEFINER`, que se saltan el RLS y quedan expuestas a `anon`.
  - No: vistas sin `security_invoker`, que también se saltan el RLS.
- **Sí: `GRANT` explícitos además de las políticas.** Según los ajustes de la Data API del proyecto,
  una tabla nueva puede no estar expuesta. Declararlo deja el acceso escrito en la migración en vez
  de depender del panel.
- **Sí: una sola migración con esquema, seguridad y siembra.** El estado intermedio "tabla sin RLS"
  no llega a existir nunca en remoto.

### Arquitectura

- **Sí: Supabase solo se lee desde el servidor, a través de `app/lib/data/` con `server-only`.** No:
  leer desde Client Components con `client.ts`. El hall of fame tiene pestañas en cliente, pero
  recibe todos los rankings por props. Los datos de 9 × 12 filas son pocos, y así el navegador nunca
  habla con Supabase.
- **Sí: `app/lib/data/` como carpeta nueva, separada de `app/lib/supabase/`.** `supabase/` es
  fontanería (clientes, config, proxy) y `data/` son consultas de dominio. Juntarlas mezclaría dos
  razones de cambio.
- **Sí: `games.ts` se queda con `CATEGORY_FILTERS`.** Los filtros son UI, no datos de dominio, y
  moverlos a la BD no aporta nada.
- **Sí: renderizado dinámico en cada petición, y el detalle pierde `generateStaticParams`.** No: ISR
  ni `revalidatePath` tras guardar. Una puntuación guardada tiene que verse al recargar, y con nueve
  juegos el coste de no prerenderizar es despreciable. Como `server.ts` ya lee cookies, la ruta
  sería dinámica de todos modos.
- **Sí: tipo transitorio `Game & { best; plays }` en `GAMES` hasta el paso 12.** Así cada paso
  compila mientras las pantallas migran una a una, en vez de un único paso grande que rompe cinco
  pantallas a la vez.

### Errores y estados

- **Sí: si falla el catálogo, `error.tsx` con REINTENTAR.** Sin juegos no hay página que salvar.
- **Sí: si fallan las puntuaciones, se degrada por bloque.** `null` significa "RANKING NO
  DISPONIBLE" y `[]` significa "SIN PUNTUACIONES TODAVÍA". Son dos estados distintos y la UI no los
  confunde.
- **Sí: el error al guardar se queda en el modal con reintento.** La puntuación de la partida no se
  pierde.

### UX

- **Sí: la matriz POR JUGADOR va dentro de `/hall-of-fame`.** No: una ruta `/players` nueva, porque
  es el mismo tema que el hall of fame.
- **Sí: la matriz solo tiene columnas para juegos con puntuaciones.** No: las 9 columnas fijas, que
  hoy serían 8 columnas de "—". Crece sola cuando entren tetris y arkanoid.
- **Sí: tabla en ≥ 768px y tarjetas apiladas en móvil.** No: scroll horizontal, que la persona
  rechazó por mala UX.
- **Sí: HUD de las maquetas a `0`.** No: mostrar el récord real, que mezclaría datos reales con una
  partida que no existe.
- **Sí: fechas en `Europe/Madrid` y "hace X" calculado en el servidor.** Así el resultado no depende
  de la zona horaria de la máquina que renderiza.

---

## Riesgos

| Riesgo                                                                                                                                                                                             | Mitigación                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spam o puntuaciones falsas.** La REST API acepta `insert` anónimo con la clave publicable, que es pública por diseño. Un script puede llenar `scores` de basura o poner un récord de 10.000.000. | Asumido en esta spec. El `check` acota el formato y el rango, y `update`/`delete` están cerrados, así que nadie borra puntuaciones ajenas. La limpieza se haría a mano con una migración. El rate limiting y la autenticación van en su propia spec. |
| **Puntuaciones de maquetas por REST.** `isPlayable` solo vive en la Server Action, así que un `POST` directo puede guardar un score de `rocas`, y aparecería en su ranking y en la matriz.         | Asumido y documentado en `CLAUDE.md`. Si se observa abuso, la spec de anti-trampas puede cerrar el `insert` de `anon` y mover la escritura a una función con su propia lista de juegos.                                                              |
| **Nombres ofensivos.** 10 caracteres `[A-Z0-9_]` bastan para un insulto en el hall of fame de un repo público.                                                                                     | Sin moderación en esta spec. Borrado manual por migración si pasa. La moderación queda fuera.                                                                                                                                                        |
| **`db:push` escribe en producción.** Un SQL con errores o sin RLS quedaría expuesto en remoto, y el repo es público.                                                                               | `--dry-run` primero, confirmación explícita antes del push real, y una sola migración, de modo que nunca existe una tabla sin RLS. `get_advisors` se pasa justo después.                                                                             |
| **Tablas no expuestas a la Data API.** Según los ajustes del proyecto, la tabla nueva puede no ser accesible para `anon`, y las lecturas devolverían error o vacío.                                | `GRANT` explícitos en la migración, y los criterios de seguridad comprueban la REST API con `curl`.                                                                                                                                                  |
| **Vistas que se saltan el RLS.** Una vista sin `security_invoker` expondría datos con los privilegios de su dueño.                                                                                 | `with (security_invoker = true)` en las tres vistas, comprobado en los criterios y por los advisors.                                                                                                                                                 |
| **Supabase lento o caído.** Con renderizado dinámico, cada página espera a la BD, y la home ahora depende de ella.                                                                                 | Degradación por bloque y `error.tsx` en el catálogo. Sin caché de respaldo: es un coste aceptado y se revisa si se nota la latencia.                                                                                                                 |
| **N consultas en el hall of fame.** Un `getLeaderboard` por juego son 9 peticiones en paralelo por cada carga, y crece con el catálogo.                                                            | Aceptable con 9 juegos. Si crece, se sustituye por una sola consulta a `game_player_bests` con ventana por juego.                                                                                                                                    |
| **Plan del free tier.** Los proyectos gratuitos se pausan por inactividad, y la web caería entera en `error.tsx`.                                                                                  | Fuera del control de la spec. El estado de error al menos es legible.                                                                                                                                                                                |
| **El tipo transitorio de `GAMES` se olvida.** Si el paso 12 no se completa, quedan dos fuentes de catálogo.                                                                                        | Hay criterios de limpieza que lo comprueban con `grep`.                                                                                                                                                                                              |
| **Coherencia entre fichas sembradas y `registry.ts`.** Un juego registrado sin fila en `games` no tendría detalle.                                                                                 | `CLAUDE.md` documenta que añadir un juego exige migración más registro, y `getGame` devuelve `null`, que cae en `notFound()`.                                                                                                                        |

---

## Lo que **no** entra en esta spec

- Autenticación real, `profiles` y asociar puntuaciones a un usuario. `AuthForm` sigue siendo
  maqueta.
- Anti-trampas, rate limiting y moderación de nombres.
- Editar o borrar puntuaciones, y cualquier panel de administración.
- Contador de partidas jugadas.
- Mover `HOME_STATS` (salvo el número de juegos), `FEATURES`, `FAQ` o `ABOUT` a la BD, y cambiar el
  texto de la FAQ.
- Realtime.
- Paginación de rankings, página de perfil por jugador y búsqueda de jugadores.
- Unificar identidades de jugadores con las mismas iniciales.
- Guardar puntuaciones de juegos no jugables.
- Convertir más juegos: tetris y arkanoid siguen esperando en `references/started-games/`.
- Stack local con Docker, tests y runner de tests.

Cada uno de ellos, si llega, va en su propia spec.
