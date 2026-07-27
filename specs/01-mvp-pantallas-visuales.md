# SPEC 01 — MVP visual: las cinco pantallas de Arcade Vault

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-07-27
> **Objetivo:** Portar las cinco pantallas de `references/templates/` a rutas y componentes de Next 16, reutilizando la estética ya portada en `app/globals.css`, sin implementar ningún juego, sesión real ni backend.

---

## Alcance

**Dentro:**

- **Cinco rutas** en App Router, con URLs en inglés:
  - `/` — biblioteca (`biblioteca.jsx`)
  - `/games/[id]` — detalle del juego (`detalle.jsx`)
  - `/games/[id]/play` — reproductor (`reproductor.jsx`)
  - `/login` — acceso (`auth.jsx`)
  - `/hall-of-fame` — salón de la fama (`salon.jsx`)
- **Chrome global** en `app/layout.tsx`: barra de navegación (escritorio + panel
  móvil con backdrop) y pie de página, presentes en las cinco rutas.
- **Página 404** (`app/not-found.tsx`) con estética arcade, para IDs de juego
  inexistentes y rutas desconocidas.
- **Datos mock tipados** en `app/lib/`: los 8 juegos, las 5 categorías y el
  generador determinista de rankings, portados de `data.jsx` a TypeScript.
- **Estados visuales interactivos** que ya existen en las plantillas:
  - Biblioteca: búsqueda por nombre, filtro por categoría, estado vacío
    "NO HAY RESULTADOS", inclinación 3D de las tarjetas al pasar el cursor.
  - Login: pestañas INICIAR SESIÓN / CREAR CUENTA (el campo de correo entra
    con `slide-in` solo en la segunda).
  - Reproductor: alternar overlay "EN PAUSA" y abrir el modal "FIN DEL JUEGO",
    con el botón GUARDAR PUNTUACIÓN cambiando a "▸ PUNTUACIÓN GUARDADA_".
  - Salón: pestañas por juego que recalculan podio y tabla.
- **Metadatos por ruta** (`title`), incluido `generateMetadata` en el detalle
  para que el título use el nombre del juego.

**Fuera de alcance (para futuras specs):**

- Lógica de juego real: canvas, bucle de render, controles, colisiones,
  puntuación real. La arena del reproductor sigue siendo decoración CSS.
- Autenticación: el formulario de `/login` no valida, no registra y no crea
  sesión; su envío solo navega a `/`.
- Concepto de usuario en la aplicación: no hay `User`, ni Context, ni constante.
  El Nav muestra siempre "Iniciar Sesión", el reproductor muestra siempre
  "INVITADO" y la fila "TU MEJOR MARCA" del salón **no se porta**.
- OAuth: los botones GOOGLE y GITHUB son decorativos.
- Persistencia de cualquier tipo: ni `localStorage`, ni cookies, ni base de datos.
  Las puntuaciones del modal no se guardan en ninguna parte.
- Contador de créditos funcional: "CRÉDITOS · 03" es texto fijo.
- Tests: el repositorio no tiene runner configurado y esta spec no instala uno.
- Modo claro e internacionalización: la interfaz es oscura y está en español.

---

## Modelo de datos

No hay datos nuevos: se porta el contenido de `references/templates/data.jsx`
a TypeScript. Nada se persiste; todo vive en módulos importados en tiempo de build.

### `app/lib/types.ts`

```ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | Category;
export type Accent = "cyan" | "magenta" | "yellow" | "green";
export type CoverClass =
  | "cover-bricks" | "cover-tetro" | "cover-snake" | "cover-glot"
  | "cover-invaders" | "cover-rocas" | "cover-rana" | "cover-duelo";

export type Game = {
  id: string;          // slug de la URL: /games/bloque-buster
  title: string;       // "BLOQUE BUSTER", ya en mayúsculas
  short: string;       // una línea, para la tarjeta
  long: string;        // párrafo, para el detalle
  cat: Category;
  cover: CoverClass;   // clase CSS de la portada, ya existe en globals.css
  color: Accent;       // acento del botón JUGAR de la tarjeta
  best: number;        // 28450 -> se muestra con toLocaleString("es-ES")
  plays: string;       // "12.4K", ya viene formateado; NO es un número
};

export type ScoreRow = {
  rank: number;
  name: string;        // "PX_KAI"
  score: number;
  date: string;        // "07/03/2026", ya formateado
};
```

### `app/lib/games.ts`

Exporta `GAMES: Game[]` (los 8 juegos, contenido idéntico),
`CATEGORY_FILTERS: CategoryFilter[]` (`["TODOS","ARCADE","PUZZLE","SHOOTER","VERSUS"]`)
y `getGame(id: string): Game | undefined`.

### `app/lib/scores.ts`

Exporta `seededScores(seed: number, count = 12): ScoreRow[]`, portada tal cual
del generador congruencial de `data.jsx` (`s = (s * 9301 + 49297) % 233280`),
y `PLAYERS: string[]` con los 18 alias.

La semilla de cada juego es la **suma de los códigos de carácter de su `id`**,
no la longitud del `id` como en la plantilla.

### Convenciones

- **Todos los números se formatean con `toLocaleString("es-ES")`** (28.450), igual
  que en las plantillas.
- **Las fechas son cadenas `DD/MM/YYYY` ya formateadas.** No se construye ningún
  objeto `Date`, así que no hay diferencias de zona horaria entre servidor y cliente.
- **`seededScores` es determinista**: mismo `seed` produce siempre las mismas filas.
  Por eso puede ejecutarse en Server Components sin riesgo de desajuste de hidratación.

---

## Plan de implementación

Cada paso deja el proyecto compilando y navegable. Se ejecutan en orden.

1. **Datos y tipos.** Crear `app/lib/types.ts`, `app/lib/games.ts` y
   `app/lib/scores.ts` transcribiendo `references/templates/data.jsx`. Cambiar la
   semilla de `id.length` a la suma de los códigos de carácter del `id`.
   _Verificación:_ `npx tsc --noEmit` sin errores.

2. **Pie de página.** Crear `app/components/SiteFooter.tsx` con el `<footer>` de
   `app.jsx:43-45` y montarlo en `app/layout.tsx` dentro de `.av-shell`.
   _Verificación:_ el pie "© 2026 ARCADE VAULT" aparece bajo la página starter.

3. **Barra de navegación.** Crear `app/components/Nav.tsx` (Client Component: el
   panel móvil necesita `useState`). El estado activo sale de `usePathname()`, no
   de un prop `route`. Los `<a onClick>` del template pasan a `<Link href>`.
   El botón de sesión es un `<Link href="/login">` fijo con "Iniciar Sesión".
   _Verificación:_ por debajo de 840px (el breakpoint de `globals.css:318`) el
   botón ≡ abre el panel y el backdrop lo cierra.

4. **Tarjeta de juego.** Crear `app/components/GameCard.tsx` (Client Component: el
   efecto de inclinación usa `useRef` y `onMouseMove`). La tarjeta entera es un
   `<Link href={`/games/${game.id}`}>` y el botón JUGAR pasa a ser un
   `<span className="btn …">` decorativo, para no anidar un `<button>` dentro de
   un `<a>`. Eso elimina el `stopPropagation` del template.
   _Verificación:_ la tarjeta se inclina al pasar el cursor y navega al detalle.

5. **Biblioteca.** Crear `app/components/GameLibrary.tsx` (Client Component: hero,
   buscador, chips y grid con `useState` + `useMemo`) y reescribir `app/page.tsx`
   como Server Component que exporta `metadata` y lo renderiza. Borrar de `public/`
   los cinco SVG del scaffold, que dejan de usarse.
   _Verificación:_ `/` lista los 8 juegos; escribir "serp" deja solo SERPENTINA;
   el chip PUZZLE filtra; una búsqueda sin resultados muestra "NO HAY RESULTADOS".

6. **Página 404.** Crear `app/not-found.tsx` (Server Component) con estética arcade
   y un `<Link href="/">` de vuelta.
   _Verificación:_ `/cualquier-cosa` muestra la 404 con la barra y el pie.

7. **Detalle del juego.** Crear `app/components/Leaderboard.tsx` (Server Component,
   10 filas) y `app/games/[id]/page.tsx` (Server Component) que hace
   `const { id } = await params`, resuelve con `getGame(id)` y llama a `notFound()`
   si no existe. Añadir `generateMetadata` con el título del juego y
   `generateStaticParams` con los 8 IDs.
   _Verificación:_ `/games/caida` renderiza portada, descripción y ranking;
   `/games/no-existe` cae en la 404 del paso 6.

8. **Reproductor.** Crear `app/components/GamePlayerScreen.tsx` (Client Component)
   con el HUD de valores fijos (`game.best`, 3 vidas, nivel 03), la arena CRT, el
   overlay de pausa y el modal de fin de juego. Sin `setInterval` ni `Math.random`.
   Crear `app/games/[id]/play/page.tsx` (Server Component) que resuelve el juego
   igual que el paso 7 y le pasa el `game` por props.
   _Verificación:_ el HUD muestra 184.220 en `/games/caida/play`; PAUSA alterna el
   overlay; FIN abre el modal; GUARDAR PUNTUACIÓN cambia a "▸ PUNTUACIÓN GUARDADA_".

9. **Acceso.** Crear `app/components/AuthForm.tsx` (Client Component) con las dos
   pestañas y los campos controlados; el `onSubmit` hace `preventDefault()` y
   `router.push("/")`. El botón de invitado y los sociales navegan o no hacen nada,
   pero no crean sesión. Crear `app/login/page.tsx` como Server Component.
   _Verificación:_ la pestaña CREAR CUENTA muestra el campo de correo con
   `slide-in`; enviar el formulario navega a `/`.

10. **Salón de la fama.** Crear `app/components/HallOfFameBoard.tsx` (Client
    Component: pestañas con `useState` + `useMemo`) con podio y tabla de 12 filas,
    sin la rama del usuario. Crear `app/hall-of-fame/page.tsx` como Server Component.
    _Verificación:_ cambiar de pestaña recalcula podio y tabla, y CAÍDA y ROCAS
    muestran rankings distintos.

---

## Criterios de aceptación

### Compilación

- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta ningún problema.
- [ ] `npm run build` termina sin errores y lista las 5 rutas más la 404.
- [ ] `grep -rn "localStorage\|document.cookie\|fetch(" app/` no devuelve nada.
- [ ] Ninguna de las 5 rutas emite advertencias de hidratación en la consola.

### Navegación global

- [ ] Las 5 rutas y la 404 muestran la barra de navegación y el pie de página.
- [ ] Estando en `/games/caida`, el enlace "Biblioteca" del nav tiene clase `active`.
- [ ] A 375px de ancho, el botón ≡ abre el panel lateral y el backdrop lo cierra.
- [ ] El botón de sesión del nav dice siempre "Iniciar Sesión" y lleva a `/login`.
- [ ] `/games/no-existe` y `/ruta-inventada` muestran la misma 404 con estética arcade.

### Biblioteca (`/`)

- [ ] Se renderizan 8 tarjetas.
- [ ] Buscar "serp" deja exactamente 1 tarjeta: SERPENTINA.
- [ ] El chip SHOOTER deja exactamente 2 tarjetas: INVASORES y ROCAS.
- [ ] Con el chip PUZZLE activo y la búsqueda "zzz" aparece "NO HAY RESULTADOS".
- [ ] Pasar el cursor sobre una tarjeta la inclina; al salir vuelve a su posición.
- [ ] Pulsar en cualquier punto de la tarjeta navega a `/games/<id>`.

### Detalle (`/games/[id]`)

- [ ] `/games/caida` muestra "184.220" como mejor global, con punto de millar.
- [ ] El ranking lateral tiene 10 filas y la primera lleva la clase `top1`.
- [ ] "▶ JUGAR AHORA" lleva a `/games/caida/play` y "VOLVER AL VAULT" a `/`.
- [ ] El título del navegador contiene "CAÍDA".

### Reproductor (`/games/[id]/play`)

- [ ] `/games/caida/play` muestra Puntuación 184.220, Vidas ♥♥♥ y Nivel 03.
- [ ] Esos tres valores siguen idénticos tras 30 segundos sin interactuar.
- [ ] "Jugador" muestra INVITADO.
- [ ] PAUSA muestra el overlay "EN PAUSA" y el botón pasa a "REANUDAR"; pulsarlo
      de nuevo oculta el overlay.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] GUARDAR PUNTUACIÓN sustituye el input por "▸ PUNTUACIÓN GUARDADA_".
- [ ] Recargar la página devuelve el reproductor a su estado inicial.
- [ ] SALIR vuelve a `/games/caida`.

### Acceso (`/login`)

- [ ] La pestaña INICIAR SESIÓN muestra 2 campos; CREAR CUENTA muestra 3.
- [ ] Enviar el formulario vacío navega a `/` sin errores en consola.
- [ ] Tras enviarlo, el nav sigue diciendo "Iniciar Sesión".

### Salón de la fama (`/hall-of-fame`)

- [ ] Hay 8 pestañas y BLOQUE BUSTER está activa al cargar.
- [ ] El podio muestra los puestos en orden visual 02 · 01 · 03.
- [ ] La tabla tiene 12 filas.
- [ ] Las pestañas CAÍDA y ROCAS muestran rankings distintos entre sí.
- [ ] No aparece ninguna fila "TU MEJOR MARCA".

---

## Decisiones

### Rutas y navegación

- **Sí:** URLs en inglés (`/`, `/games/[id]`, `/games/[id]/play`, `/login`,
  `/hall-of-fame`), aunque la interfaz esté en español.
- **No:** URLs en español ni replicar los nombres internos del template
  (`/detalle`, `/player`), que son nombres de estado, no de recurso.
- **No:** portar el routing por `location.hash` de `app.jsx`. Impide enlaces
  compartibles, rompe el botón atrás y deja las 5 pantallas en una sola URL.
- **Sí:** `usePathname()` para el estado activo del nav, en lugar del prop `route`.
- **Sí:** dentro del `<Link>` de la tarjeta, JUGAR se renderiza como
  `<span className="btn …">`, no como `<button>`. Es un adorno visual: el
  destino ya es la tarjeta entera. `.card` declara `display: flex`
  (`globals.css:592`), así que cambiar el `div` por un `a` no altera el layout.
- **No:** dejar la tarjeta como `<div onClick>` con un `<Link>` interno. Recupera
  el `stopPropagation` y deja la tarjeta sin acceso por teclado.

### Sesión

- **Sí:** el MVP no tiene concepto de usuario. No hay tipo `User`, ni Context,
  ni constante de configuración.
- **No:** sesión en `localStorage`. Obliga a resolver la hidratación (el servidor
  no puede leerlo) para un dato que ninguna funcionalidad real consume todavía.
- **No:** sesión en cookie con `await cookies()`. Cero parpadeo, pero mete Server
  Actions y middleware en un MVP que es solo maquetación.
- **Consecuencia asumida:** la variante "logueado" del nav y la fila
  "TU MEJOR MARCA" del salón no existen en este MVP. Vuelven con la spec de auth.

### Reproductor

- **Sí:** puntuación, vidas y nivel fijos, tomados de `game.best`, 3 vidas y nivel 03.
- **No:** el `setInterval` con `Math.random()` de `reproductor.jsx:16`. Es
  simulación de juego, que es justo lo que esta spec deja fuera.
- **Sí:** PAUSA y FIN alternan estado local de UI. Sin ellos, dos de las tres
  vistas del reproductor serían inalcanzables y quedarían sin revisar.
- **Sí:** GUARDAR PUNTUACIÓN solo cambia el texto a "▸ PUNTUACIÓN GUARDADA_".
- **No:** escribir en `av_scores`. Nada lo consume y contradice "sin persistencia".

### Estilos y estructura

- **Sí:** reutilizar tal cual las clases de `app/globals.css`, ya portadas y
  revisadas en el commit `bbf4d27`.
- **No:** reescribir la maqueta con utilidades de Tailwind. Introduce deriva
  visual respecto al mockup sin ningún beneficio a cambio.
- **Sí:** `app/components/` y `app/lib/`. El alias `@/*` apunta a la raíz y
  `CLAUDE.md` ya ejemplifica `@/app/components/Foo`.
- **Sí:** Server Components por defecto; `"use client"` solo en los 6 componentes
  con estado o eventos: `Nav`, `GameCard`, `GameLibrary`, `GamePlayerScreen`,
  `AuthForm` y `HallOfFameBoard`.
- **No:** marcar las páginas como cliente. Perderían `metadata`,
  `generateMetadata` y `generateStaticParams`.

### Datos

- **Sí:** semilla del ranking = suma de los códigos de carácter del `id`.
- **No:** la fórmula `id.length * k` del template. `caida` y `rocas` miden lo
  mismo, así que comparten semilla y producen rankings idénticos fila por fila,
  visible al cambiar de pestaña en el salón.
- **Sí:** `generateStaticParams` con los 8 IDs. Los datos son estáticos, así que
  prerenderizar el detalle es gratis.
- **Sí:** `references/templates/` se queda en el repositorio como referencia.
  No se importa desde `app/` ni se borra.

### Convenciones del repositorio

- **Sí:** `app/not-found.tsx` único, que cubre a la vez el `notFound()` del
  detalle y las URLs sin ruta.
- **No:** `global-not-found.js`. Es experimental en Next 16 y obliga a duplicar
  layout, estilos y fuentes.
- **Sí:** las specs se escriben en español, con estados `Borrador` / `En revisión`
  / `Aprobado` / `Implementado` / `Obsoleto`.
- **No:** instalar un runner de tests. `CLAUDE.md` pide elegirlo de forma
  explícita cuando haga falta, y esta spec no lo necesita.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `toLocaleString("es-ES")` depende de los datos ICU disponibles. Si el Node que renderiza y el navegador difieren, "184.220" se convierte en una advertencia de hidratación en las 4 pantallas que muestran puntuaciones. | Si aparece la advertencia, sustituir por un helper `formatScore` en `app/lib/format.ts` que inserte el separador de millar a mano. Decisión aplazada hasta verla, para no añadir código preventivo. |
| `globals.css` usa selectores descendientes atados a la estructura exacta del DOM (`.card .row`, `.hall-table .tr`, `.podium .rank-num`). Cualquier "mejora" del markup rompe estilos en silencio, sin error de compilación. | Replicar la jerarquía de elementos de las plantillas, etiqueta por etiqueta. `globals.css` no se modifica en esta spec. |
| El bloque `prefers-reduced-motion` de `globals.css:1699` anula animaciones y transiciones CSS, pero **no** el `transform` que `GameCard` escribe desde JavaScript. Un usuario con movimiento reducido seguiría viendo las tarjetas inclinarse. | En `GameCard`, salir de `onMouseMove` si `window.matchMedia("(prefers-reduced-motion: reduce)").matches`. Son dos líneas y cierran el hueco. |

---

## Lo que **no** entra en esta spec

- Juego real: ni canvas, ni bucle, ni controles, ni colisiones, ni puntuación.
- Autenticación, registro y OAuth. El formulario de `/login` es maqueta.
- Cualquier concepto de usuario o sesión en la aplicación.
- Persistencia de cualquier tipo: `localStorage`, cookies o base de datos.
- Puntuaciones reales: los rankings son datos generados de forma determinista.
- Tests automatizados.
- Modo claro e internacionalización.

Cada uno de ellos, si llega, va en su propia spec.
