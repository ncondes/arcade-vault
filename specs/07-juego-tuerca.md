# SPEC 07 — Tuerca, el segundo juego real

> **Estado:** Implementado
> **Depende de:** 05-juego-asteroides (implementada), 06-catalogo-y-puntuaciones-en-supabase (implementada)
> **Fecha:** 2026-11-15
> **Objetivo:** Portar `references/started-games/03-tetris/game.js` como el juego jugable `tuerca`,
> sembrado en el catálogo con una migración, para que sus puntuaciones lleguen a los rankings que ya
> existen.

---

## Por qué existe esta spec

La spec 05 diseñó el contrato del runtime con un solo juego delante, y la 06 hizo que cualquier
juego registrado guarde puntuaciones. Tuerca es el primer juego que entra por la receta de
`CLAUDE.md`: una carpeta en `app/lib/arcade/`, una línea en `registry.ts` y una migración en
`games`.

Pone a prueba el contrato en dos puntos que asteroides no tocó:

- **No tiene vidas.** La partida acaba cuando la pila toca el techo. `ArcadeSnapshot.lives` pasa a
  aceptar `null`, y el HUD oculta "Vidas" en ese caso.
- **Repite teclas.** Mover, bajar y rotar dependen de la autorrepetición del sistema. `keyboard.ts`
  gana `typed()`, que se suma a `pressed()` sin cambiarlo.

Las dos ampliaciones son aditivas: asteroides se tiene que comportar exactamente igual.

Lo que esta spec **no** necesita es código de ranking. El top 10 del detalle, la tarjeta, la
pestaña y el podio del hall of fame, la matriz POR JUGADOR y la home ya salen de `scores`. Aquí solo
se comprueban.

---

## Alcance

**Dentro:**

### Catálogo

- **Migración `add_tuerca`**, creada con `npm run db:migration add_tuerca`. Es un `insert` de la
  fila `tuerca` al final del catálogo, en `max(position) + 1` (hoy, 10), y no toca ninguna otra
  fila.
  - `title` `TUERCA`, `category` `PUZZLE`, `color` `cyan` y `cover` `cover-tuerca`.
  - `short` y `long` como en _Modelo de datos_.
- **`CoverClass`** en `app/lib/types.ts` gana `"cover-tuerca"`.
- **`.cover-tuerca`** en `app/globals.css`: un pozo con su contorno, una pila con un hueco y una
  tuerca cayendo con su fantasma. Tiene que distinguirse de `.cover-tetro` a tamaño de tarjeta.
- **Cascadas aceptadas:**
  - la biblioteca pasa a 10 tarjetas;
  - la estadística de la home pasa a `10+`;
  - el hall of fame pasa a 10 pestañas, con TUERCA la última;
  - los 6 destacados de la home y la pestaña por defecto (ASTEROIDES) no cambian.
- **`caida` no se toca:** su fila, su portada y su maqueta siguen igual.

### Contrato (ampliaciones aditivas)

- **`app/lib/arcade/types.ts`:**
  - `ArcadeSnapshot.lives` pasa a `number | null`, y `null` significa "este juego no tiene vidas";
  - el comentario de `restart()` deja de decir "vidas a 3" y dice "vidas a su valor inicial".
- **`app/components/GamePlayerScreen.tsx`**, solo la rama jugable:
  - con `lives === null` no se pinta el bloque "Vidas";
  - "aún no hay instantánea" (3 corazones por defecto) se distingue de "sin vidas", porque
    `null ?? 3` daría `3`;
  - la rama de maqueta no cambia.
- **`app/lib/arcade/keyboard.ts`:**
  - `typed(code)` nuevo, que cuenta cada `keydown` (repeticiones del sistema incluidas) y se
    consume al leerlo;
  - `held()`, `pressed()` y `clear()` no cambian.

### Motor `app/lib/arcade/tuerca/`

- **TypeScript puro**: recibe el canvas, guarda el estado en la instancia y los colores en
  `constants.ts`. No usa `getElementById`, `getComputedStyle` ni globales.
- **Números portados 1:1:**
  - tablero de 10 × 20 y `BLOCK` de 30;
  - 8 piezas (I, O, T, S, Z, J, L y la **tuerca**), elegidas con `Math.random()` uniforme;
  - aparición en `x = 5 − floor(ancho/2)`, `y = 0`;
  - rotación horaria con kicks `[0, −1, 1, −2, 2]`;
  - `LINE_SCORES [0, 100, 300, 500, 800]` × el nivel, hard drop +2 por celda y soft drop +1 por
    fila;
  - nivel = `floor(lines/10) + 1`, sin tope, e intervalo de caída
    `max(100, 1000 − (nivel − 1) · 90)` ms;
  - sin lock delay: la pieza se fija en el tick de gravedad, o en el soft drop si choca;
  - fin de partida cuando la pieza nueva choca al aparecer.
- **Controles:**
  - `typed()` para `←`, `→` (mover), `↓` (soft drop), y `↑` y `X` (rotar);
  - `pressed()` para `Espacio` (hard drop): mantenerlo pulsado suelta una sola pieza.
- **Cuatro correcciones de plataforma**, que no cambian el balance:
  - el acumulador de caída resta el intervalo (`acc -= interval`), como mucho una fila por
    fotograma y con el acumulador acotado;
  - `keyboard.clear()` justo después de `attach()` en `start()`;
  - un `draw()` explícito al entrar en `gameover`;
  - la puntuación con `Math.floor` y acotada a `[0, 10000000]`.
- **Lienzo de 800×600:**
  - el tablero centrado (x de 250 a 550);
  - el panel izquierdo con LÍNEAS y el derecho con SIGUIENTE;
  - HiDPI con `devicePixelRatio`, igual que asteroides.
- **Retematizado** a la paleta de neón:
  - 8 colores distintos, con la tuerca en gris metálico;
  - fondo casi negro;
  - la pieza fantasma con relleno al 0.2 y contorno de 1 px.
- **Fuera del original:**
  - SCORE, LEVEL y LINES del DOM: los dos primeros los pinta el HUD de la plataforma y LÍNEAS va
    al canvas;
  - el canvas `next-canvas`, que pasa a dibujarse en el lienzo único;
  - el overlay de PAUSA y GAME OVER, y el botón "Reiniciar";
  - la tecla `P`, el toggle de tema, `localStorage` y el título;
  - la lista de controles, que pasa a `controls` de `index.ts`.

### Registro y documentación

- **`registry.ts`:** una línea, `tuerca: () => import("@/app/lib/arcade/tuerca")…`.
- **`CLAUDE.md`:**
  - pasa a decir dos juegos reales, y que solo arkanoid espera en `references/`;
  - documenta `lives: null` y `typed()` en la sección del runtime.

**Fuera** — cada uno, si llega, en su propia spec:

- Convertir o retirar `caida` u otras maquetas.
- Arkanoid.
- Mecánicas modernas:
  - lock delay, kicks SRS, pieza guardada (hold) y más de una pieza siguiente;
  - bolsa barajada, T-spins, combos y back-to-back;
  - nivel inicial a elegir, y DAS/ARR propios en lugar de la repetición del sistema.
- Animación o destello al limpiar líneas.
- Sonido.
- Controles táctiles.
- Guardar líneas o nivel en `scores`, un campo `lines` en `ArcadeSnapshot` y cualquier cambio de
  esquema.
- Código de ranking, leaderboard o puntuaciones: ya existe desde la spec 06.
- Cambiar asteroides, más allá de comprobar que sigue igual.
- Tests y runner de tests.
- Modificar `references/started-games/`.

---

## Modelo de datos

### Ficheros

```
app/lib/arcade/tuerca/
  index.ts      — la única puerta pública: width, height, controls, createEngine
  constants.ts  — números del original, colores y maqueta del lienzo
  board.ts      — lógica pura del tablero, sin canvas ni DOM
  engine.ts     — estado de partida, entrada, bucle y dibujo
```

`board.ts` contiene `createBoard`, `randomPiece`, `collide`, `rotateCW`, `tryRotate`, `merge`,
`clearLines` y `ghostY`. Recibe el tablero por parámetro, así que se puede probar sin navegador.
Nadie fuera de `tuerca/` importa `board`, `engine` ni `constants`.

### Cambios en el contrato

```ts
// app/lib/arcade/types.ts
export type ArcadeSnapshot = {
  score: number;
  /** `null` = el juego no tiene vidas: el HUD oculta "Vidas". */
  lives: number | null;
  level: number;
  status: ArcadeStatus;
};
// restart(): "Nivel 1, puntuación a cero y vidas a su valor inicial."
```

```ts
// app/lib/arcade/keyboard.ts — se añade al tipo Keyboard
/** Cuántos keydown llegaron desde la última lectura, autorrepetición del sistema incluida.
 *  Se consume al leerlo. `clear()` y `detach()` también lo vacían. */
typed(code: string): number;
```

```ts
// app/components/GamePlayerScreen.tsx — solo la rama jugable
// Sin instantánea todavía → LIVES (3), como hoy. Con instantánea → su valor, null incluido.
const lives = playable ? (snapshot ? snapshot.lives : LIVES) : LIVES;
// lives === null → no se renderiza el bloque .hud-stat.lives
```

`GameCanvas.tsx` no cambia: `GAME_KEYS` ya cubre las flechas y el Espacio, y `X` no mueve la página.

### La instantánea publicada

`{ score, lives: null, level, status }`. Se publica al crear el motor (en `idle`) y después solo
cuando cambia algún valor:

- `score` cambia con el soft drop (cada fila), con el hard drop y al limpiar líneas;
- `level` cambia al limpiar líneas;
- `status` cambia con `start`, `pause`, `resume`, `end` y el game over.

LÍNEAS y SIGUIENTE **no** entran en la instantánea: se dibujan en el canvas.

### Estado de la instancia (`engine.ts`)

```ts
type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // I O T S Z J L tuerca
type Cell = 0 | PieceType;
type Board = Cell[][]; // ROWS × COLS
type Piece = { type: PieceType; shape: Cell[][]; x: number; y: number };
// board, current, next, score, lines, level, dropInterval, dropAcc, lastTime, status
```

### `constants.ts`

| Constante                               | Valor                                                                                                   | Origen                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `COLS`, `ROWS`, `BLOCK`                 | `10`, `20`, `30`                                                                                        | 1:1                                                               |
| `PIECES`                                | las 8 matrices de `game.js`, idénticas (la tuerca, `[[8,8,8],[8,0,8],[8,8,8]]`)                         | 1:1                                                               |
| `LINE_SCORES`                           | `[0, 100, 300, 500, 800]`                                                                               | 1:1                                                               |
| `KICKS`                                 | `[0, -1, 1, -2, 2]`                                                                                     | 1:1                                                               |
| `DROP_START`, `DROP_STEP`, `DROP_MIN`   | `1000`, `90`, `100` ms                                                                                  | 1:1                                                               |
| `LINES_PER_LEVEL`                       | `10`                                                                                                    | 1:1                                                               |
| `HARD_DROP_POINTS`, `SOFT_DROP_POINTS`  | `2`, `1`                                                                                                | 1:1                                                               |
| `GHOST_ALPHA`                           | `0.2`                                                                                                   | 1:1, más un contorno de 1 px (`GHOST_STROKE`)                     |
| `SCORE_MAX`                             | `10_000_000`                                                                                            | el `check` de `scores`                                            |
| `W`, `H`                                | `800`, `600`                                                                                            | el marco 4:3                                                      |
| `BOARD_X`, `BOARD_Y`                    | `250`, `0`                                                                                              | el tablero de 300×600, centrado                                   |
| `PREVIEW_CELLS`                         | `4` (120×120 a `BLOCK` 30)                                                                              | 1:1 con `next-canvas`                                             |
| `COLORS[1..8]`, `BG`, `GRID`, `PANEL_*` | paleta de neón: I cian, O amarillo, T magenta, S verde, Z rojo, J azul, L naranja, tuerca gris metálico | retematizado; los valores exactos se cierran en el paso de diseño |

El acumulador de caída hace `acc += dt`. Si `acc >= dropInterval`, entonces `acc -= dropInterval`,
la pieza baja una fila y `acc` se acota a `dropInterval`. Así cae como mucho una fila por fotograma
y no hay ráfagas tras un tirón. Al reanudar, `lastTime` se reinicia.

### `index.ts`

```ts
controls: [
  ["← →", "Mover"],
  ["↑ X", "Rotar"],
  ["↓", "Bajar"],
  ["Espacio", "Caída"],
],
```

### Fila del catálogo (`supabase/migrations/<timestamp>_add_tuerca.sql`)

```sql
-- Al final del catálogo: no toca ninguna otra fila.
insert into public.games (id, title, short, long, category, cover, color, position)
select 'tuerca', 'TUERCA',
       'Encaja las piezas, limpia líneas y no te fíes de la tuerca.',
       'Siete piezas de siempre y una octava que no perdona: la tuerca, un anillo con el centro vacío que deja un hueco allí donde cae. Muévelas, gíralas y suéltalas de golpe para completar líneas antes de que la pila toque el techo. Cada diez líneas subes de nivel y todo cae más rápido.',
       'PUZZLE', 'cover-tuerca', 'cyan',
       coalesce(max(position), 0) + 1
from public.games;
```

**Sin cambios de esquema:** ni tablas, ni columnas, ni políticas, ni vistas. `npm run db:types` no
produce diff.

---

## Plan de implementación

Cada paso deja `npm run build` en verde y la web funcionando.

1. **Ampliaciones del contrato.**
   - `types.ts`: `lives: number | null` y el comentario de `restart()` corregido.
   - `keyboard.ts`: `typed(code)` con su contador por tecla. `onKeyDown` lo incrementa siempre, y
     `clear()` y `detach()` lo vacían. `pressed()` no cambia.
   - `GamePlayerScreen.tsx`: la regla de `lives` del modelo de datos y el bloque "Vidas" condicional,
     solo en la rama jugable.
   - Prueba manual: asteroides sigue mostrando sus corazones y bajándolos al morir. Mantener
     `Espacio` dispara una sola bala.

2. **Constantes y lógica pura.**
   - `tuerca/constants.ts` con la tabla del modelo de datos.
   - `tuerca/board.ts` con las funciones de `game.js`, portadas literalmente y sin globales: reciben
     el tablero y la pieza por parámetro.
   - Nadie los importa todavía.

3. **Motor: estado, reglas y bucle** (`engine.ts`).
   - El estado vive en la instancia.
   - `start`, `pause`, `resume`, `end`, `restart` y `destroy` son idempotentes.
   - Gravedad con `acc -= dropInterval`, como mucho una fila por fotograma y con el acumulador
     acotado.
   - `lockPiece` hace `merge`, `clearLines` y `spawn`, y el game over llega cuando la pieza choca al
     aparecer.
   - Puntuación y nivel como en el original, con el `Math.floor` y el tope de `SCORE_MAX`.
   - `publish()` solo cuando cambia algún valor, y una vez al crear el motor.
   - Al pausar se limpian las teclas, y al reanudar se reinicia `lastTime`.
   - El dibujo, mínimo: tablero y pieza actual, para poder probarlo en el paso 6.

4. **Motor: entrada.**
   - `typed()` para mover (`ArrowLeft` y `ArrowRight`), bajar (`ArrowDown`) y rotar (`ArrowUp` y
     `KeyX`). Se aplica tantas veces como devuelva.
   - `pressed("Space")` para el hard drop.
   - `keyboard.clear()` justo después de `attach()` en `start()`, y otra vez en el primer fotograma
     tras arrancar o reanudar (`lastTime === null`): `start()` se llama mientras el keydown aún
     burbujea hacia `window`, así que el listener recién añadido lo recibe después del primer
     `clear()`.
   - Ni `KeyP` ni ninguna otra tecla del original.

5. **Motor: dibujo completo e `index.ts`.**
   - El lienzo de 800×600 con HiDPI, igual que asteroides.
   - La rejilla, el tablero en `BOARD_X`, la pieza fantasma (relleno al 0.2 y contorno de 1 px) y la
     pieza actual.
   - El panel izquierdo con LÍNEAS y el derecho con SIGUIENTE (4×4 celdas).
   - Un `draw()` explícito al entrar en `gameover`, con la pieza fijada y la nueva solapada.
   - Todos los colores salen de `constants.ts`.
   - `index.ts` con `width`, `height`, `controls` y `createEngine`.
   - Sigue sin registrar.

6. **Portada `cover-tuerca`**, con el skill `/frontend-design`.
   - `| "cover-tuerca"` en `CoverClass` y `.cover-tuerca` en `globals.css`.
   - La portada no se ve hasta que exista la fila del paso 7.

7. **Migración.**
   - Invocar el skill `supabase`.
   - `npm run db:migration add_tuerca </dev/null` y escribir en el fichero el SQL del modelo de
     datos.
   - `npm run db:push -- --dry-run` para revisar qué se va a aplicar.
   - ⚠️ **`npm run db:push` escribe en la base de datos remota de producción
     (`vrepjeurrsaekrosmuye`).** El alcance es un `insert` de 1 fila en `games`, sin tocar ninguna
     otra. Antes de ejecutarlo se pide confirmación explícita a la persona en ese momento.
   - Verificar con el MCP:
     - un `select` del catálogo devuelve 10 filas, con `tuerca` en la posición 10;
     - `get_advisors` (security) no da avisos nuevos.
   - `npm run db:types` no produce diff.
   - `/games/tuerca` responde y `/games/tuerca/play` muestra la maqueta.
   - Se comprueban las cascadas: 10 tarjetas, `10+`, 10 pestañas, y los destacados sin cambios.

8. **Línea en el registro.**
   - `tuerca` en `registry.ts`.
   - El juego se juega de verdad y aparece el distintivo `JUGABLE`.

9. **Aspecto del canvas**, con el skill `/frontend-design`.
   - Cerrar la paleta de neón en `constants.ts`, cuidar la legibilidad de la pieza fantasma, y la
     tipografía y la composición de los paneles.
   - `globals.css` solo se toca para el marco.
   - Las scanlines del CRT siguen por encima.

10. **Sesión de juego real**, con StrictMode y el original abierto al lado.
    - Recorrer cada mecánica del inventario.
    - Pausar con el botón y con `Esc`, y cambiar de pestaña.
    - Pulsar `FIN`, y llegar a un game over natural por arriba.
    - Guardar como `KAI`, salir y volver a entrar.
    - Jugar a asteroides otra vez.

11. **`CLAUDE.md`.**
    - Pasa a decir dos juegos reales, y que solo arkanoid espera en `references/`.
    - Documenta `lives: null` y `typed()` en la sección del runtime.

12. **Verificación final:** `npm run lint`, `npm run build`, `npm run format:check` y
    `npx tsc --noEmit`, los cuatro en verde.

---

## Criterios de aceptación

### Compilación y formato

- [ ] `npm run lint` termina sin errores ni warnings.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run format:check` pasa.
- [ ] `npx tsc --noEmit` no da errores.

### Contrato

- [ ] `app/lib/arcade/tuerca/index.ts` exporta `width` (800), `height` (600), `controls` y
      `createEngine`.
- [ ] `grep -rn "arcade/tuerca/" app --include=*.ts --include=*.tsx` no devuelve ninguna línea fuera
      de `app/lib/arcade/tuerca/` que apunte a `engine`, `board` o `constants`.
- [ ] `grep -rn "getElementById\|querySelector\|getComputedStyle\|localStorage" app/lib/arcade/` no
      devuelve nada.
- [ ] `grep -n "tuerca" app/components/*.tsx` no devuelve nada.
- [ ] El motor no declara estado de partida a nivel de módulo: `board`, `current`, `next`, `score`,
      `lines`, `level` y `dropAcc` viven en la instancia.
- [ ] `ArcadeSnapshot.lives` es `number | null`.
- [ ] `Keyboard` tiene `typed()`, y `pressed()` no ha cambiado: `git diff` no toca su cuerpo.
- [ ] `git diff app/components/GameCanvas.tsx` sale limpio.
- [ ] Las constantes de `constants.ts` coinciden una a una con `game.js`: `COLS`, `ROWS`, `BLOCK`,
      las 8 `PIECES`, `LINE_SCORES`, `KICKS`, los intervalos de caída, los puntos de drop y
      `GHOST_ALPHA`.
- [ ] `git status references/` sale limpio.

### Base de datos

- [ ] Existe `supabase/migrations/<timestamp>_add_tuerca.sql`, y
      `npx supabase migration list --linked` lo muestra aplicado en local y en remoto.
- [ ] `games` tiene 10 filas; `tuerca` está en la posición 10 y las posiciones 1–9 no han cambiado.
- [ ] La fila `tuerca` tiene `TUERCA`, `PUZZLE`, `cover-tuerca`, `cyan` y el `short`/`long` de la
      spec.
- [ ] `get_advisors` (security) no da avisos nuevos.
- [ ] `npm run db:types` no produce diff.

### Catálogo

- [ ] La biblioteca muestra 10 tarjetas con `TODOS`, y TUERCA aparece bajo `PUZZLE` junto a CAÍDA.
- [ ] `JUGABLE` sale solo en ASTEROIDES y TUERCA.
- [ ] `.cover-tuerca` y `.cover-tetro` se distinguen a simple vista en la biblioteca.
- [ ] La estadística de la home dice `10+`, y sus 6 destacados son los mismos que antes.
- [ ] El hall of fame tiene 10 pestañas, abre en ASTEROIDES y TUERCA es la última.
- [ ] `/games/caida` y `/games/caida/play` siguen idénticos, con la maqueta.

### El juego

Todo esto se comprueba jugando en `/games/tuerca/play`:

- [ ] El bucle no corre hasta el primer clic o tecla, y el overlay lista `← →` Mover, `↑ X` Rotar,
      `↓` Bajar y `Espacio` Caída.
- [ ] Arrancar con `Espacio` **no** hace un hard drop de la primera pieza.
- [ ] El tablero es de 10 × 20, está centrado en el canvas y cabe entero en altura.
- [ ] Salen las 8 piezas, la tuerca incluida, y cada una tiene su color.
- [ ] `←` y `→` mueven una columna por pulsación, y mantenidas siguen moviendo a la cadencia del
      sistema.
- [ ] `↓` baja una fila y suma 1 punto. Mantenida sigue bajando, y contra el suelo fija la pieza.
- [ ] `↑` y `X` rotan en sentido horario. Pegada a la pared, la pieza rota desplazándose hasta 2
      columnas, y si no cabe, no rota.
- [ ] La tuerca rota sin cambiar de forma.
- [ ] `Espacio` suelta la pieza hasta la fantasma y suma 2 puntos por celda. Mantenido suelta **una**
      sola pieza.
- [ ] La pieza fantasma marca dónde cae y se ve con claridad sobre el fondo.
- [ ] Limpiar 1, 2, 3 o 4 líneas suma 100, 300, 500 u 800 × el nivel.
- [ ] Cada 10 líneas sube el nivel en el HUD y la caída se acelera. En el nivel 11 baja una fila cada
      100 ms.
- [ ] El panel izquierdo muestra LÍNEAS y el derecho la pieza SIGUIENTE, que coincide con la que
      aparece después.
- [ ] Cuando una pieza nueva choca al aparecer, la partida acaba, el último estado queda dibujado y se
      abre el modal.
- [ ] La caída va a la misma velocidad a 60 Hz y a 120 Hz.
- [ ] Ninguna parte del canvas parpadea.
- [ ] `P` no hace nada.

### HUD y plataforma

- [ ] Puntuación y Nivel coinciden en todo momento con el canvas.
- [ ] El bloque "Vidas" no aparece en tuerca.
- [ ] `PAUSA` y `Esc` pausan y reanudan. Al reanudar no cae una ráfaga de filas y no hay ninguna tecla
      pegada.
- [ ] Cambiar de pestaña o hacer clic fuera pausa la partida, y al volver sigue en pausa.
- [ ] `FIN` abre el modal con la puntuación de la partida en curso.
- [ ] `JUGAR DE NUEVO` reinicia con el tablero vacío, nivel 1, 0 líneas y 0 puntos.
- [ ] Con la partida activa, las flechas y el `Espacio` no hacen scroll. En el arranque, en pausa y
      con el modal abierto, sí lo hacen.
- [ ] Con StrictMode hay un solo bucle: la tasa de rAF es la del monitor y la caída va a su velocidad.
- [ ] Salir a `/games` y volver no deja ningún bucle huérfano.
- [ ] La consola queda sin errores ni warnings durante una partida completa.

### Ranking (de la spec 06: se comprueba, sin código nuevo)

- [ ] Guardar como `KAI` muestra PUNTUACIÓN GUARDADA, y `scores` tiene una fila con
      `game_id = 'tuerca'`.
- [ ] Tras recargar, la marca aparece:
  - en el top 10 del detalle, en el récord y en PUNTUACIONES;
  - en la tarjeta de la biblioteca;
  - en la pestaña TUERCA del hall of fame, con su podio;
  - en las últimas puntuaciones de la home.
- [ ] La matriz POR JUGADOR gana la columna TUERCA, detrás de ASTEROIDES.

### Regresión

- [ ] Asteroides se juega y guarda exactamente igual que antes:
  - el HUD muestra sus corazones y los baja al morir;
  - mantener `Espacio` dispara una sola bala.
- [ ] `git diff app/lib/arcade/asteroides/` sale limpio.
- [ ] `grep -rn "Audio\|AudioContext" app/lib/arcade/` no devuelve nada.
- [ ] `/about` sigue enviando por Resend.
- [ ] `AuthForm` sigue navegando a `/games`.
- [ ] `/no-existe` sigue mostrando `app/not-found.tsx`.

### CLAUDE.md

- [ ] Dice que hay dos juegos reales y que solo arkanoid espera en `references/`.
- [ ] Documenta `lives: null` y `typed()`.

---

## Decisiones

### Catálogo

- **Sí: id nuevo `tuerca`, y `caida` se queda como maqueta.** Se sigue el criterio de la spec 05:
  cada juego es una entidad propia, aunque una maqueta describa una mecánica parecida.
  - No: convertir `caida` con un `update`. Evitaba el duplicado y las cascadas, pero rompía ese
    criterio, y su descripción no menciona la tuerca.
  - Coste aceptado: dos juegos de piezas que caen bajo `PUZZLE`, y solo uno jugable.
- **Sí: título `TUERCA`.** Es original y le pone nombre a lo único que tiene este juego, la octava
  pieza.
  - No: `ENCAJE`, genérico y con doble sentido.
  - No: `DERRUMBE`, que se pisa con CAÍDA.
  - Nunca el nombre comercial del original.
- **Sí: `PUZZLE` y `cyan`.** `PUZZLE` lo agrupa con CAÍDA en el filtro. `cyan` es el color de la
  pieza I y lo separa del magenta de CAÍDA.
- **Sí: portada propia `cover-tuerca`.** No: reutilizar `cover-tetro`, que dejaría dos tarjetas
  iguales en la misma rejilla.
- **Sí: al final del catálogo (posición 10).** Es un `insert` que no toca ninguna otra fila.
  - No: la posición 2, junto a asteroides. Reordenaba 8 filas en producción y sacaba a `invasores`
    de los destacados de la home.

### Contrato

- **Sí: `lives: number | null`, y el HUD oculta "Vidas" con `null`.**
  - No: `lives: 1`, que mentiría en el HUD.
  - No: `lives: 0`, que pinta "—" como si el jugador estuviera muerto.
  - El HUD distingue "sin instantánea todavía" de "sin vidas", porque `null ?? 3` daría tres
    corazones.
- **Sí: `typed()` aditivo en `keyboard.ts`.**
  - No: cambiar `pressed()`, que cambiaría la cadencia de disparo de asteroides.
  - No: un DAS/ARR propio, que sería una mecánica nueva. Se usa la repetición del sistema, como el
    original.
- **Sí: autorrepetición 1:1 para mover, bajar y rotar.** Es cómo juega el original. El retardo del
  sistema, de unos 500 ms, hace raro girar la pieza sin querer.
- **Sí: excepción en el hard drop (`pressed()`).** En el original, el `Espacio` mantenido encadena
  hard drops y suelta varias piezas seguidas: es un accidente, no una mecánica.
- **Sí: LÍNEAS y SIGUIENTE dibujados en el canvas.**
  - No: un campo `lines` en `ArcadeSnapshot`, que mete datos de un solo juego en el contrato común.
- **Sí: un único canvas de 800×600 con el tablero centrado y `BLOCK` 30.** El tablero de 300×600
  cabe exacto en la altura. LÍNEAS va a la izquierda y SIGUIENTE a la derecha.
  - No: el segundo canvas del original.
  - No: un CRT de aspecto variable solo para este juego.
- **Sin cambio en `GAME_KEYS`.** Todas las teclas ya están en el conjunto por defecto, y `X` no mueve
  la página.

### Fidelidad

- **Sí: números y mecánica 1:1.** Sin lock delay, kicks solo horizontales y nivel sin tope. Lo
  moderno (hold, SRS, bolsa barajada) queda fuera.
- **Sí: la tuerca se queda, con probabilidad de 1/8**, aunque el README y el `CLAUDE.md` del
  original hablen de 7 piezas. Está en el código, y es el precedente del `3x` de asteroides.
  - No: quitarla, que dejaría el título sin sentido.
- **Sí: `Math.random()` uniforme.**
  - No: una bolsa barajada de 8, que reparte de forma más justa pero cambia el balance.
- **Sí: cuatro correcciones de plataforma, que no cuentan como cambio de balance:**
  - `acc -= interval` con el acumulador acotado, en lugar de `acc = 0`, para que caiga igual con
    cualquier tasa de refresco;
  - `clear()` tras `attach()`, para que la tecla de arranque no haga un hard drop;
  - un `draw()` explícito en el game over;
  - la puntuación entera y acotada a 10.000.000.
- **Avisos aplicados:** fuera `P` y "Reiniciar" (la plataforma tiene pausa y reinicio propios), el
  toggle de tema, `localStorage` y el HUD del DOM. El original no tiene sonido que portar.

### Visual

- **Sí: retematizado a la paleta de neón**, con 8 colores distintos y la tuerca en gris metálico.
  - No: los tonos pastel del original, que dentro del mueble se ven apagados.
  - La forma de cada pieza es la señal principal, y el color la refuerza.
- **Sí: la pieza fantasma con relleno al 0.2 y un contorno de 1 px.** Es solo dibujo y no toca la
  mecánica.
  - No: dejar solo el relleno al 0.2, que sobre fondo casi negro apenas se lee.
- **Sin parpadeos:** las líneas se borran al instante, como en el original, y no se añade ninguna
  animación.

### Operación

- **Sí: `db:push` lo ejecuta Claude durante `/spec-impl`**, después del `--dry-run` y de una
  confirmación explícita en ese momento.
  - No: que lo ejecute la persona a mano.
- **Sí: el ranking no se toca.** Viene de la spec 06 y solo se comprueba.

---

## Riesgos

| Riesgo                                                                                                                                                                    | Mitigación                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`db:push` escribe en producción.** Un SQL equivocado quedaría en el catálogo público.                                                                                   | `--dry-run` primero, confirmación explícita antes del push real, y una sola fila al final que no toca ninguna otra. `select` del catálogo y `get_advisors` justo después.                       |
| **Corazones de más durante CARGANDO….** Hasta la primera instantánea, el HUD pinta los 3 corazones por defecto, incluso en tuerca.                                        | El motor publica al crearse, así que dura lo que tarda el `import()`. Se acepta: ocultar "Vidas" hasta la primera instantánea cambiaría también asteroides. Se comprueba en la sesión de juego. |
| **`typed()` cambia la sensación respecto al original.** El original mueve en el mismo `keydown`; aquí se aplica en el siguiente fotograma, como mucho unos 16 ms después. | Aplicar el contador entero en cada lectura, sin perder pulsaciones. Comparar con el original abierto al lado en el paso 10.                                                                     |
| **La autorrepetición depende del sistema de cada jugador.** El retardo y la cadencia de las flechas cambian según el sistema operativo.                                   | Es fiel al original y se acepta. Un DAS/ARR propio queda fuera.                                                                                                                                 |
| **El acumulador mal acotado.** Si no se acota, una ráfaga de filas al volver de un tirón; si se acota de más, la pieza se queda colgada.                                  | La regla exacta está en _Modelo de datos_. Hay un criterio a 60 y 120 Hz, y otro de "reanudar sin ráfaga".                                                                                      |
| **Dos bucles con StrictMode.** Las piezas caerían al doble de velocidad.                                                                                                  | `destroy()` idempotente, la carga cancelada del envoltorio, y un criterio específico.                                                                                                           |
| **La rejilla y la fantasma se pierden bajo las scanlines.** Las líneas de 0.5 px y el alfa de 0.2 son lo primero que se come el efecto CRT.                               | Contorno de 1 px en la fantasma, y revisión del apilado y del contraste en el paso de diseño (paso 9).                                                                                          |
| **Puntos con `↓` mantenida.** El soft drop suma 1 punto por fila, también con la repetición del sistema.                                                                  | Es fiel al original. El anti-trampas ya está fuera desde la spec 06.                                                                                                                            |
| **Escalas que no se comparan en el top de jugadores.** La home ordena por la marca individual más alta, y tuerca y asteroides puntúan en escalas distintas.               | Es la decisión aceptada en la spec 06, y no cambia aquí.                                                                                                                                        |
| **Dos juegos de piezas que caen bajo `PUZZLE`.** CAÍDA y TUERCA, y solo una jugable.                                                                                      | El distintivo `JUGABLE` y una portada distinta. Convertir o retirar las maquetas va en su propia spec.                                                                                          |
| **El hook de Prettier y ESLint reescribe el fichero portado**, así que el diff contra `game.js` deja de leerse.                                                           | Comparar comportamiento y constantes, no texto. El criterio pide constantes 1:1.                                                                                                                |

---

## Lo que **no** entra en esta spec

- Convertir o retirar `caida` u otras maquetas.
- Arkanoid.
- Lock delay, SRS, hold, más de una pieza siguiente, bolsa barajada, T-spins, combos y nivel
  inicial a elegir.
- DAS/ARR propios.
- Animaciones o destellos al limpiar líneas.
- Sonido.
- Controles táctiles.
- Guardar líneas o nivel, un campo `lines` en la instantánea y cualquier cambio de esquema.
- Código de ranking o puntuaciones.
- Cambios en asteroides.
- Tests y runner de tests.
- Modificar `references/started-games/`.

Cada uno de ellos, si llega, va en su propia spec.
