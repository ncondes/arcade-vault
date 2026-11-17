# SPEC 08 — Ladrillazo, el tercer juego real

> **Estado:** Implementado
> **Depende de:** 05-juego-asteroides (implementada), 06-catalogo-y-puntuaciones-en-supabase
> (implementada), 07-juego-tuerca (implementada)
> **Fecha:** 2026-11-17
> **Objetivo:** Portar `references/started-games/04-arkanoid/` como el juego jugable `ladrillazo`,
> con sus sprites y sus sonidos, sembrado en el catálogo con una migración, para que sus
> puntuaciones lleguen a los rankings que ya existen.

---

## Por qué existe esta spec

Es el último juego que queda en `references/started-games/`. Asteroides y tuerca se dibujan con
formas y no suenan. Este trae tres cosas que el runtime no ha usado todavía:

- **Ratón.** La pala sigue al cursor. El motor escucha `pointermove` en el canvas que ya recibe.
- **Sprites.** El spritesheet del original se migra a `public/games/ladrillazo/` y lo carga el
  motor. Es un pack de Petraheim, y se le acredita.
- **Sonido.** Los dos efectos del original, sin control de volumen. El silencio global es cosa de
  una spec de plataforma.

Ninguna de las tres toca el contrato común: `types.ts`, `keyboard.ts` y `GameCanvas.tsx` no
cambian. El ranking tampoco necesita código. Desde la spec 06, un juego con fila en `games` y
entrada en `registry.ts` ya guarda sus puntuaciones y sale en todas las clasificaciones.

---

## Alcance

**Dentro:**

### Catálogo

- **Migración `add_ladrillazo`**, creada con `npm run db:migration add_ladrillazo`. Es un
  `insert` de la fila `ladrillazo` al final del catálogo, en `max(position) + 1` (hoy, 11), y no
  toca ninguna otra fila.
  - `title` `LADRILLAZO`, `category` `ARCADE`, `color` `magenta` y `cover` `cover-ladrillazo`.
  - `short` y `long` como en _Modelo de datos_. El `long` termina con «Gráficos de Petraheim.».
- **`CoverClass`** en `app/lib/types.ts` gana `"cover-ladrillazo"`.
- **`.cover-ladrillazo`** en `app/globals.css`: un muro escalonado con un hueco, y la bola y la pala
  abajo, sobre fondo oscuro. A tamaño de tarjeta tiene que distinguirse de `.cover-bricks`, que son
  franjas de colores.
- **Cascadas aceptadas:**
  - la biblioteca pasa a 11 tarjetas;
  - la estadística de la home pasa a `11+`;
  - el hall of fame pasa a 11 pestañas, con LADRILLAZO la última;
  - los 6 destacados de la home y la pestaña por defecto (ASTEROIDES) no cambian.
- **`bloque-buster` no se toca:** su fila, su portada y su maqueta siguen igual.

### Contrato

- **Sin cambios.** `types.ts`, `keyboard.ts`, `GameCanvas.tsx` y `GamePlayerScreen.tsx` no se
  tocan. El ratón, los sprites y el sonido viven dentro del motor.

### Assets `public/games/ladrillazo/`

- `spritesheet-breakout.png`, copiado tal cual de la referencia.
- `sounds/ball-bounce.mp3` y `sounds/break-sound.mp3`, copiados tal cual.
- `CREDITS.md`: los gráficos son de Petraheim, y la licencia del pack no viene con la referencia.

### Motor `app/lib/arcade/ladrillazo/`

- **TypeScript puro**: recibe el canvas, guarda el estado en la instancia y lleva los números, los
  rectángulos de los sprites y los fotogramas de explosión en `constants.ts`. No usa
  `getElementById`, `querySelector`, `localStorage` ni globales de módulo.
- **Números portados 1:1:**
  - pala en `y` 560, de 81 × 14, centrada al empezar, a `PADDLE_SPEED` 400 px/s;
  - bola de 16 × 16 con `vx` 200 y `vy` −300, multiplicadas por la velocidad del nivel;
  - muro de 10 × 6 ladrillos de 64 × 24, con origen en (80, 80);
  - 5 niveles con los mismos patrones, colores y velocidades (1.00, 1.10, 1.21, 1.33 y 1.46);
  - 10 puntos por ladrillo y 3 vidas;
  - explosión de 4 fotogramas en 150 ms.
- **Mecánica 1:1, con sus peculiaridades:**
  - la pala solo invierte `vy`, en una ventana de `h + 8` px;
  - el ladrillo invierte solo `vy`, con un choque por fotograma;
  - la bola sale al instante al perder una vida o al cambiar de nivel, y la pala no se recoloca;
  - los grises explotan con los fotogramas de los rojos.
- **Fin de partida:**
  - sin vidas → `gameover`;
  - nivel 5 limpio → `gameover` con la puntuación final.
- **Controles:**
  - `←` `→` con `held()`;
  - el ratón: `pointermove` en el canvas recibido, con la coordenada escalada por
    `W / rect.width`;
  - el ratón solo mueve la pala en `playing`, y `destroy()` quita su listener.
- **Sprites:**
  - el motor carga `/games/ladrillazo/spritesheet-breakout.png` con `new Image()`;
  - no dibuja sprites hasta que la imagen carga;
  - `imageSmoothingEnabled = false`.
- **Sonido:**
  - un `Audio` por efecto en la instancia, que suena con `cloneNode().play()` y la promesa rechazada
    capturada;
  - rebote en las paredes y la pala, y rotura en los ladrillos;
  - volumen 1;
  - solo suena en `playing`.
- **Correcciones de plataforma**, que no cambian el balance:
  - `dt` acotado a 0.05 s;
  - el teclado se limpia en el primer fotograma tras `start` y `resume`;
  - un `draw()` explícito al entrar en `gameover`;
  - la puntuación con `Math.floor` y acotada a `[0, 10000000]`.
- **Lienzo de 800×600** con HiDPI por `devicePixelRatio`, igual que asteroides y tuerca.
- **Fuera del original:**
  - el HUD del canvas (Score, Nivel y las vidas como bolas);
  - los overlays de GAME OVER, de victoria y de PAUSA;
  - las teclas `P` y `Escape` propias;
  - el selector de nivel por clic;
  - que el ratón mueva la pala en pausa o en el game over.

### Registro y documentación

- **`registry.ts`:** una línea, `ladrillazo: () => import("@/app/lib/arcade/ladrillazo")…`.
- **`CLAUDE.md`:**
  - pasa a decir tres juegos reales, y que ya no queda ninguno en `references/`;
  - documenta en el runtime el patrón del ratón, los assets en `public/games/<id>/` y el sonido
    dentro del motor, sin volumen de plataforma.
- **`.claude/skills/new-game/contract-gaps.md`:**
  - corrige la fila de la tecla de arranque: limpiar en el primer fotograma, no tras `attach()`;
  - anota este juego como el precedente de las filas de ratón, imágenes y sonido.

**Fuera** — cada uno, si llega, en su propia spec:

- Convertir o retirar `bloque-buster` u otras maquetas.
- Cambios de mecánica:
  - un ángulo según el punto de impacto;
  - una pausa de saque;
  - power-ups, multibola, ladrillos de varios golpes y más niveles.
- Un selector o salto de nivel.
- Volumen, silencio o preferencias de sonido de la plataforma.
- Controles táctiles.
- Arte nuevo o redibujado: solo se usan los sprites del pack.
- Guardar el nivel en `scores` y cualquier cambio de esquema.
- Código de ranking, leaderboard o puntuaciones: ya existe desde la spec 06.
- Cambiar asteroides o tuerca, más allá de comprobar que siguen igual.
- Tests y runner de tests.
- Modificar `references/started-games/`.

---

## Modelo de datos

### Ficheros

```
app/lib/arcade/ladrillazo/
  index.ts      — la única puerta pública: width, height, controls, createEngine
  constants.ts  — números del original, rectángulos de los sprites, rutas de los assets
  levels.ts     — los 5 niveles de levels.js y buildBlocks(level), sin canvas ni DOM
  sprites.ts    — createSpritesheet(src): carga la imagen y dibuja rectángulos, por instancia
  sounds.ts     — createSounds(): rebote y rotura, con cloneNode().play() y el rechazo capturado
  engine.ts     — estado de partida, entrada (teclado y ratón), bucle y dibujo

public/games/ladrillazo/
  spritesheet-breakout.png
  sounds/ball-bounce.mp3
  sounds/break-sound.mp3
  CREDITS.md
```

`sprites.ts` sustituye a `assets/spritesheet.js`. El original guarda la imagen en globales de módulo
(`ssImg`, `ssLoaded`), y aquí cada motor tiene la suya. Nadie fuera de `ladrillazo/` importa
`engine`, `constants`, `levels`, `sprites` ni `sounds`.

### Cambios en el contrato

Ninguno. Se reutiliza tal y como quedó en la spec 07.

### La instantánea publicada

`{ score, lives, level, status }`, con `lives` un número de 3 a 0. Se publica al crear el motor (en
`idle`) y después solo cuando cambia algún valor:

- `score` cambia con cada ladrillo roto;
- `lives` cambia al caer la bola;
- `level` cambia al limpiar un muro, de 1 a 5;
- `status` cambia con `start`, `pause`, `resume`, `end`, el game over y la victoria.

Al limpiar el nivel 5, `level` se queda en 5 y `status` pasa a `gameover`.

### Estado de la instancia (`engine.ts`)

```ts
type BlockColor = "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";
type Block = { x: number; y: number; w: number; h: number; color: BlockColor; alive: boolean };
type Explosion = { x: number; y: number; w: number; h: number; color: BlockColor; elapsed: number };
// paddle { x, y, w, h }, ball { x, y, w, h, vx, vy }, blocks, explosions,
// score, lives, level, status, lastTime, rafId
```

`update(dt)` sigue el orden del original:

1. la pala con las flechas;
2. la bola se mueve;
3. las paredes;
4. la pala;
5. los ladrillos, como mucho uno por fotograma, y el cambio de nivel;
6. las explosiones;
7. la bola perdida.

### Ratón

- `pointermove` en el canvas recibido. La coordenada es `(clientX − rect.left) · W / rect.width`.
- Hay que usar `W` (800) y no `canvas.width`, que con HiDPI vale `800 · dpr`.
- La pala queda centrada en el cursor, acotada a `[0, W − w]`, y solo se mueve en `playing`.
- El listener se añade al crear el motor y `destroy()` lo quita.

### `constants.ts`

| Constante                                                | Valor                                                                      | Origen                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| `W`, `H`                                                 | `800`, `600`                                                               | 1:1, ya es 4:3                            |
| `PADDLE_Y`, `PADDLE_W`, `PADDLE_H`                       | `560`, `81`, `14`                                                          | 1:1 con el código, no el README           |
| `PADDLE_SPEED`                                           | `400` px/s                                                                 | 1:1                                       |
| `PADDLE_CATCH`                                           | `8` px, el margen bajo la pala en el que todavía rebota                    | 1:1                                       |
| `BALL_SIZE`                                              | `16`                                                                       | 1:1                                       |
| `BASE_BALL_VX`, `BASE_BALL_VY`                           | `200`, `-300` px/s                                                         | 1:1                                       |
| `BLOCK_COLS`, `BLOCK_ROWS`, `BLOCK_W`, `BLOCK_H`         | `10`, `6`, `64`, `24`                                                      | 1:1                                       |
| `BLOCKS_ORIGIN_X`, `BLOCKS_ORIGIN_Y`                     | `80`, `80`                                                                 | 1:1                                       |
| `BLOCK_POINTS`                                           | `10`                                                                       | 1:1                                       |
| `LIVES`                                                  | `3`                                                                        | 1:1                                       |
| `SPRITES`, `EXPLOSION_FRAMES`                            | los rectángulos de `spritesheet.js`, idénticos (gris con fotogramas rojos) | 1:1                                       |
| `EXPLOSION_DURATION`                                     | `150` ms, 4 fotogramas                                                     | 1:1                                       |
| `BG`                                                     | `#000`                                                                     | 1:1; se revisa en el paso de diseño       |
| `DT_MAX`                                                 | `0.05` s                                                                   | corrección de plataforma, como asteroides |
| `SCORE_MAX`                                              | `10_000_000`                                                               | el `check` de `scores`                    |
| `SPRITESHEET_SRC`, `SOUND_BOUNCE_SRC`, `SOUND_BREAK_SRC` | `/games/ladrillazo/…`                                                      | assets migrados                           |

`BLOCK_COLORS` de `game.js` no se porta, porque el código del original nunca la usa.

### `levels.ts`

| Nivel | Patrón                 | Velocidad | Ladrillos |
| ----- | ---------------------- | --------- | --------- |
| 1     | Parrilla completa 10×6 | `1.00`    | 60        |
| 2     | Pirámide centrada      | `1.10`    | 40        |
| 3     | Ajedrez                | `1.21`    | 30        |
| 4     | Filas con huecos       | `1.33`    | 39        |
| 5     | Marco y cruz central   | `1.46`    | 39        |

En total son 208 ladrillos: la puntuación máxima es **2.080**. Los patrones y los colores por fila
son idénticos a los de `levels.js`.

### `index.ts`

```ts
controls: [
  ["← →", "Mover"],
  ["Ratón", "Mover"],
],
```

### Sprites y sonido

- La imagen se carga en `createEngine` y no se dibuja ningún sprite hasta que está cargada. Al
  cargar, hay un `draw()`.
- Si falla, hay un único `console.error`, como en el original.
- `ctx.imageSmoothingEnabled = false` se fija después del `setTransform` de HiDPI.
- `createSounds()` crea dos `Audio` por motor. Cada efecto suena con `cloneNode().play().catch(() => {})`.
- Solo suenan desde `update`, y `update` solo corre en `playing`.

### `CREDITS.md`

Indica que los gráficos de `spritesheet-breakout.png` son de **Petraheim** («Credits
Appreciated»), copiados de `references/started-games/04-arkanoid/`. También dice que la licencia
del pack no viene con la referencia.

### Fila del catálogo (`supabase/migrations/<timestamp>_add_ladrillazo.sql`)

```sql
-- Al final del catálogo: no toca ninguna otra fila.
insert into public.games (id, title, short, long, category, cover, color, position)
select 'ladrillazo', 'LADRILLAZO',
       'Rompe el muro ladrillo a ladrillo sin dejar caer la bola.',
       'Una pala, una bola y cinco muros que derribar. Mueve la pala con el ratón o con las flechas y devuelve la bola antes de que caiga: cada ladrillo vale 10 puntos y cada muro que tiras hace la bola un 10 % más rápida. Tienes tres bolas para llegar al final del quinto. Gráficos de Petraheim.',
       'ARCADE', 'cover-ladrillazo', 'magenta',
       coalesce(max(position), 0) + 1
from public.games;
```

**Sin cambios de esquema:** ni tablas, ni columnas, ni políticas, ni vistas. `npm run db:types` no
produce diff.

---

## Plan de implementación

Cada paso deja `npm run build` en verde y la web funcionando.

1. **Assets.**
   - Copiar `spritesheet-breakout.png` y los dos mp3 de la referencia a `public/games/ladrillazo/`,
     sin modificarlos.
   - Escribir `CREDITS.md` con el crédito a Petraheim y la nota de la licencia.
   - Prueba manual: `/games/ladrillazo/spritesheet-breakout.png` y los dos
     `/games/ladrillazo/sounds/*.mp3` responden 200 en `npm run dev`.
   - `git status references/` sigue limpio.

2. **Constantes y niveles.**
   - `ladrillazo/constants.ts` con la tabla del modelo de datos.
   - `ladrillazo/levels.ts` con los 5 niveles de `levels.js`, portados literalmente, y
     `buildBlocks(level)`.
   - Nadie los importa todavía.

3. **Sprites y sonidos** (`sprites.ts`, `sounds.ts`).
   - `createSpritesheet(src)`: carga la imagen en la instancia y expone `ready` y
     `draw(ctx, rect, x, y, w, h)`, que no dibuja nada mientras la imagen no ha cargado.
   - `createSounds()`: `bounce()` y `brick()` con `cloneNode().play().catch(() => {})`.
   - Nadie los importa todavía.

4. **Motor: estado, reglas y bucle** (`engine.ts`).
   - El estado vive en la instancia.
   - `start`, `pause`, `resume`, `end`, `restart` y `destroy` son idempotentes.
   - `update(dt)` en el orden del original, con `dt` acotado a `DT_MAX`.
   - Paredes, pala (solo `vy`, ventana `PADDLE_CATCH`), ladrillos (AABB, solo `vy`, uno por
     fotograma), bola perdida y cambio de nivel.
   - Fin de partida: sin vidas → `gameover`; nivel 5 limpio → `gameover`.
   - Puntuación con `Math.floor` y el tope de `SCORE_MAX`.
   - `publish()` solo cuando cambia algún valor, y una vez al crear el motor.
   - Al pausar se limpian las teclas, y al reanudar se reinicia `lastTime`.
   - El dibujo, mínimo: rectángulos para la pala, la bola y los ladrillos.

5. **Motor: entrada.**
   - `held("ArrowLeft")` y `held("ArrowRight")`.
   - `pointermove` en el canvas, escalado por `W / rect.width`, solo en `playing`. `destroy()` lo
     quita.
   - `keyboard.clear()` en el primer fotograma tras arrancar o reanudar (`lastTime === null`).
   - Ni `KeyP`, ni el `Escape` propio, ni el clic del selector de nivel.

6. **Motor: sprites, sonido, dibujo completo e `index.ts`.**
   - El lienzo de 800×600 con HiDPI, igual que asteroides, e `imageSmoothingEnabled = false` tras
     el `setTransform`.
   - Ladrillos, explosiones (4 fotogramas en 150 ms), pala y bola con los sprites. Al cargar la
     imagen hay un `draw()`.
   - Rebote en las paredes y la pala, y rotura en los ladrillos.
   - Un `draw()` explícito al entrar en `gameover`.
   - `index.ts` con `width`, `height`, `controls` y `createEngine`.
   - Sigue sin registrar.

7. **Portada `cover-ladrillazo`**, con el skill `/frontend-design`.
   - `| "cover-ladrillazo"` en `CoverClass` y `.cover-ladrillazo` en `globals.css`.
   - La portada no se ve hasta que exista la fila del paso 8.

8. **Migración.**
   - Invocar el skill `supabase`.
   - `npm run db:migration add_ladrillazo </dev/null` y escribir en el fichero el SQL del modelo de
     datos.
   - `npm run db:push -- --dry-run` para revisar qué se va a aplicar.
   - ⚠️ **`npm run db:push` escribe en la base de datos remota de producción
     (`vrepjeurrsaekrosmuye`).** El alcance es un `insert` de 1 fila en `games`, sin tocar ninguna
     otra. Antes de ejecutarlo se pide confirmación explícita a la persona en ese momento.
   - Verificar con el MCP:
     - un `select` del catálogo devuelve 11 filas, con `ladrillazo` en la posición 11;
     - `get_advisors` (security) no da avisos nuevos.
   - `npm run db:types` no produce diff.
   - `/games/ladrillazo` responde y `/games/ladrillazo/play` muestra la maqueta.
   - Se comprueban las cascadas: 11 tarjetas, `11+`, 11 pestañas, y los destacados sin cambios.

9. **Línea en el registro.**
   - `ladrillazo` en `registry.ts`.
   - El juego se juega de verdad y aparece el distintivo `JUGABLE`.

10. **Aspecto del canvas**, con el skill `/frontend-design`.
    - Los sprites no se redibujan.
    - Solo se decide el fondo (`BG`) y se comprueba que los sprites se leen bien bajo las scanlines
      del CRT.
    - `globals.css` solo se toca para el marco.

11. **Sesión de juego real**, con StrictMode y el original abierto al lado.
    - Recorrer cada mecánica del inventario, con el ratón y con las flechas.
    - El ratón no mueve la pala en pausa ni en el game over.
    - Comprobar el sonido.
    - Pausar con el botón y con `Esc`, y cambiar de pestaña.
    - Pulsar `FIN`, y llegar a un game over natural.
    - La simulación en Node de la lógica, con una pala perfecta, limpia los 5 muros y termina en
      `gameover` con 2.080 puntos. No se deja código de depuración.
    - Guardar como `KAI`, salir y volver a entrar.
    - Jugar otra vez a asteroides y a tuerca.

12. **Documentación.**
    - `CLAUDE.md`: tres juegos reales, ninguno esperando en `references/`, y el ratón, los assets y
      el sonido en la sección del runtime.
    - `.claude/skills/new-game/contract-gaps.md`: la fila de la tecla de arranque corregida, y este
      juego anotado como precedente del ratón, las imágenes y el sonido.

13. **Verificación final:** `npm run lint`, `npm run build`, `npm run format:check` y
    `npx tsc --noEmit`, los cuatro en verde.

---

## Criterios de aceptación

### Compilación y formato

- [x] `npm run lint` termina sin errores ni warnings.
- [x] `npm run build` termina sin errores.
- [x] `npm run format:check` pasa.
- [x] `npx tsc --noEmit` no da errores.

### Contrato

- [x] `app/lib/arcade/ladrillazo/index.ts` exporta `width` (800), `height` (600), `controls` y
      `createEngine`.
- [x] `grep -rn "arcade/ladrillazo/" app --include="*.ts" --include="*.tsx"` no devuelve ninguna
      línea fuera de `app/lib/arcade/ladrillazo/` que apunte a `engine`, `constants`, `levels`,
      `sprites` o `sounds`.
- [x] `grep -rn "getElementById\|querySelector\|getComputedStyle\|localStorage" app/lib/arcade/` no
      devuelve nada.
- [x] `grep -n "ladrillazo" app/components/*.tsx` no devuelve nada.
- [x] El motor no declara estado de partida a nivel de módulo: `paddle`, `ball`, `blocks`,
      `explosions`, `score`, `lives`, `level`, la imagen y los `Audio` viven en la instancia.
- [x] `git diff` de `app/lib/arcade/types.ts`, `app/lib/arcade/keyboard.ts`,
      `app/components/GameCanvas.tsx` y `app/components/GamePlayerScreen.tsx` sale limpio.
- [x] Las constantes coinciden una a una con `game.js`, `levels.js` y `spritesheet.js`:
  - las medidas y la velocidad de la pala, y `PADDLE_CATCH`;
  - el tamaño de la bola y su velocidad base;
  - la rejilla, el tamaño y el origen de los ladrillos;
  - los 5 patrones, sus colores y sus velocidades;
  - `SPRITES`, `EXPLOSION_FRAMES` y `EXPLOSION_DURATION`.
- [x] `git status references/` sale limpio.

### Assets

- [x] `cmp` confirma que el PNG y los dos mp3 de `public/games/ladrillazo/` son idénticos byte a
      byte a los de la referencia.
- [x] `public/games/ladrillazo/CREDITS.md` acredita a Petraheim y anota que la licencia no viene con
      la referencia.
- [x] El `long` de la fila termina con «Gráficos de Petraheim.», y se ve en `/games/ladrillazo`.

### Base de datos

- [x] Existe `supabase/migrations/<timestamp>_add_ladrillazo.sql`, y
      `npx supabase migration list --linked` lo muestra aplicado en local y en remoto.
- [x] `games` tiene 11 filas. `ladrillazo` está en la posición 11 y las posiciones 1–10 no han
      cambiado.
- [x] La fila `ladrillazo` tiene `LADRILLAZO`, `ARCADE`, `cover-ladrillazo`, `magenta` y el
      `short`/`long` de la spec.
- [x] `get_advisors` (security) no da avisos nuevos.
- [x] `npm run db:types` no produce diff.

### Catálogo

- [x] La biblioteca muestra 11 tarjetas con `TODOS`, y LADRILLAZO aparece bajo `ARCADE` junto a
      BLOQUE BUSTER.
- [x] `JUGABLE` sale solo en ASTEROIDES, TUERCA y LADRILLAZO.
- [x] `.cover-ladrillazo` y `.cover-bricks` se distinguen a simple vista en la biblioteca.
- [x] La estadística de la home dice `11+`, y sus 6 destacados son los mismos que antes.
- [x] El hall of fame tiene 11 pestañas, abre en ASTEROIDES y LADRILLAZO es la última.
- [x] `/games/bloque-buster` y `/games/bloque-buster/play` siguen idénticos, con la maqueta.

### El juego

Todo esto se comprueba jugando en `/games/ladrillazo/play`, salvo la simulación:

- [x] El bucle no corre hasta el primer clic o tecla. El overlay lista `← →` Mover y `Ratón` Mover.
- [x] El muro 1 es la parrilla completa de 10 × 6 con los colores por fila del original. La pala
      está centrada y la bola sale nada más empezar.
- [x] Ni `P` ni el clic en el canvas hacen nada.
- [x] `←` y `→` mueven la pala a 400 px/s, y la pala no sale del canvas.
- [x] Con el ratón, la pala sigue al cursor centrada en él. Funciona a cualquier tamaño de ventana y
      con cualquier `devicePixelRatio`.
- [x] En pausa y en el game over, el ratón no mueve la pala.
- [x] La bola rebota en las paredes laterales y en el techo.
- [x] En la pala, la bola invierte la dirección vertical y conserva el ángulo.
- [x] Cada ladrillo roto suma 10 puntos, muestra su explosión de 4 fotogramas y desvía la bola en
      vertical.
- [x] Los ladrillos grises del muro 2 explotan con los fotogramas rojos.
- [x] Al caer la bola se pierde una vida y la bola sale al instante desde la pala. Con la tercera
      caída la partida acaba.
- [x] Limpiar un muro carga el siguiente con su patrón, sube el nivel en el HUD y acelera la bola
      (×1.10, ×1.21, ×1.33 y ×1.46). La pala no se mueve de sitio.
- [x] Limpiar el muro 5 termina la partida con la puntuación final y abre el modal. _(Verificado con la simulación en Node, que termina en `gameover` con 2.080; el modal es el mismo camino que el game over natural y `FIN`, comprobados jugando.)_
- [x] Una simulación en Node con una pala que nunca falla limpia los 5 muros y termina con 2.080
      puntos.
- [x] El último estado queda dibujado en el game over.
- [x] Los sprites se ven nítidos, sin suavizado, y sin huecos ni bordes de los vecinos del
      spritesheet.
- [x] Suena el rebote en las paredes y la pala, y la rotura en cada ladrillo. _(Verificado contando las llamadas a `play()` y con sus promesas resueltas en Chrome; no se escuchó.)_
- [x] En pausa, en el modal y antes de empezar no suena nada.
- [x] La bola va a la misma velocidad a 60 Hz y a 120 Hz.
- [x] Ninguna parte del canvas parpadea más de 3 veces por segundo.

### HUD y plataforma

- [x] Puntuación, Vidas y Nivel coinciden en todo momento con el estado del juego.
- [x] `PAUSA` y `Esc` pausan y reanudan. Al reanudar, la bola no da un salto y no hay ninguna tecla
      pegada.
- [x] Cambiar de pestaña o hacer clic fuera pausa la partida, y al volver sigue en pausa.
- [x] `FIN` abre el modal con la puntuación de la partida en curso.
- [x] `JUGAR DE NUEVO` reinicia con el muro 1, 3 vidas, nivel 1 y 0 puntos.
- [x] Con la partida activa, las flechas no hacen scroll. En el arranque, en pausa y con el modal
      abierto, sí lo hacen.
- [x] Con StrictMode hay un solo bucle: la tasa de rAF es la del monitor.
- [x] Salir a `/games` y volver no deja ningún bucle huérfano ni un listener de `pointermove`.
- [x] La consola queda sin errores ni warnings durante una partida completa.

### Ranking (de la spec 06: se comprueba, sin código nuevo)

- [x] Guardar como `KAI` muestra PUNTUACIÓN GUARDADA, y `scores` tiene una fila con
      `game_id = 'ladrillazo'`.
- [x] Tras recargar, la marca aparece:
  - en el top 10 del detalle, en el récord y en PUNTUACIONES;
  - en la tarjeta de la biblioteca;
  - en la pestaña LADRILLAZO del hall of fame, con su podio;
  - en las últimas puntuaciones de la home.
- [x] La matriz POR JUGADOR gana la columna LADRILLAZO, detrás de TUERCA.

### Regresión

- [x] Asteroides se juega y guarda exactamente igual que antes:
  - el HUD muestra sus corazones y los baja al morir;
  - mantener `Espacio` dispara una sola bala;
  - el ratón no hace nada.
- [x] Tuerca se juega igual que antes, y el HUD sigue sin el bloque "Vidas".
- [x] `git diff app/lib/arcade/asteroides/ app/lib/arcade/tuerca/` sale limpio.
- [x] `grep -rln "Audio" app/lib/arcade/` solo devuelve `app/lib/arcade/ladrillazo/sounds.ts`.
- [x] `grep -rln "new Image" app/lib/arcade/` solo devuelve `app/lib/arcade/ladrillazo/sprites.ts`.
- [x] `/about` sigue enviando por Resend. _(Verificado sin enviar un correo real: el formulario se muestra y el código de contacto no cambia respecto a `main`.)_
- [x] `AuthForm` sigue navegando a `/games`.
- [x] `/no-existe` sigue mostrando `app/not-found.tsx`.

### Documentación

- [x] `CLAUDE.md` dice que hay tres juegos reales y que no queda ninguno en `references/`.
- [x] `CLAUDE.md` documenta el ratón, los assets en `public/games/<id>/` y el sonido.
- [x] `contract-gaps.md` describe la limpieza en el primer fotograma y cita este juego como
      precedente del ratón, las imágenes y el sonido.

---

## Decisiones

### Catálogo

- **Sí: id nuevo `ladrillazo`, y `bloque-buster` se queda como maqueta.** Es el criterio de las
  specs 05 y 07.
  - No: convertir `bloque-buster` con un `update`. Evitaba el duplicado, pero rompía el precedente.
    Además, al estar en la posición 2, metía el juego en los destacados de la home.
  - Coste aceptado: dos rompeladrillos bajo `ARCADE`, y solo uno jugable.
- **Sí: título `LADRILLAZO`.** Es original, de una sola palabra como el resto del catálogo, y
  describe el golpe.
  - No: `REBOTE`, que es genérico.
  - No: `DERRIBO`, que se parece a «derrumbe» y a CAÍDA.
  - Nunca el nombre comercial del original.
- **Sí: `ARCADE` y `magenta`.** `magenta` es el color menos usado (solo CAÍDA) y lo separa del
  cyan de BLOQUE BUSTER.
- **Sí: portada propia `cover-ladrillazo`,** un muro escalonado con un hueco, la bola y la pala.
  - No: reutilizar `cover-bricks`, que dejaría dos tarjetas iguales.
- **Sí: al final del catálogo (posición 11).** Es un `insert` que no toca ninguna otra fila.
  - No: otra posición, que reordena filas en producción.

### Contrato

- **Sí: el ratón vive en el motor,** con `pointermove` en el canvas que recibe, escalado por
  `W / rect.width`, solo en `playing` y retirado en `destroy()`.
  - No: solo teclado, que pierde el control natural del género.
  - No: escuchar en `document`, que rompería la pausa al hacer clic fuera.
  - No: un soporte de puntero en `GameCanvas`, que obligaría a cambiar el contrato por un solo
    juego.
- **Sí: la victoria es `gameover` con la puntuación final.** El modal no cambia.
  - No: un estado `won`, que toca el contrato, el HUD y el modal para un solo juego.
- **Sin cambios en `types.ts`, `keyboard.ts`, `GameCanvas.tsx` ni `GamePlayerScreen.tsx`.** Las
  vidas (3) caben tal cual, las flechas ya están en `GAME_KEYS` y no hay ningún valor extra para el
  HUD.

### Assets y sonido

- **Sí: migrar el spritesheet del original** a `public/games/ladrillazo/`, sin tocarlo, y cargarlo
  en el motor. Lo decidió la persona: ya estaba integrado en el juego de la referencia.
  - No: redibujar con formas al estilo neón. No había duda de licencia, pero perdía el aspecto del
    original.
  - **La licencia del pack de Petraheim no está en el repo.** Usarlo es decisión de la persona, y
    queda anotado en `CREDITS.md`.
- **Sí: crédito en la última frase del `long`** («Gráficos de Petraheim.»), que el jugador ve en el
  detalle, **y en `CREDITS.md`.**
  - No: solo `CREDITS.md`, que el jugador no ve.
  - No: el crédito dibujado en el canvas, que ensucia el tablero.
- **Sí: `imageSmoothingEnabled = false`.** Con `dpr` 2 todos los factores son enteros y el pixel
  art sale nítido. Es una corrección visual, no de balance.
  - No: 1:1 con suavizado, que da sprites borrosos.
- **Sí: sonido en esta spec,** con los dos mp3 del original, a volumen 1 y donde suenan en el
  original.
  - No: dejarlo fuera, como en la spec 05. La persona lo quiere en el juego.
  - El rechazo de `play()` se captura, para que la consola quede limpia.
- **Sí: sin silencio propio.** El silencio global (botón y preferencia guardada) es de una spec de
  plataforma. Mientras tanto se silencia la pestaña.
  - No: una tecla `M` solo en este juego y sin guardar la preferencia.

### Fidelidad

- **Sí: números y mecánica 1:1, con las peculiaridades del código:**
  - el ángulo es fijo en la pala;
  - el ladrillo invierte solo `vy`, con un choque por fotograma;
  - el saque es instantáneo;
  - la pala no se recoloca entre niveles;
  - los grises explotan con los fotogramas rojos.

  Es el precedente del `3x` de asteroides y de la tuerca.
  - No: el ángulo según el punto de impacto. Es lo clásico del género, pero cambia el balance.
  - Coste aceptado: la puntuación máxima es 2.080, y quien termine el juego empata. El empate lo
    gana quien llegó antes.

- **Sí: el código manda sobre el README y el `CLAUDE.md` de la referencia:**
  - la pala mide 81 de ancho, no 162;
  - `currentLevel` empieza en 1;
  - la pausa es `isPaused`, no un estado de `gameState`;
  - el campo es `speed`, no `ballSpeedMultiplier`.
- **Sí: correcciones de plataforma**, que no cuentan como cambio de balance:
  - `dt` acotado a 0.05 s, para que un tirón no haga atravesar la pala;
  - el teclado se limpia en el primer fotograma tras `start` y `resume`;
  - un `draw()` explícito en el game over;
  - la puntuación con `Math.floor` y acotada a `SCORE_MAX`.
- **Fuera del original:**
  - `P` y el `Escape` propios: la pausa es del envoltorio;
  - el selector de nivel por clic;
  - el HUD y los overlays del canvas;
  - que el ratón mueva la pala en pausa o en el game over;
  - `BLOCK_COLORS`, que el código nunca usa.

### Visual

- **Sí: el paso de diseño del canvas solo decide el fondo y comprueba la legibilidad bajo el CRT.**
  Los sprites no se tocan.

### Operación

- **Sí: Claude lanza `npm run db:push`** en el paso de la migración, después del `--dry-run` y con
  la confirmación explícita de la persona en ese momento.
  - No: que lo lance la persona a mano.
- **Sí: corregir `contract-gaps.md` en esta spec.** La fila de la tecla de arranque quedó pendiente
  en la spec 07, y si no se corrige, el siguiente juego heredaría el arreglo que no basta.
- **Sí: la victoria se verifica con una simulación en Node con una pala perfecta.** Cubre a la vez
  la victoria y el riesgo de un muro imposible.
  - No: solo jugando hasta el final, que lleva mucho rato y no descarta el riesgo.

---

## Riesgos

| Riesgo                                                                                                                                                                                                                       | Mitigación                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db:push` escribe en producción.                                                                                                                                                                                             | `--dry-run` antes, un único `insert` que no toca otras filas, confirmación explícita en el momento, y `get_advisors` después.                                                                                                     |
| La licencia del pack de Petraheim no está verificada, y el repo y la web son públicos.                                                                                                                                       | Crédito visible en el `long` y `CREDITS.md`. Los sprites quedan aislados en `sprites.ts`, `SPRITES` y `public/games/ladrillazo/`: si la licencia no lo permite, se sustituyen por formas en su propia spec sin tocar la mecánica. |
| **El ángulo fijo hace que la trayectoria de la bola no dependa del jugador:** la pala solo decide si rebota, no hacia dónde. Algún muro podría tener ladrillos que la bola no visite nunca, y la partida no se podría ganar. | La simulación en Node del paso 11 juega los 5 muros con una pala perfecta y comprueba que todos se limpian. Si alguno no se limpia, `FIN` sigue guardando la puntuación, y el ángulo según el impacto pasa a su propia spec.      |
| La imagen no carga y el juego se queda invisible pero corriendo.                                                                                                                                                             | Es un fichero estático del mismo origen, comprobado con un 200 en el paso 1. Si falla, un único `console.error`, como en el original.                                                                                             |
| Con el suavizado desactivado y factores no enteros (`dpr` 1), asoma un píxel del sprite vecino.                                                                                                                              | Hay un criterio de aceptación para ello. Si pasa, se redondean las coordenadas de destino al dibujar, sin cambiar la física.                                                                                                      |
| El sonido sin control de volumen molesta.                                                                                                                                                                                    | Suena solo en `playing` y se silencia la pestaña desde el navegador. El silencio global es de una spec de plataforma.                                                                                                             |
| `play()` rechazado por la política de autoplay.                                                                                                                                                                              | La partida siempre empieza con un gesto (clic o tecla), y el rechazo se captura para que la consola quede limpia.                                                                                                                 |
| La bola atraviesa la pala o un ladrillo tras un tirón.                                                                                                                                                                       | `DT_MAX` 0.05 s: a la velocidad máxima (×1.46, `vy` 438 px/s) avanza 21.9 px por fotograma, por debajo de la ventana de la pala (22 px) y del alto del ladrillo (24 px). Va justo, y queda anotado.                               |
| Bucles dobles con StrictMode, o un `pointermove` huérfano al salir.                                                                                                                                                          | `destroy()` cancela el rAF y quita el listener. Hay un criterio de aceptación para cada cosa.                                                                                                                                     |
| La pala no sigue al cursor con el canvas escalado por CSS o con HiDPI.                                                                                                                                                       | Se escala con `W / rect.width`, nunca con `canvas.width`.                                                                                                                                                                         |
| Dos rompeladrillos en la biblioteca, uno jugable y otro maqueta.                                                                                                                                                             | Aceptado, como CAÍDA y TUERCA. Retirar maquetas es otra spec.                                                                                                                                                                     |

---

## Lo que **no** entra en esta spec

- Convertir o retirar `bloque-buster` u otras maquetas.
- El ángulo según el punto de impacto, una pausa de saque, power-ups, multibola, ladrillos de varios
  golpes y más niveles.
- Un selector o salto de nivel.
- Volumen, silencio o preferencias de sonido de la plataforma.
- Controles táctiles.
- Arte nuevo o redibujado.
- Guardar el nivel en `scores` y cualquier cambio de esquema.
- Código de ranking, leaderboard o puntuaciones.
- Cambiar asteroides o tuerca.
- Tests y runner de tests.
- Modificar `references/started-games/`.

Cada uno, si llega, va en su propia spec.
