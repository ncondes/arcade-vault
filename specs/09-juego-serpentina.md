# SPEC 09 — Serpentina, el cuarto juego real

> **Estado:** Implementado
> **Depende de:** 05-juego-asteroides (implementada), 06-catalogo-y-puntuaciones-en-supabase
> (implementada), 07-juego-tuerca (implementada)
> **Fecha:** 2026-11-17
> **Objetivo:** Convertir la maqueta `serpentina` en un juego jugable de serpiente que come
> fruta, crece y acelera, actualizando su fila del catálogo con una migración para que sus
> puntuaciones lleguen a los rankings que ya existen.

---

## Por qué existe esta spec

Es la primera vez que una maqueta se convierte en juego real en lugar de añadir un id nuevo. Las
specs 05, 07 y 08 dejaron sus maquetas intactas. Aquí se convierte `serpentina` por tres motivos:

- tiene la misma mecánica, y un id nuevo dejaría dos serpientes en la biblioteca, una falsa;
- tiene 0 puntuaciones, así que no hay rankings de maqueta que mezclar con los reales;
- ya está en la posición 4, entre los destacados de la home, y el `update` no reordena ninguna fila.

El contrato común no cambia:

- `lives: null` ya existe desde la spec 07;
- las flechas ya están en `GAME_KEYS`, y WASD son letras que no hacen scroll;
- no hay ratón ni ningún valor extra en el HUD del DOM.

**Las frutas son pixel art propio, dibujado por código.** La hoja de
`references/source-assets/snake-assets/fruits.png` no se usa. Es el arte del Snake de Google, y la
plataforma solo publica assets propios o con licencia. El dibujo queda aislado en `sprites.ts`, para
poder cambiarlo por una hoja propia en otra spec. Tampoco hay sonido: la referencia no trae audio.

El ranking no necesita código. `serpentina` ya tiene fila en `games`, así que en cuanto entra en
`registry.ts` guarda sus puntuaciones y sale en todas las clasificaciones.

---

## Alcance

**Dentro:**

### Catálogo

- **Migración `convert_serpentina`**, creada con `npm run db:migration convert_serpentina`.
  - Es un `update` de la fila `serpentina` que cambia solo `short` y `long`, con los textos de
    _Modelo de datos_.
  - `title` (`SERPENTINA`), `category` (`ARCADE`), `color` (`green`), `cover` (`cover-snake`) y
    `position` (4) no cambian. No toca ninguna otra fila.
- **`.cover-snake`** en `app/globals.css` se redibuja: la serpiente verde con una fruta delante,
  en lugar del núcleo magenta.
  - El nombre de la clase no cambia, así que `CoverClass` no se toca.
- **Cascadas aceptadas:**
  - la biblioteca sigue con 11 tarjetas, y SERPENTINA gana la insignia `JUGABLE`;
  - la estadística `11+`, el orden y la pestaña por defecto del hall of fame (ASTEROIDES) no cambian;
  - los 6 destacados de la home siguen siendo los mismos. Sus tarjetas (`MiniCard`) no muestran ni
    `JUGABLE` ni puntuaciones para ningún juego, y esta spec no las cambia;
  - la matriz POR JUGADOR gana la columna SERPENTINA en cuanto tenga una puntuación, en la
    posición 4 del catálogo.

### Contrato

- **Sin cambios.** `types.ts`, `keyboard.ts`, `GameCanvas.tsx` y `GamePlayerScreen.tsx` no se tocan.
- La rama de maqueta de `GamePlayerScreen` sigue igual: `serpentina` simplemente deja de usarla.

### Motor `app/lib/arcade/serpentina/`

- **TypeScript puro**: recibe el canvas, guarda el estado en la instancia y lleva los números y los
  colores en `constants.ts`. No usa `getElementById`, `querySelector`, `localStorage` ni globales de
  módulo.
- **Números de diseño**, todos en `constants.ts`:
  - tablero de 32 × 24 celdas de 25 px, que ocupa el lienzo de 800×600;
  - la serpiente empieza con 3 segmentos en el centro, mirando a la derecha;
  - avanza 8 pasos/s en el nivel 1, +1 paso/s por nivel, con tope de 18;
  - sube de nivel cada 5 frutas normales;
  - la fruta normal vale `10 × nivel` y alarga la serpiente 1 segmento;
  - la fruta dorada vale `50 × nivel`, dura 5 s y no alarga.
- **Reglas:**
  - siempre hay una fruta normal en el tablero, en una celda libre al azar;
  - el tipo de fruta (6–8 dibujos) es solo estético, y todas valen lo mismo;
  - al comer la 5.ª fruta de un nivel, suma con el nivel actual, sube el nivel y aparece una fruta
    dorada en otra celda libre;
  - si ya hay una dorada cuando toca otra, la nueva la sustituye;
  - la dorada que caduca desaparece sin penalización;
  - la cola libera su celda en el mismo paso, así que la cabeza puede entrar en ella, salvo cuando
    la serpiente crece.
- **Fin de partida**, siempre en `gameover`:
  - salir del tablero;
  - chocar con el propio cuerpo;
  - no quedar ninguna celda libre para la fruta (victoria), con la puntuación final.
- **Controles:**
  - flechas y WASD, leídos con `pressed()`: mantener la tecla no repite el giro;
  - una cola de hasta 2 giros, que se aplican uno por paso;
  - se descarta el giro igual o contrario a la última dirección de la cola.
- **Dibujo** con pixel art propio:
  - las frutas son matrices de píxeles en `sprites.ts`;
  - la cabeza lleva ojos que marcan la dirección;
  - la dorada se distingue por un tamaño mayor, un contorno y una barra de tiempo bajo ella, dentro
    de su celda, no solo por el color;
  - en su último segundo parpadea a 2 Hz;
  - al morir no hay parpadeo: la serpiente queda atenuada y con una ✕ sobre la cabeza.
- **Correcciones de plataforma**, que no cambian el balance:
  - el avance va por acumulador (`acc -= interval`), con `dt` acotado a 0.05 s, y el tiempo de la
    dorada también corre con `dt`;
  - el teclado se limpia en el primer fotograma tras `start` y `resume`;
  - un `draw()` explícito al entrar en `gameover`;
  - la puntuación con `Math.floor` y acotada a `[0, 10000000]`.
- **Lienzo de 800×600** con HiDPI por `devicePixelRatio`, igual que los otros tres juegos.

### Registro y documentación

- **`registry.ts`:** una línea, `serpentina: () => import("@/app/lib/arcade/serpentina")…`.
- **`CLAUDE.md`:**
  - pasa a decir cuatro juegos reales y siete maquetas;
  - documenta que convertir una maqueta es una migración con `update` de su fila.
- **`.claude/skills/new-game/SKILL.md`:** `serpentina` sale de la lista de maquetas candidatas, y
  esta spec queda anotada como el precedente de conversión.

**Fuera** — cada uno, si llega, en su propia spec:

- Convertir o retirar otras maquetas.
- Cambios de mecánica:
  - bordes que dan la vuelta;
  - obstáculos o mapas por nivel;
  - frutas con efectos distintos (veneno, encoger, ralentizar);
  - acelerar manteniendo la tecla;
  - dos jugadores.
- Usar `references/source-assets/snake-assets/fruits.png` o cualquier hoja de sprites: el cambio a
  una hoja propia va en otra spec.
- Sonido, y el volumen o el silencio de la plataforma.
- Controles táctiles.
- Guardar la longitud o el nivel en `scores`, y cualquier cambio de esquema.
- Código de ranking, leaderboard o puntuaciones: ya existe desde la spec 06.
- Cambiar asteroides, tuerca o ladrillazo, más allá de comprobar que siguen igual.
- Tests y runner de tests.
- Modificar `references/`.

---

## Modelo de datos

### Ficheros

```
app/lib/arcade/serpentina/
  index.ts      — la única puerta pública: width, height, controls, createEngine
  constants.ts  — números de diseño, colores y teclas
  board.ts      — lógica pura: paso, choques, celdas libres; sin canvas ni DOM
  sprites.ts    — las frutas como matrices de píxeles y drawFruit(ctx, kind, x, y, size)
  engine.ts     — estado de partida, entrada, bucle y dibujo
```

No hay `public/games/serpentina/` ni `CREDITS.md`: el juego no carga ningún fichero. Nadie fuera
de `serpentina/` importa `engine`, `constants`, `board` ni `sprites`.

### Cambios en el contrato

Ninguno. Se reutiliza tal y como quedó en la spec 07.

### La instantánea publicada

`{ score, lives: null, level, status }`. Se publica al crear el motor (en `idle`) y después solo
cuando cambia algún valor:

- `score` cambia al comer una fruta normal o dorada;
- `lives` es siempre `null`, así que el HUD oculta «Vidas»;
- `level` cambia cada 5 frutas normales;
- `status` cambia con `start`, `pause`, `resume`, `end`, la muerte y la victoria.

### Estado de la instancia (`engine.ts`)

```ts
type Dir = "up" | "down" | "left" | "right";
type Cell = { x: number; y: number }; // columna 0–31, fila 0–23, origen arriba a la izquierda
type FruitKind =
  "manzana" | "cereza" | "platano" | "uva" | "naranja" | "fresa" | "limon" | "sandia";
// snake: Cell[] (cabeza primero), dir: Dir, turns: Dir[] (máx. 2),
// fruit: { cell: Cell; kind: FruitKind }, golden: { cell: Cell; remaining: number } | null,
// fruitsInLevel, score, level, status, dead, acc, lastTime, rafId
```

`update(dt)`:

1. lee los giros con `pressed()` y los añade a `turns`;
2. descuenta `dt` de `golden.remaining`, y la quita al llegar a 0;
3. suma `dt` a `acc`; mientras `acc ≥ 1 / pasosPorSegundo(level)`, resta el intervalo y da un paso.

Un paso:

1. toma el primer giro de `turns`, si lo hay;
2. calcula la celda de la cabeza;
3. fuera del tablero o sobre el cuerpo → `dead = true` y `gameover`; la última celda de la cola no
   cuenta si este paso no crece;
4. mueve la serpiente;
5. resuelve la fruta normal y luego la dorada.

`pasosPorSegundo(level) = min(8 + (level − 1), 18)`: el tope llega en el nivel 11.

La fruta nueva sale de la lista de celdas libres, no de reintentos al azar. Si la lista está vacía,
es la victoria. La dorada se salta si no queda ninguna celda libre aparte de la de la fruta normal.

### Teclas

| Dirección | Teclas (`e.code`)    |
| --------- | -------------------- |
| arriba    | `ArrowUp`, `KeyW`    |
| abajo     | `ArrowDown`, `KeyS`  |
| izquierda | `ArrowLeft`, `KeyA`  |
| derecha   | `ArrowRight`, `KeyD` |

Un giro entra en `turns` si hay hueco y si no es igual ni contrario a la última dirección de la
cola. Si la cola está vacía, se compara con `dir`.

### `constants.ts`

| Constante                            | Valor                                                   | Origen                                             |
| ------------------------------------ | ------------------------------------------------------- | -------------------------------------------------- |
| `W`, `H`                             | `800`, `600`                                            | el marco 4:3                                       |
| `COLS`, `ROWS`, `CELL`               | `32`, `24`, `25` px                                     | diseño                                             |
| `START_LENGTH`, `START_DIR`          | `3`, `"right"`; la cabeza en `(16, 12)`                 | diseño                                             |
| `BASE_STEPS`, `MAX_STEPS`            | `8`, `18` pasos/s; +1 por nivel                         | diseño                                             |
| `FRUITS_PER_LEVEL`                   | `5`                                                     | diseño                                             |
| `FRUIT_POINTS`, `GOLDEN_POINTS`      | `10`, `50`, ambos × nivel                               | diseño                                             |
| `GOLDEN_DURATION`, `GOLDEN_BLINK_AT` | `5` s, `1` s                                            | diseño                                             |
| `GOLDEN_BLINK_HZ`                    | `2`                                                     | por debajo del límite de 3 destellos/s             |
| `TURN_QUEUE`                         | `2`                                                     | diseño                                             |
| `FRUIT_SIZE`, `GOLDEN_SIZE`          | `20`, `25` px                                           | diseño: la dorada se distingue también por tamaño  |
| `COLORS`                             | fondo, rejilla, serpiente, cabeza, ojos, dorada, muerte | se revisan en el paso de diseño                    |
| `DT_MAX`                             | `0.05` s                                                | corrección de plataforma, como en los otros juegos |
| `SCORE_MAX`                          | `10_000_000`                                            | el `check` de `scores`                             |

**Puntuación máxima teórica:** unas 1.186.000, al llenar el tablero con 765 frutas en 154 niveles
y todas las doradas comidas. Queda muy por debajo del tope, y el `clamp` se mantiene igualmente.

### `sprites.ts`

- 8 frutas originales (`FruitKind`), cada una como una matriz de 10×10 caracteres con su paleta.
- `drawFruit` las escala a `FRUIT_SIZE` en píxeles enteros, sin `drawImage` y sin imágenes.
- La dorada usa la matriz de la manzana con la paleta dorada, a `GOLDEN_SIZE` y con contorno.
- La barra de tiempo es de 3 px de alto, en el borde inferior de su celda.

### `index.ts`

```ts
controls: [
  ["← ↑ → ↓", "Girar"],
  ["W A S D", "Girar"],
],
```

### Fila del catálogo (`supabase/migrations/<timestamp>_convert_serpentina.sql`)

```sql
-- Convierte la maqueta: solo cambian los textos. Título, categoría, portada, color y posición se quedan.
update public.games
set short = 'Come fruta, crece y no te muerdas la cola.',
    long  = 'Una serpiente recorre la grilla buscando fruta. Cada bocado la alarga y, cada cinco, sube el nivel y la velocidad. A veces aparece una fruta dorada que solo dura unos segundos. Choca con un muro o contigo misma y se acabó.'
where id = 'serpentina';
```

El `update` afecta exactamente a 1 fila.

**Sin cambios de esquema:** ni tablas, ni columnas, ni políticas, ni vistas. `npm run db:types` no
produce diff.

---

## Plan de implementación

Cada paso deja `npm run build` en verde y la web funcionando.

1. **Constantes y lógica pura** (`constants.ts`, `board.ts`).
   - `constants.ts` con la tabla del modelo de datos.
   - `board.ts`:
     - `freeCells(snake, occupied)`;
     - `nextHead(head, dir)`;
     - `hitsWall(cell)`;
     - `hitsBody(cell, snake, growing)`, donde la última celda de la cola no cuenta si no crece;
     - `stepsPerSecond(level)`.
   - Sin canvas ni DOM. Nadie lo importa todavía.

2. **Frutas** (`sprites.ts`).
   - Las 8 matrices de 10×10 con su paleta, originales y sin partir de ninguna hoja ajena.
   - `drawFruit(ctx, kind, x, y, size)` en píxeles enteros, y la variante dorada con contorno.
   - Nadie lo importa todavía.

3. **Motor: estado, reglas y bucle** (`engine.ts`).
   - El estado vive en la instancia.
   - `start`, `pause`, `resume`, `end`, `restart` y `destroy` son idempotentes.
   - `update(dt)` con `dt` acotado a `DT_MAX` y el paso por acumulador (`acc -= interval`).
   - Las reglas: fruta normal, nivel cada 5, dorada con su tiempo, crecer, choques y victoria.
   - Puntuación con `Math.floor` y el tope de `SCORE_MAX`.
   - `publish()` solo cuando cambia algún valor, y una vez al crear el motor, con `lives: null`.
   - Al pausar se limpian las teclas, y al reanudar se reinicia `lastTime`.
   - El dibujo, mínimo: cuadrados para la serpiente y las frutas.

4. **Motor: entrada.**
   - Flechas y WASD con `pressed()`.
   - La cola `turns` de 2, que descarta el giro igual o contrario.
   - `keyboard.clear()` en el primer fotograma tras arrancar o reanudar (`lastTime === null`).

5. **Motor: dibujo completo e `index.ts`.**
   - El lienzo de 800×600 con HiDPI, igual que los otros juegos.
   - La rejilla, la serpiente con ojos según `dir`, las frutas con `drawFruit`, y la dorada con su
     barra y el parpadeo a 2 Hz en el último segundo.
   - Al morir: la serpiente atenuada y una ✕ sobre la cabeza. Un `draw()` explícito al entrar en
     `gameover`.
   - `index.ts` con `width`, `height`, `controls` y `createEngine`.
   - Sigue sin registrar.

6. **Portada `.cover-snake`**, redibujada con el skill `/frontend-design`.
   - La serpiente verde con una fruta delante, sin el núcleo magenta.
   - El nombre de la clase no cambia, y `CoverClass` no se toca.
   - Se ve ya en la tarjeta de la maqueta.

7. **Migración.**
   - Invocar el skill `supabase`.
   - `npm run db:migration convert_serpentina </dev/null` y escribir en el fichero el SQL del modelo
     de datos.
   - `npm run db:push -- --dry-run` para revisar qué se va a aplicar.
   - ⚠️ **`npm run db:push` escribe en la base de datos remota de producción
     (`vrepjeurrsaekrosmuye`).** El alcance es un `update` de `short` y `long` en 1 fila de `games`
     (`serpentina`), sin tocar ninguna otra. Antes de ejecutarlo se pide confirmación explícita a
     la persona en ese momento.
   - Verificar con el MCP:
     - un `select` del catálogo devuelve 11 filas, con `serpentina` en la posición 4 y los textos
       nuevos;
     - `get_advisors` (security) no da avisos nuevos.
   - `npm run db:types` no produce diff.
   - `/games/serpentina` muestra el `long` nuevo, y `/games/serpentina/play` sigue mostrando la
     maqueta.

8. **Línea en el registro.**
   - `serpentina` en `registry.ts`.
   - El juego se juega de verdad y aparece el distintivo `JUGABLE` en la biblioteca y en el detalle.

9. **Aspecto del canvas**, con el skill `/frontend-design`.
   - Se deciden los `COLORS` y el trazo de la rejilla, y se comprueba que se leen bien bajo las
     scanlines del CRT.
   - Puede retocar `sprites.ts` y `constants.ts`. `globals.css` solo se toca para el marco.

10. **Sesión de juego real**, con StrictMode.
    - Recorrer cada mecánica: fruta normal, crecer, nivel y velocidad, dorada (comida y caducada),
      choque con el borde, choque con el cuerpo y giro rápido en U con la cola de 2.
    - Mantener una flecha no repite el giro.
    - Pausar con el botón y con `Esc`, y cambiar de pestaña.
    - Pulsar `FIN`, y llegar a un game over natural.
    - Una simulación en Node de la lógica, que no se deja en el repo:
      - con `dt` de 1/60 y de 1/120 durante 10 s en el nivel 1, da 80 pasos en ambos casos;
      - con un recorrido que llena el tablero, ignorando las doradas, termina en victoria
        (`gameover`) con 589.050 puntos.
    - Cada número de diseño cambiado al jugar se anota en Decisiones con su valor anterior.
    - Guardar como `KAI`, salir y volver a entrar.
    - Jugar otra vez a asteroides, tuerca y ladrillazo.

11. **Documentación.**
    - `CLAUDE.md`: cuatro juegos reales, siete maquetas, y que convertir una maqueta es un `update`
      de su fila.
    - `.claude/skills/new-game/SKILL.md`: `serpentina` sale de la lista de maquetas, y esta spec
      queda anotada como precedente de conversión.

12. **Verificación final:** `npm run lint`, `npm run build`, `npm run format:check` y
    `npx tsc --noEmit`, los cuatro en verde.

---

## Criterios de aceptación

### Compilación y formato

- [x] `npm run lint` termina sin errores ni warnings.
- [x] `npm run build` termina sin errores.
- [x] `npm run format:check` pasa.
- [x] `npx tsc --noEmit` no da errores.

### Contrato

- [x] `app/lib/arcade/serpentina/index.ts` exporta `width` (800), `height` (600), `controls` y
      `createEngine`.
- [x] `grep -rn "arcade/serpentina/" app --include="*.ts" --include="*.tsx"` no devuelve ninguna
      línea fuera de `app/lib/arcade/serpentina/` que apunte a `engine`, `constants`, `board` o
      `sprites`.
- [x] `grep -rn "getElementById\|querySelector\|getComputedStyle\|localStorage" app/lib/arcade/` no
      devuelve nada.
- [x] `grep -n "serpentina" app/components/*.tsx` no devuelve nada.
- [x] El motor no declara estado de partida a nivel de módulo: `snake`, `dir`, `turns`, `fruit`,
      `golden`, `score`, `level` y `acc` viven en la instancia.
- [x] `git diff` de `app/lib/arcade/types.ts`, `app/lib/arcade/keyboard.ts`,
      `app/components/GameCanvas.tsx` y `app/components/GamePlayerScreen.tsx` sale limpio.
- [x] Las constantes coinciden con la tabla de la spec, o cada diferencia está en Decisiones con su
      valor anterior.
- [x] `grep -rn "drawImage\|new Image\|Audio" app/lib/arcade/serpentina/` no devuelve nada.
- [ ] No existe `public/games/serpentina/`, y `git status references/` sale limpio.

### Base de datos

- [x] Existe `supabase/migrations/<timestamp>_convert_serpentina.sql`, y
      `npx supabase migration list --linked` lo muestra aplicado en local y en remoto.
- [x] `games` sigue con 11 filas y las mismas posiciones. `serpentina` sigue en la 4.
- [x] La fila `serpentina` mantiene `SERPENTINA`, `ARCADE`, `cover-snake` y `green`, con el
      `short`/`long` de la spec.
- [x] `get_advisors` (security) no da avisos nuevos.
- [x] `npm run db:types` no produce diff.

### Catálogo

- [x] La biblioteca sigue con 11 tarjetas, y `JUGABLE` sale solo en ASTEROIDES, SERPENTINA, TUERCA y
      LADRILLAZO.
- [x] `.cover-snake` muestra la serpiente con una fruta y sin el núcleo magenta, y se distingue de
      las demás portadas a simple vista.
- [x] La home sigue diciendo `11+` y sus 6 destacados son los mismos, SERPENTINA entre ellos.
- [x] `/games/serpentina` lleva `JUGABLE` sobre la portada.
- [x] El hall of fame sigue con 11 pestañas, abre en ASTEROIDES y SERPENTINA es la cuarta.
- [x] `/games/serpentina` muestra el `long` nuevo.
- [x] Las demás maquetas (`/games/caida/play`, `/games/gloton/play`…) siguen idénticas.

### El juego

Todo esto se comprueba jugando en `/games/serpentina/play`, salvo la simulación:

- [x] El bucle no corre hasta el primer clic o tecla. El overlay lista `← ↑ → ↓` Girar y `W A S D`
      Girar.
- [x] La tecla que arranca la partida no gira la serpiente.
- [x] Empieza con 3 segmentos en el centro, mirando a la derecha, en nivel 1 y con 0 puntos.
- [x] El HUD no muestra el bloque «Vidas».
- [x] Flechas y WASD giran. El giro contrario se ignora, y mantener una tecla no repite el giro.
- [x] Dos giros pulsados dentro del mismo paso (un giro en U rápido) se aplican los dos, en pasos
      consecutivos.
- [x] Siempre hay una fruta normal en una celda libre. Comerla suma `10 × nivel` y alarga la
      serpiente 1 segmento.
- [x] Cada 5 frutas sube el nivel en el HUD y la serpiente acelera 1 paso/s, hasta 18 pasos/s en el
      nivel 11.
- [x] Al subir de nivel aparece una fruta dorada, más grande, con contorno y con su barra de
      tiempo.
- [x] Comer la dorada suma `50 × nivel` y no alarga la serpiente.
- [x] La dorada desaparece a los 5 s, y parpadea a 2 Hz en su último segundo.
- [x] La dorada no corre en pausa: al reanudar le queda el mismo tiempo.
- [x] Las 8 frutas se ven nítidas, y ninguna procede de `references/source-assets/`.
- [x] Salir del tablero por cualquiera de los cuatro bordes acaba la partida.
- [x] Chocar con el propio cuerpo acaba la partida.
- [x] Entrar en la celda que deja la cola en ese paso no acaba la partida.
- [x] Al morir, la serpiente queda atenuada con una ✕ sobre la cabeza, y el último estado queda
      dibujado.
- [x] La simulación en Node da 80 pasos en 10 s del nivel 1, tanto con `dt` de 1/60 como de 1/120.
- [x] La simulación en Node que llena el tablero, ignorando las doradas, termina en `gameover` con
      589.050 puntos.
- [x] Ninguna parte del canvas parpadea más de 3 veces por segundo.

### HUD y plataforma

- [x] Puntuación y Nivel coinciden en todo momento con el estado del juego.
- [x] `PAUSA` y `Esc` pausan y reanudan. Al reanudar, la serpiente no da un salto de varios pasos y
      no hay ninguna tecla pegada.
- [x] Cambiar de pestaña o hacer clic fuera pausa la partida, y al volver sigue en pausa.
- [x] `FIN` abre el modal con la puntuación de la partida en curso.
- [x] `JUGAR DE NUEVO` reinicia con 3 segmentos, nivel 1, 0 puntos y sin dorada.
- [x] Con la partida activa, las flechas no hacen scroll. En el arranque, en pausa y con el modal
      abierto, sí lo hacen.
- [x] Con StrictMode hay un solo bucle: la tasa de rAF es la del monitor.
- [x] Salir a `/games` y volver no deja ningún bucle huérfano.
- [x] La consola queda sin errores ni warnings durante una partida completa.

### Ranking (de la spec 06: se comprueba, sin código nuevo)

- [x] Guardar como `KAI` muestra PUNTUACIÓN GUARDADA, y `scores` tiene una fila con
      `game_id = 'serpentina'`.
- [x] Tras recargar, la marca aparece:
  - en el top 10 del detalle, en el récord y en PUNTUACIONES;
  - en la tarjeta de la biblioteca;
  - en la pestaña SERPENTINA del hall of fame, con su podio;
  - en las últimas puntuaciones de la home.
- [x] La matriz POR JUGADOR gana la columna SERPENTINA, entre CAÍDA y GLOTÓN si están, en el orden
      del catálogo.

### Regresión

- [x] Asteroides se juega y guarda exactamente igual que antes: el HUD muestra sus corazones, y
      mantener `Espacio` dispara una sola bala.
- [x] Tuerca y ladrillazo se juegan igual que antes.
- [x] `git diff app/lib/arcade/asteroides/ app/lib/arcade/tuerca/ app/lib/arcade/ladrillazo/` sale
      limpio.
- [ ] `/about` sigue enviando por Resend, `AuthForm` sigue navegando a `/games` y `/no-existe`
      sigue mostrando `app/not-found.tsx`.

### Documentación

- [x] `CLAUDE.md` dice que hay cuatro juegos reales y siete maquetas, y que convertir una maqueta es
      un `update` de su fila.
- [x] `.claude/skills/new-game/SKILL.md` ya no lista `serpentina` como maqueta y cita esta spec como
      precedente de conversión.

---

## Decisiones

### Catálogo

- **Sí: convertir la maqueta `serpentina` con un `update`.** Es la primera conversión.
  - No: un id nuevo al final, que era el criterio de las specs 05, 07 y 08. Dejaba dos serpientes en
    la biblioteca, una de ellas falsa.
  - Aquí la conversión no tiene los costes de la spec 08: la maqueta tiene 0 puntuaciones, ya está
    entre los destacados de la home y el `update` no reordena ninguna fila.
- **Sí: se mantiene el título `SERPENTINA`.** Es original, ya está en el catálogo y no rompe enlaces.
  - No: `VORAZ` o `FRUTERA`, que cambiaban la tarjeta sin ganar nada.
  - Nunca el nombre comercial de ningún juego de serpiente.
- **Sí: `short` y `long` nuevos.** El texto de la maqueta hablaba de «núcleos magenta», y el juego
  real va de fruta.
- **Sí: `ARCADE`, `green` y la posición 4, sin cambios.** Son de la fila convertida.
- **Sí: redibujar `.cover-snake` con el mismo nombre de clase.** Una fruta sustituye al núcleo
  magenta.
  - No: una clase nueva `cover-serpentina`, que tocaba `CoverClass` y la columna `cover` sin
    necesidad.
  - No: dejarla igual, que no cuadraba con el texto nuevo.

### Contrato

- **Sí: `lives: null`, una sola vida.** Es el snake clásico, y la spec 07 ya lo resolvió en el HUD.
  - No: 3 vidas reapareciendo en el centro, que quitaba tensión al género.
- **Sí: la victoria (tablero lleno) es `gameover` con la puntuación final.** El modal no cambia.
  - No: un estado `won`, que toca el contrato por un solo juego.
- **Sí: los giros con `pressed()`, una vez por pulsación.** Mantener la tecla no repite el giro.
  - No: `typed()`, porque la autorrepetición del sistema metería giros fantasma en la cola.
- **Sí: una cola de 2 giros por paso.** El giro en U rápido no se pierde.
  - No: aplicar solo el último giro del paso, que se come pulsaciones a velocidad alta.
- **Sin cambios en `types.ts`, `keyboard.ts`, `GameCanvas.tsx` ni `GamePlayerScreen.tsx`.** Las
  flechas ya están en `GAME_KEYS`, y WASD son letras que no hacen scroll.

### Assets y sonido

- **No: `references/source-assets/snake-assets/fruits.png`.** El `sprites.js` que lo acompañaba
  citaba spriters-resource, _Google Snake Game_, como su origen. Es el arte de un juego comercial, y
  la plataforma solo publica assets propios o con licencia. Quitar esa línea del fichero no cambia
  el origen de la imagen.
  - La persona preguntó si valdrían imágenes generadas por IA. Sí: cualquier hoja propia, generada
    o dibujada sin imitar un arte ajeno, cabe en una spec posterior, con su `CREDITS.md`.
  - El `sprites.js` tenía además los nombres desalineados con la imagen. Por ejemplo, en `x=34` hay
    una manzana y no un plátano, y `garlic`, `melon` y `grapes2` no existen en la hoja.
- **Sí: pixel art original dibujado por código,** en matrices de `sprites.ts`, sin ficheros ni
  `drawImage`. El dibujo queda aislado para cambiarlo por una hoja propia más adelante.
  - No: esperar a una hoja generada por la persona, que retrasaba el juego por un asset sustituible.
- **Sí: sin sonido.** La referencia no trae audio. El volumen y el silencio son de una spec de
  plataforma.

### Diseño

- **Sí: el borde mata.**
  - No: bordes que dan la vuelta, que es otra variante del género y queda fuera.
- **Sí: 8 pasos/s en el nivel 1, +1 por nivel, tope de 18 y nivel cada 5 frutas.** Lo propuso el
  inventario y la persona lo aceptó. Se puede ajustar al jugar, anotándolo aquí.
- **Sí: fruta normal a `10 × nivel` y fruta dorada a `50 × nivel`.** La dorada aparece al subir de
  nivel, dura 5 s y no alarga.
  - No: sin fruta bonus, que quitaba el riesgo y la recompensa típicos del género.
- **Sí: un tablero de 32 × 24 celdas de 25 px.** Celdas legibles bajo el CRT.
  - No: 40 × 30 de 20 px, con una partida más larga pero celdas más pequeñas bajo las scanlines.
- **Sí: el tipo de fruta es solo estético.** Las 8 valen lo mismo.
  - No: frutas con efectos distintos, que son otra spec.
- **No: el contador de LONGITUD en el canvas.** El tablero ocupa el lienzo entero y el contador
  taparía celdas jugables.
- **Sí: la dorada es una matriz de 12×12** (la manzana con un anillo de contorno de 1 píxel), a
  `floor(25 / 12) = 2` px por píxel: 24 px centrados en la caja de `GOLDEN_SIZE` (25). Decidido al
  implementar: una matriz de 10×10 no cabe en 25 px con píxeles enteros e iguales.
  - No: bordes redondeados a 25 px exactos, con píxeles de 2 y 3 px alternos.
  - No: subir `GOLDEN_SIZE` a 30, que invade las celdas vecinas.
- **Corregido al implementar: la home no muestra `JUGABLE` ni puntuaciones en sus destacados.**
  `MiniCard` nunca los ha mostrado para ningún juego (tampoco ASTEROIDES); solo la biblioteca y el
  detalle llevan la insignia. La spec decía lo contrario en el paso 8 y en dos criterios, y se
  corrigió el texto, no el código.
  - No: añadir la insignia a `MiniCard`, que toca un componente fuera de esta spec. Si se quiere,
    va en otra.
- **Sí: la muerte sin parpadeo,** con la serpiente atenuada y una ✕. La dorada parpadea a 2 Hz
  (≤ 3/s), y se distingue por tamaño, contorno y barra, no solo por el color.

- **Sí: una tolerancia de 1 ns en el acumulador** (`acc >= interval - STEP_EPSILON`, con
  `STEP_EPSILON = 1e-9`). Decidido al implementar: con la comparación exacta, la simulación daba 79
  pasos en 10 s a 60, 90 y 144 Hz y 80 a 120 Hz. El paso 80 toca justo en t = 10 s, y el redondeo
  dejaba `acc` a 1e-15 s del intervalo, así que caía un fotograma tarde.
  - No: aceptar 80 ± 1 en el criterio, que dejaba el retraso de un fotograma por redondeo.

### Operación

- **Sí: `db:push` lo ejecuta Claude en `/spec-impl`,** tras el `--dry-run` y con la confirmación
  explícita de la persona en ese paso.

---

## Riesgos

| Riesgo                                                                                 | Mitigación                                                                                                                                                                       |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db:push` escribe en producción (`vrepjeurrsaekrosmuye`).                              | Es un `update` de 2 columnas de texto en 1 fila, sin reordenar nada. Primero el `--dry-run`, después la confirmación explícita, y la verificación con `select` y `get_advisors`. |
| El `update` se aplica a otra fila o a ninguna.                                         | `where id = 'serpentina'`. El `select` posterior confirma 11 filas, con las posiciones intactas y solo los textos de `serpentina` cambiados.                                     |
| Convertir la maqueta rompe una expectativa de los usuarios.                            | La maqueta tiene 0 puntuaciones y mantiene título, portada base, color y posición: nada desaparece.                                                                              |
| A velocidad alta (18 pasos/s) se pierden giros o la serpiente se muerde al girar en U. | La cola de 2 giros, el descarte del giro contrario y la celda de la cola liberada en el mismo paso. Se prueba al jugar en el nivel 11 o más.                                     |
| El paso depende de la tasa de refresco.                                                | Acumulador con `acc -= interval` y `dt` acotado a 0.05 s. La simulación a 60 y a 120 Hz da los mismos 80 pasos.                                                                  |
| Saltos de varios pasos al reanudar o al volver de otra pestaña.                        | `lastTime` se reinicia al reanudar y `dt` se acota, así que como mucho hay 1 paso por fotograma.                                                                                 |
| StrictMode monta dos bucles.                                                           | Órdenes idempotentes y `destroy()` que cancela el rAF. Se comprueba que la tasa de rAF es la del monitor.                                                                        |
| Las frutas de 10×10 no se leen bajo las scanlines del CRT.                             | Se revisan en el paso de diseño del canvas: se puede retocar la paleta o la matriz sin tocar la mecánica.                                                                        |
| Alguien vuelve a meter `fruits.png` en el juego.                                       | Lo descarta Decisiones, y un criterio exige que no haya `drawImage` ni `public/games/serpentina/`.                                                                               |

---

## Lo que **no** entra en esta spec

- Convertir o retirar otras maquetas.
- Bordes que dan la vuelta, obstáculos o mapas por nivel, frutas con efectos, acelerar manteniendo
  la tecla y dos jugadores.
- Usar `references/source-assets/snake-assets/fruits.png` o cualquier hoja de sprites.
- Sonido, y el volumen o el silencio de la plataforma.
- Controles táctiles.
- Guardar la longitud o el nivel en `scores`, y cualquier cambio de esquema.
- Código de ranking, leaderboard o puntuaciones.
- Cambiar asteroides, tuerca o ladrillazo.
- Tests y runner de tests.
- Modificar `references/`.

Cada uno, si llega, va en su propia spec.
