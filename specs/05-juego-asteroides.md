# SPEC 05 — Asteroides, el primer juego real

> **Estado:** Approved
> **Depende de:** 01-mvp-pantallas-visuales (implementada), 02-pantalla-de-inicio (implementada),
> 03-acerca-de-y-contacto (implementada), 04-configuracion-de-supabase (implementada)
> **Fecha:** 2026-11-09
> **Objetivo:** Convertir el juego de referencia `references/started-games/02-asteroids/game.js` en
> un juego real y jugable dentro de la plataforma, añadido al catálogo como ficha independiente
> `asteroides`, con su motor en TypeScript puro y un HUD que refleja el estado de la partida — sin
> persistir ni una puntuación.

---

## Por qué existe esta spec

Las specs 01–03 construyeron ocho pantallas que prometen ocho juegos, y ninguno existe:
`/games/[id]/play` es una maqueta donde la puntuación es `game.best`, las vidas son la constante `3`
y el nivel la constante `3`. La spec 04 conectó Supabase y dejó la base de datos vacía a propósito.

Esta spec rompe la promesa vacía por primera vez: **un juego que se juega de verdad**. Y como hay
otros dos juegos de referencia esperando en `references/started-games/` (tetris y arkanoid), su
valor real no es solo el juego, sino el contrato que define: dónde vive un motor, cómo se registra,
cómo habla con el HUD y cómo la pantalla de juego decide entre canvas real y maqueta. Los dos
juegos siguientes deberían entrar sin rediseñar nada.

Lo que **no** hace, y es deliberado: no guarda puntuaciones. Al morir, el modal sigue siendo
maqueta. La persistencia necesita tabla, RLS e identidad de jugador — tres decisiones de dominios
distintos que van en su propia spec.

A partir de esta spec conviven en pantalla una puntuación real que no se guarda y un ranking
inventado que sí se muestra. Es una incoherencia aceptada y está anotada en riesgos.

---

## Alcance

**Dentro:**

### Catálogo

- **Ficha nueva `asteroides`** en `app/lib/games.ts`, **en primera posición**. Efectos aceptados: la
  biblioteca pasa a 9 tarjetas, el hall of fame a 9 pestañas con `asteroides` como pestaña por
  defecto, la home lo incluye en sus 6 destacados y su estadística pasa a `9+` (se deriva de
  `GAMES.length`, no hay número que corregir a mano).
- **`CoverClass`** en `app/lib/types.ts` gana el valor `"cover-asteroides"`.
- **`.cover-asteroides`** en `app/globals.css`: portada propia, distinta de `.cover-rocas`.
- `rocas` **no se toca**: sigue en el catálogo como maqueta, con su ficha y su portada actuales.

### Runtime de juegos (el contrato que heredan tetris y arkanoid)

- **`app/lib/arcade/types.ts`** — el contrato: qué es un motor, qué instantánea publica al HUD y qué
  órdenes acepta.
- **`app/lib/arcade/registry.ts`** — mapa `id → () => import(...)` con `asteroides` como única
  entrada, más el predicado que dice si un juego es jugable. Única fuente de verdad de "este juego
  es real": la usan la pantalla de juego, la tarjeta y el detalle.
- **`app/lib/arcade/asteroides/`** — el motor en **TypeScript puro**: sin React, sin
  `document.getElementById`, sin globales. Recibe el canvas, corre su bucle y publica estado.
  Mecánica y números **idénticos** al original (3 vidas, 3s de invencibilidad, 2s tras morir, 4
  asteroides en el nivel 1 y `3 + nivel` después, zona segura de 130px, cadencia 0.2s, balas de
  1.1s, 20/50/100 puntos, espacio toroidal, `dt` capado a 50ms, power-up `3x` al 15% garantizado a
  los 5 impactos, uno por nivel, 5s de duración, disparo solo al pulsar — sin autodisparo).
  **Dos correcciones:** la fricción `DRAG = 0.987` pasa de aplicarse por fotograma a
  `DRAG ** (dt * 60)`, idéntica a 60 Hz e independiente de la tasa de refresco; y **las balas mueren
  al llegar al borde** en vez de reaparecer por el lado opuesto (la nave y las rocas siguen
  envolviendo).
- **Retematización visual** a la paleta de la plataforma: nave y balas en amarillo, asteroides en
  blanco atenuado, power-up en cian, propulsor y partículas en naranja cálido, fondo casi negro para
  que las scanlines del CRT sigan leyéndose por encima.
- **El canvas dibuja solo el juego.** Se elimina de él el `SCORE`, el `NIVEL`, los iconos de vidas y
  el overlay `GAME OVER` del original: eso ya existe en DOM. Única excepción que se queda dentro: el
  contador `3x 4.7s`, porque cambia cada fotograma.

### Pantalla de juego

- **`app/components/GameCanvas.tsx`** — el envoltorio React: monta el canvas a 800×600 de resolución
  interna escalado por CSS en 4:3, carga el motor con `import()` dinámico (nunca en servidor), le
  pasa las órdenes y traduce su instantánea a estado de React. Suyas son también:
  - **Overlay de arranque** "PULSA PARA EMPEZAR", con la tabla de controles que declara el módulo:
    el bucle no corre hasta el primer clic o tecla.
  - **Foco propio** (`tabIndex`) y `preventDefault` de flechas y espacio **solo mientras la partida
    está activa**, para no secuestrar el scroll de la página.
  - **`Esc` pausa y reanuda**, igual que el botón PAUSA.
  - **Pausa automática** al perder el foco de la ventana o al ocultarse la pestaña; al volver sigue
    en pausa hasta que reanudas a mano.
  - **Aviso "requiere teclado"** en dispositivos sin teclado físico.
  - Limpieza completa al desmontar: `cancelAnimationFrame` y todos los listeners fuera (importa con
    el doble montaje de StrictMode).
- **`app/components/GamePlayerScreen.tsx`** — HUD real: `Puntuación`, `Vidas` y `Nivel` salen de la
  instantánea del motor; `PAUSA` pausa de verdad; `FIN` aborta la partida y abre el modal con la
  puntuación real; `SALIR` sigue navegando al detalle. Si el juego **no** está registrado, renderiza
  la maqueta actual sin cambios.
- **Modal de fin**: puntuación real, y el resto **sigue siendo maqueta** — `Jugador` fijo en
  `INVITADO`, input de iniciales sin destino y `GUARDAR PUNTUACIÓN` que solo cambia el texto.
  `JUGAR DE NUEVO` reinicia el motor; no hay reinicio con `ESPACIO`.

### Señalización y documentación

- **Distintivo `JUGABLE`** en `GameCard.tsx` y en `app/games/[id]/page.tsx`, derivado del registro.
- **`app/globals.css`**: portada nueva, marco del canvas, overlays, distintivo y aviso de teclado.
- **`CLAUDE.md`**: sección nueva explicando el runtime de juegos, el registro y cómo se añade el
  siguiente juego.

**Fuera** — cada uno, si llega, en su propia spec:

- **Persistir la puntuación.** Ni tabla, ni RLS, ni migración, ni una sola llamada a Supabase.
  `supabase/migrations/` sigue vacía y esta spec no importa ninguno de los clientes de la spec 04.
- **Autenticación y jugador real.** `AuthForm` sigue siendo maqueta y `Jugador` sigue diciendo
  `INVITADO`.
- **Récord local en `localStorage`.** Nada sobrevive a recargar la página.
- **Tetris y arkanoid.** El registro queda listo para recibirlos, con una sola entrada.
- **Controles táctiles**, cruceta en pantalla o modo pantalla completa.
- **Sonido**: ni disparo, ni explosión, ni música.
- **Tocar el balance o los números del juego.** Portado 1:1; cualquier ajuste va después y con el
  juego delante. La normalización de la fricción por `dt` no cuenta como ajuste: reproduce el
  balance de 60 Hz en cualquier pantalla. La única excepción de mecánica es la de las balas en el
  borde, decidida jugando durante la implementación.
- **Reescalar la física al contenedor.** La resolución interna es fija.
- **Sustituir el ranking inventado** de `seededScores`, ni en el detalle ni en el hall of fame.
  `best` y `plays` de la ficha nueva son valores inventados como los de los otros ocho.
- **Convertir los otros siete juegos** o retirar sus maquetas.
- **Modificar `references/started-games/`.** Es la fuente, se lee y no se edita.
- **Tests.** Sigue sin haber runner configurado; el motor se deja testeable, no testeado.
- **`app/demos/Demo.tsx`**: no se toca.

---

## Modelo de datos

Esta spec no introduce ninguna tabla. Lo que introduce es **el contrato del runtime de juegos**, y
ese es el que hay que respetar porque lo heredan tetris y arkanoid.

### Ficheros

```
app/lib/arcade/
  types.ts        — el contrato (no importa nada de React ni de Next)
  registry.ts     — id del catálogo → import() del motor
  math.ts         — wrap, dist, rand, randInt (compartido entre juegos)
  keyboard.ts     — teclado con attach/detach (compartido entre juegos)
  asteroides/
    index.ts      — metadatos + createEngine: la única puerta pública del juego
    constants.ts  — números y colores (DRAG se documenta como "por fotograma a 60 Hz")
    entities.ts   — Bullet, Asteroid, PowerUp, Ship, Particle
    engine.ts     — estado de partida, update, draw y bucle
```

`math.ts` y `keyboard.ts` salen fuera del juego porque los tres juegos de referencia los necesitan
igual. Todo lo demás es privado de `asteroides/`: nadie importa `engine.ts` ni `entities.ts` desde
fuera de la carpeta.

### `app/lib/arcade/types.ts`

```ts
/** Estado que el motor expone al exterior. El "muerto, esperando reaparecer"
 *  del original es interno: hacia fuera sigue siendo "playing". */
export type ArcadeStatus = "idle" | "playing" | "paused" | "gameover";
/** Lo que el HUD necesita. Solo valores discretos: cambian en eventos del juego
 *  (impacto, muerte, nivel), nunca cada fotograma. */
export type ArcadeSnapshot = {
  score: number;
  lives: number;
  level: number;
  status: ArcadeStatus;
};
export type ArcadeEngineOptions = {
  canvas: HTMLCanvasElement;
  /** Se invoca solo cuando algún campo de la instantánea cambia de valor. */
  onSnapshot: (snapshot: ArcadeSnapshot) => void;
};
/** Un motor ya montado sobre un canvas. Todas las órdenes son idempotentes. */
export type ArcadeEngine = {
  /** Arranca el bucle. De "idle" a "playing". */
  start(): void;
  pause(): void;
  resume(): void;
  /** Aborta la partida: pasa a "gameover" con la puntuación actual. No toca vidas. */
  end(): void;
  /** Nivel 1, puntuación a cero, vidas a 3. */
  restart(): void;
  /** Cancela el rAF y suelta todos los listeners. Se puede llamar dos veces. */
  destroy(): void;
};
/** Cada juego exporta esto por defecto desde su `index.ts`. */
export type ArcadeGameModule = {
  /** Resolución interna del canvas. El CSS la escala manteniendo el aspecto. */
  width: number;
  height: number;
  /** Filas de la ayuda de controles del overlay de arranque: [tecla, acción]. */
  controls: [string, string][];
  createEngine: (options: ArcadeEngineOptions) => ArcadeEngine;
};
```

Dos reglas que el contrato impone y que conviene que estén escritas:

- **`onSnapshot` solo dispara en cambio de valor.** Publicar cada fotograma serían 60 `setState` por
  segundo; por eso el contador `3x 4.7s` se queda dibujado dentro del canvas y no entra en la
  instantánea.
- **El teclado escucha en `window`, no en el canvas.** Si escuchara en el elemento, un `keyup` fuera
  de él dejaría la tecla pegada y la nave girando sola. Al pausar, el motor **limpia el estado de
  teclas**, de modo que al reanudar no quede ninguna pulsada. Quien decide si el juego debe estar
  corriendo es el envoltorio, que pausa al perder el foco.

### `app/lib/arcade/registry.ts`

```ts
/** Única fuente de verdad de "este juego es real". La usan la pantalla de
 *  juego, la tarjeta de la biblioteca y el detalle. */
export function isPlayable(id: string): boolean;
export function getArcadeLoader(id: string): (() => Promise<ArcadeGameModule>) | undefined;
```

Con una sola entrada: `asteroides: () => import("@/app/lib/arcade/asteroides")`. La carga es un
`import()` dinámico **dentro del efecto** de `GameCanvas`, no `next/dynamic`: lo que se carga es un
módulo, no un componente. El motor **nunca se ejecuta en servidor** y **no entra en el chunk inicial
del cliente**: quien no juega no lo descarga. Sí puede aparecer compilado como chunk en el paquete de
servidor, porque `app/games/[id]/page.tsx` (Server Component) importa `isPlayable` de este mismo
fichero; es inofensivo, porque nadie invoca el loader en servidor.

Añadir el siguiente juego = una línea aquí + una carpeta. Nada más.

### La ficha nueva en `app/lib/games.ts`

Primera del array:

```ts
{
  id: "asteroides",
  title: "ASTEROIDES",
  short: "Parte las rocas antes de que te partan a ti.",
  long: "Tu nave deriva sin fricción por un campo de asteroides que no tiene bordes: sal por un lado y vuelves por el otro. Cada roca grande se parte en dos medianas, y cada mediana en dos pequeñas — más rápidas, más pequeñas y más difíciles de acertar. Si la suerte acompaña, caerá un módulo de disparo triple.",
  cat: "SHOOTER",
  cover: "cover-asteroides",
  color: "yellow",
  best: 12800,
  plays: "1.2K",
}
```

`best: 12800` y `plays: "1.2K"` son inventados como los de los otros ocho, pero elegidos
**plausibles para una partida real** (las maquetas van de 18.900 a 184.220, cifras que en este juego
no se alcanzan). No arregla la incoherencia del ranking, la hace menos llamativa.

### `app/lib/types.ts`

Un solo cambio: `CoverClass` gana `| "cover-asteroides"`. Nada más se toca — no hay tipo nuevo de
dominio, porque el estado de la partida vive en `app/lib/arcade/types.ts`, que es runtime, no
catálogo.

### `.cover-asteroides` en `globals.css`

Requisito, no implementación: tiene que ser **distinguible de `.cover-rocas` a tamaño de tarjeta**.
`cover-rocas` son discos grises rellenos con puntos cian y un `▲` amarillo pequeño. La nueva va por
lo contrario: rocas como **anillos huecos** en blanco atenuado sobre un fondo más frío y con
estrellas finas, el `▲` amarillo más grande y escorado, y un destello cian del `3x`. Las clases de
portada son puros gradientes y pseudoelementos, sin imágenes.

---

## Plan de implementación

Cada paso deja el proyecto compilando, y del 1 al 5 cada uno se puede ver en el navegador.

1. **La ficha en el catálogo, antes que el juego.** Entrada `asteroides` en primera posición de
   `GAMES`, `| "cover-asteroides"` en `CoverClass` y la clase de portada en `globals.css`. Al
   terminar, `/games/asteroides` y `/games/asteroides/play` ya responden — con la maqueta, porque
   todavía no hay nada registrado. Se comprueban aquí las cuatro cascadas, aisladas de cualquier
   lógica de juego: 9 tarjetas en la biblioteca, 9 pestañas en el hall of fame con `asteroides` por
   defecto, `asteroides` entre los 6 de la home y la estadística en `9+`.

2. **El contrato y las utilidades compartidas.** `app/lib/arcade/types.ts` (con `controls`),
   `math.ts` y `keyboard.ts`. Nadie los importa todavía; `npm run build` y `npx tsc --noEmit` tienen
   que pasar igual.

3. **El motor, portado 1:1.** `constants.ts`, `entities.ts`, `engine.ts` e `index.ts`. Aquí es donde
   se hace el trabajo de traducción, y son cuatro traducciones a la vez:
   - **De globales a inyección**: el original hace `document.getElementById('canvas')` y deja `ctx`,
     `W`, `H`, `ship`, `score` y compañía como globales del módulo. Cada clase recibe ahora el `ctx`
     y las dimensiones, y el estado de partida vive dentro de la instancia del motor. Dos partidas
     en la misma página no deben poder pisarse.
   - **Quitar del canvas lo que ya está en DOM**: fuera `drawHUD`, `drawLifeIcon` y `drawOverlay`.
     Se queda dentro solo el contador `3x`.
   - **Retematizar**: los colores salen todos de `constants.ts`, ninguno escrito a mano en medio de
     un `draw()`.
   - **Fricción independiente de los fps**: `this.vx *= DRAG` pasa a
     `this.vx *= DRAG ** (dt * 60)` (y lo mismo con `vy`). Es la única línea de física que cambia
     respecto a `game.js`, y lleva un comentario que lo explica.

   Ojo con el estilo del repo: el original va lleno de líneas en blanco y de espacios dentro de los
   paréntesis, y aquí ESLint prohíbe las líneas en blanco (`no-multiple-empty-lines: max 0`). El
   hook de Prettier + ESLint lo arregla al escribir, pero no hay que pelearse con él después.

4. **Registro y primer píxel.** `registry.ts` con la entrada de `asteroides`, y
   `app/components/GameCanvas.tsx` en su versión mínima: `"use client"`, canvas a 800×600 escalado,
   `import()` del motor en el efecto, overlay "PULSA PARA EMPEZAR" con la tabla de controles que
   declara el módulo, y `destroy()` al desmontar. **Al acabar este paso el juego se juega de
   verdad**, aunque el HUD de arriba siga mintiendo.

5. **HUD real.** `GamePlayerScreen.tsx` pasa a decidir por el registro: si el juego está registrado
   renderiza `GameCanvas` y conecta la instantánea a `Puntuación`, `Vidas` y `Nivel`; si no,
   renderiza la maqueta actual **sin un solo cambio de comportamiento**. `PAUSA` llama a
   `pause`/`resume`, `FIN` a `end`, `JUGAR DE NUEVO` a `restart`, y el modal muestra la puntuación
   real. El input de iniciales y `GUARDAR PUNTUACIÓN` se quedan como están.

6. **Teclado, foco y ciclo de vida.** El paso que decide si el juego es usable o irritante:
   - `preventDefault` de flechas y espacio **solo** con la partida en `playing`; con el overlay de
     arranque, en pausa o en el modal, la página vuelve a hacer scroll con normalidad.
   - `Esc` pausa y reanuda.
   - Pausa automática al `blur` de la ventana, al `blur` del canvas y en `visibilitychange`; al
     volver **sigue en pausa**.
   - Limpieza del estado de teclas al pausar: nada pulsado al reanudar.
   - `cancelAnimationFrame` y todos los listeners fuera en el desmontaje, comprobado con el doble
     montaje de StrictMode — si sobrevive un bucle, se ven dos partidas peleándose por el mismo
     canvas.
   - Aviso "requiere teclado" en dispositivos sin teclado físico.

7. **Estilos, con el skill `/frontend-design`.** Marco del canvas en 4:3 dentro del `.crt-screen` (y
   que las scanlines sigan por encima), overlay de arranque y de pausa, tabla de controles, aviso de
   teclado, portada nueva y el distintivo. Es la parte de diseño de la spec y va con el skill, como
   manda `CLAUDE.md`.

8. **Distintivo `JUGABLE`.** En `GameCard.tsx` y en `app/games/[id]/page.tsx`, leyendo `isPlayable`
   del registro. Ocho tarjetas sin distintivo, una con él.

9. **Sesión de juego real.** Verificación manual, jugando: perder las tres vidas, pasar de nivel,
   coger el power-up, pausar con botón y con `Esc`, cambiar de pestaña, pulsar `FIN`, reiniciar
   desde el modal, salir y volver a entrar. Si hay una pantalla de más de 60 Hz a mano, comparar la
   deriva de la nave con la del original abierto en un monitor de 60 Hz. Es el único paso que no se
   puede automatizar y el único que demuestra que la spec está hecha.

10. **`CLAUDE.md`**: sección del runtime de juegos, el contrato, el registro y la receta de "cómo se
    añade el siguiente juego". Más la corrección de la frase de `## What this project is` que hoy
    dice que la pantalla de juego es una maqueta y que no hay juegos reales.

11. **Verificación final**: `npm run lint`, `npm run build`, `npm run format:check` y
    `npx tsc --noEmit`, los cuatro en verde.

---

## Criterios de aceptación

### Compilación y formato

- [ ] `npm run lint` termina sin errores ni warnings.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run format:check` pasa.
- [ ] `npx tsc --noEmit` no da errores.

### Ficheros

- [ ] Existen `app/lib/arcade/types.ts`, `registry.ts`, `math.ts` y `keyboard.ts`.
- [ ] Existen `app/lib/arcade/asteroides/index.ts`, `constants.ts`, `entities.ts` y `engine.ts`.
- [ ] Existe `app/components/GameCanvas.tsx` y empieza por `"use client"`.
- [ ] `references/started-games/` no tiene ni un cambio: `git status references/` sale limpio.

### El contrato

- [ ] `app/lib/arcade/types.ts` no importa nada de `react`, `next` ni `@/app/components`.
- [ ] `grep -rn "from \"@/app/lib/arcade/asteroides/" app --include=*.ts --include=*.tsx` no devuelve
      ninguna línea que apunte a `engine`, `entities` o `constants`: desde fuera de la carpeta solo
      se importa `index`.
- [ ] `app/lib/arcade/asteroides/index.ts` exporta `width`, `height`, `controls` y `createEngine`.
- [ ] `grep -rn "getElementById\|document.querySelector" app/lib/arcade/` no devuelve nada: el motor
      recibe el canvas, no lo busca.
- [ ] El motor no declara ninguna variable de estado de partida a nivel de módulo: `score`, `lives`,
      `level`, `ship`, `asteroids`, `bullets`, `particles` y `powerUps` viven dentro de la instancia.
- [ ] `destroy()` llamado dos veces seguidas no lanza.
- [ ] Añadir un juego nuevo requiere tocar exactamente dos sitios: una línea en `registry.ts` y una
      carpeta nueva. Ni `GameCanvas.tsx` ni `GamePlayerScreen.tsx` mencionan `"asteroides"` —
      `grep -n "asteroides" app/components/*.tsx` no devuelve nada.

### Catálogo

- [ ] `GAMES[0].id === "asteroides"`.
- [ ] `CoverClass` incluye `"cover-asteroides"` y `globals.css` define `.cover-asteroides`.
- [ ] La biblioteca muestra 9 tarjetas con el filtro `TODOS` y `asteroides` aparece bajo `SHOOTER`.
- [ ] El hall of fame muestra 9 pestañas y abre en `ASTEROIDES`.
- [ ] La home muestra `asteroides` entre sus 6 destacados y su estadística dice `9+`.
- [ ] La ficha `rocas` sigue idéntica: `git diff app/lib/games.ts` solo muestra la entrada añadida.
- [ ] `.cover-asteroides` y `.cover-rocas` se distinguen a simple vista en la biblioteca.

### El juego funciona

Todo esto se comprueba jugando en `/games/asteroides/play`:

- [ ] El bucle **no** corre al cargar: hasta el primer clic o tecla, la nave no se mueve y el
      overlay de arranque está visible.
- [ ] El overlay de arranque lista los controles: `←` `→` rotar, `↑` propulsar, `Espacio` disparar.
- [ ] Las flechas rotan y propulsan. El espacio dispara **solo al pulsar**: mantenerlo pulsado
      suelta una única bala, y pulsar muy rápido no supera ~5 disparos/s (enfriamiento de 0.2s).
- [ ] La fricción usa `dt`: en `entities.ts` no hay ningún `*= DRAG` sin exponente, y la nave
      tarda lo mismo en frenarse a 60 Hz que a 120 Hz.
- [ ] La nave sale por un borde y entra por el opuesto. Las rocas también. Las balas **no**: mueren
      al llegar al borde.
- [ ] Una roca grande destruida deja dos medianas; una mediana, dos pequeñas; una pequeña, ninguna.
- [ ] Destruir grande / mediana / pequeña suma 20 / 50 / 100 puntos.
- [ ] Al morir hay explosión de partículas, ~2s de espera y la nave reaparece parpadeando e inmune.
- [ ] Al limpiar todas las rocas sube el nivel y aparecen más rocas que en el anterior.
- [ ] El power-up `3x` aparece (garantizado al quinto impacto del nivel), se recoge al tocarlo,
      dispara tres balas en abanico y su contador se ve dentro del canvas y se agota.
- [ ] A las tres muertes la partida acaba y se abre el modal.

### HUD y controles de la plataforma

- [ ] `Puntuación`, `Vidas` y `Nivel` coinciden en todo momento con lo que pasa en el canvas.
- [ ] `PAUSA` congela el juego y el botón pasa a `REANUDAR`; al reanudar, la nave **no** ha girado ni
      acelerado durante la pausa.
- [ ] `Esc` pausa y reanuda igual que el botón.
- [ ] Cambiar de pestaña o hacer clic fuera del canvas pausa la partida, y al volver **sigue en
      pausa**.
- [ ] `FIN` abre el modal con la puntuación real de la partida en curso, sin descontar vidas.
- [ ] El modal muestra la puntuación real, **no** `game.best` (12.800).
- [ ] `JUGAR DE NUEVO` reinicia en nivel 1 con 3 vidas y puntuación 0.
- [ ] `SALIR` navega a `/games/asteroides`.
- [ ] El canvas dibuja solo el juego: no hay `SCORE`, `NIVEL`, iconos de vidas ni `GAME OVER` dentro
      del canvas.
- [ ] El HUD y el modal no muestran dos puntuaciones distintas en ningún momento.

### Teclado, foco y ciclo de vida

- [ ] Con la partida activa, `↑` y `Espacio` **no** hacen scroll de la página.
- [ ] Con el overlay de arranque, en pausa o con el modal abierto, `↑` y `Espacio` **sí** hacen
      scroll: el juego no secuestra el teclado cuando no está jugándose.
- [ ] Mantener `←` pulsado, pausar, soltar la tecla y reanudar: la nave **no** sigue girando.
- [ ] Con `npm run dev` (StrictMode), la consola no muestra dos bucles a la vez y la nave se mueve a
      velocidad normal, no al doble.
- [ ] Salir a `/games` y volver a entrar arranca una partida limpia, sin restos de la anterior.
- [ ] La consola del navegador queda sin errores ni warnings durante una partida completa.

### Señalización

- [ ] `asteroides` muestra el distintivo `JUGABLE` en su tarjeta y en su detalle.
- [ ] Los otros ocho juegos **no** lo muestran.
- [ ] El distintivo sale del registro: quitar la entrada de `registry.ts` hace desaparecer el
      distintivo y devuelve la maqueta, sin tocar nada más.

### Lo que sigue siendo maqueta

- [ ] `Jugador` dice `INVITADO`.
- [ ] `GUARDAR PUNTUACIÓN` solo cambia el texto a `PUNTUACIÓN GUARDADA`; recargar la página no deja
      rastro.
- [ ] `/games/rocas/play` y los otros siete juegos siguen mostrando la maqueta con su HUD de
      `game.best`, vidas `3` y nivel `03`, exactamente igual que antes.

### Disciplina de alcance

- [ ] `grep -rn "supabase" app/lib/arcade/ app/components/GameCanvas.tsx app/components/GamePlayerScreen.tsx`
      no devuelve nada.
- [ ] `supabase/migrations/` sigue vacía salvo el `.gitkeep`.
- [ ] `git diff app/lib/supabase/ proxy.ts` sale limpio.
- [ ] `grep -rn "localStorage\|sessionStorage" app/lib/arcade/ app/components/GameCanvas.tsx` no
      devuelve nada.
- [ ] `grep -rn "Audio\|AudioContext\|\.play()" app/lib/arcade/` no devuelve nada.
- [ ] `git diff app/lib/scores.ts app/lib/home.ts app/lib/about.ts app/actions/ app/components/AuthForm.tsx`
      sale limpio.
- [ ] Los números del juego en `constants.ts` coinciden uno a uno con los de
      `references/started-games/02-asteroids/game.js`. `DRAG` conserva su valor `0.987`; lo que
      cambia es cómo se aplica, no el número.

### Regresión de las specs 01–04

- [ ] Responden 200: `/`, `/games`, `/games/asteroides`, `/games/asteroides/play`,
      `/games/rocas/play`, `/hall-of-fame`, `/about` y `/login`.
- [ ] La biblioteca sigue filtrando por categoría.
- [ ] El formulario de `/about` sigue enviando por Resend.
- [ ] `AuthForm` sigue navegando a `/games` sin validar.
- [ ] `/no-existe` sigue mostrando `app/not-found.tsx`.

### CLAUDE.md

- [ ] Tiene una sección del runtime de juegos que explica el contrato, el registro y cómo se añade
      el siguiente juego.
- [ ] Ya no queda ninguna frase que diga que no hay juegos reales o que la pantalla de juego es una
      maqueta, sin matizar que `asteroides` sí lo es.

---

## Decisiones

### Alcance

- **Un juego, cero persistencia.** El juego real y la puntuación guardada son dos specs, no una.
  Guardar exige tabla, RLS e identidad del jugador — tres dominios distintos —, y mezclarlo aquí
  habría convertido "el primer juego" en "el primer juego, la primera tabla y el primer usuario".
  Coste asumido y visible: **la puntuación se pierde al recargar**, y el modal de fin sigue siendo
  teatro.
- **Mecánica portada 1:1, sin retocar un número.** Retematizar colores es barato y reversible; tocar
  el balance no, y sin poder medir "se siente bien" cualquier ajuste es a ciegas. Los números se
  cambian cuando alguien haya jugado de verdad, no antes.
- **Fricción normalizada por `dt`, única excepción al 1:1.** El original aplica `DRAG = 0.987` por
  fotograma: a 60 Hz la nave conserva el 46% de su velocidad por segundo, a 120 Hz solo el 21%.
  Portarlo literal habría hecho que el juego se sintiera distinto según el monitor. `DRAG ** (dt * 60)`
  da exactamente lo mismo a 60 Hz, así que conserva el balance en vez de cambiarlo. Descartado
  portarlo tal cual y dejarlo como riesgo: es el tipo de bug que nadie reporta porque parece "así es
  el juego".
- **Sin autodisparo.** El original dispara solo al pulsar (`justPressed`) y una pulsación durante el
  enfriamiento se pierde. Se conserva: es parte de cómo se juega Asteroids, y el autodisparo cambia
  el ritmo de toda la partida. Descartado añadirlo en esta spec por la misma regla del 1:1.
- **Las balas mueren en el borde.** Decidido jugando, en el paso 9, y es la única excepción de
  mecánica al port 1:1. En el original una bala recorre ~572px (520 px/s × 1.1s) en un canvas de
  800×600, así que cruza el borde y sigue un buen tramo por el otro lado; al jugar se leía como un
  rebote raro más que como una táctica. Coste aceptado: desaparece el truco clásico de disparar a
  través del borde. Descartado acortar la vida de la bala (cruzaría igual, solo menos) y dejarlo
  para una spec de balance (el usuario prefirió resolverlo aquí).
- **El power-up `3x` entra**, aunque su README no lo mencione. Está implementado y probado en
  `game.js`; quitarlo era trabajo extra para entregar menos juego. Se anota en la spec porque quien
  lea solo el README del original pensará que sobra.
- **Sonido fuera.** Ni disparo, ni explosión, ni música — y por tanto tampoco control de volumen, ni
  preferencia persistida, ni política de autoplay que resolver. Es la decisión que más alcance
  ahorra de toda la spec.
- **Sin controles táctiles.** El juego pide rotar y propulsar de forma continua: una cruceta en
  pantalla no es "añadir botones", es rediseñar el control. En vez de entregarlo a medias, se avisa
  de que hace falta teclado.

### Catálogo

- **Juego independiente `asteroides`, y `rocas` se queda como estaba.** Decidido a mitad de la fase
  de preguntas, corrigiendo la decisión anterior de reutilizar `rocas`. El razonamiento que manda:
  cada juego es una entidad propia y el parecido entre los dos es casualidad, no motivo para
  fusionarlos. Coste aceptado: la biblioteca tiene dos juegos de asteroides, uno jugable y otro no —
  y ese es justamente el trabajo que hará la spec que convierta o retire las maquetas.
- **Primera posición en `GAMES`.** El único juego que se juega es el que se ve primero. Se aceptan a
  propósito las dos cascadas: entra en los 6 destacados de la home y pasa a ser la pestaña por
  defecto del hall of fame.
- **Portada propia `.cover-asteroides`.** Reutilizar `.cover-rocas` habría dejado dos tarjetas
  idénticas en la misma rejilla: el peor sitio posible para ahorrarse 20 líneas de CSS.
- **`best` y `plays` inventados, pero plausibles.** Con `best: 0` la tarjeta anuncia `RÉCORD 0` y
  parece rota; con 41.200 como su vecina, anuncia una marca que en este juego no se alcanza. 12.800
  es mentira igual, pero mentira coherente con lo que el jugador va a ver.
- **El ranking falso se queda.** `seededScores` seguirá firmando 200.000 puntos a nombre de `PX_KAI`
  en un juego donde tú harás 4.000 y no se guardará nada. Descartado mostrar "aún sin puntuaciones"
  en los juegos registrados: es media spec de persistencia disfrazada y deja la pantalla más pobre
  sin dar nada real. Queda anotado como incoherencia conocida, junto a la de `game.best` que
  arrastramos desde la spec 02.

### Arquitectura

- **Motor en TypeScript puro, envoltorio React fino.** Descartado meter la lógica en un `useEffect`
  con refs: funciona para un juego y se vuelve inmanejable con tres, además de atar el motor a React
  sin ninguna necesidad. Descartado también cargar `game.js` con `<Script>` — usa globales y busca
  el canvas por `id`, así que dos instancias se pisarían y no hay tipos.
- **`app/lib/arcade/`, no `app/games/asteroides/`.** Crear `app/games/asteroides/` convierte
  `asteroides` en segmento estático y **rompe la resolución de `app/games/[id]/page.tsx`**: el
  detalle del juego dejaría de existir. Y descartado `app/lib/games/` porque ya existe
  `app/lib/games.ts`: fichero y carpeta con el mismo nombre hacen ambiguo `@/app/lib/games`.
  `arcade` = runtime; `games.ts` = catálogo.
- **`math.ts` y `keyboard.ts` compartidos desde el primer juego.** Los tres juegos de referencia
  necesitan lo mismo (envolver coordenadas, aleatorios, teclas mantenidas y pulsaciones de un
  fotograma). Sacarlos ahora cuesta nada; sacarlos cuando ya estén duplicados tres veces cuesta una
  refactorización.
- **Registro con `import()` dinámico, no `next/dynamic`.** Lo que se carga es un módulo, no un
  componente: `next/dynamic` sobra. El `import()` dentro del efecto mantiene el motor fuera del
  chunk inicial del cliente y garantiza que nunca se ejecuta en servidor. Puede compilarse como chunk
  de servidor, porque el detalle (Server Component) importa `isPlayable` del mismo fichero; se
  acepta. Descartado separar los ids de los loaders en dos ficheros: rompería la regla de "una línea
  para añadir un juego" a cambio de un chunk que nunca se carga.
- **El registro es la única fuente de verdad de "es jugable".** Descartado un campo `playable: true`
  en `games.ts`: sería un dato que se puede desincronizar del hecho. Con el registro, tetris y
  arkanoid heredan el distintivo y la pantalla real con la línea que los registra, y ninguno de los
  dos componentes menciona un id de juego.

### El contrato

- **`onSnapshot` solo dispara en cambio de valor.** Publicar el estado cada fotograma son 60
  `setState` por segundo y un árbol de React repintándose contra un canvas que ya se repinta solo.
- **El contador `3x 4.7s` se queda dentro del canvas.** Es el único dato que cambia continuamente;
  sacarlo al HUD obligaba a romper la regla anterior por un adorno.
- **Fuera del canvas todo lo demás del HUD original.** Tener `SCORE` dibujado dentro y `Puntuación`
  en DOM es duplicar la misma cifra en dos sitios con dos tipografías: la primera vez que se
  desincronicen, el bug es de los que se ven en captura de pantalla.
- **El estado interno `dead` (los 2s de espera) no se expone.** Hacia fuera sigue siendo `playing`.
  El HUD no tiene nada que hacer con esa distinción y exponerla invitaba a que alguien pintara un
  estado más.
- **El teclado escucha en `window`, no en el canvas.** Escuchando en el elemento, un `keyup` fuera de
  él deja la tecla pegada y la nave girando sola para siempre. Quien decide si el juego debe correr
  es el envoltorio, que pausa al perder el foco; y al pausar se limpian las teclas, para que
  reanudar no herede un giro.
- **Todas las órdenes idempotentes y `destroy()` llamable dos veces.** Es lo que hace que StrictMode
  y las navegaciones rápidas no dejen bucles huérfanos.

### Integración con la pantalla

- **`GamePlayerScreen` decide por el registro y conserva la rama de maqueta intacta.** Los otros
  ocho juegos no deben notar esta spec. Descartado reescribir la pantalla solo para el caso real:
  habría convertido una spec de juego en una spec de rediseño de los ocho.
- **`PAUSA` y `FIN` deshabilitados antes de empezar.** Decidido durante la implementación (paso 5):
  con el overlay de arranque no hay partida, y el contrato dice que `end()` aborta una partida. Un
  botón que no hace nada parece roto; deshabilitarlo lo dice. Descartado que `FIN` abra el modal con
  0 desde el arranque: cambiaba el contrato de `end()` por un caso sin valor.
- **`FIN` aborta sin descontar vidas.** Es un "me voy, enséñame lo que llevo", no una muerte.
  Descontar vidas convertía un botón de salida en un castigo.
- **El reinicio manda solo desde el modal.** El original reinicia con `ESPACIO`, pero con un modal en
  DOM eso obliga a que el modal no bloquee el teclado y a que el espacio no dispare a ciegas
  mientras se lee la puntuación. Un botón es menos ambiguo.
- **Resolución interna fija 800×600 escalada en 4:3.** Toda la física del original está en píxeles de
  ese espacio: reescalarla al contenedor significa tocar velocidades, radios y la zona segura, es
  decir, tocar el balance. Coste aceptado: en móvil se ve pequeño — y en móvil, sin teclado, tampoco
  se juega.

### Entrada y arranque

- **Overlay "PULSA PARA EMPEZAR", sin arranque automático.** Dos razones, y la segunda pesa más: una
  partida que empieza sola mientras aún no miras te mata gratis, y sin un gesto previo no hay foco,
  así que el `preventDefault` tendría que ser global y secuestraría el teclado de toda la página.
- **`preventDefault` solo con la partida en `playing`.** Es la línea que separa "el juego captura las
  teclas" de "la web no responde al teclado". En pausa, en el arranque y con el modal abierto, la
  página vuelve a ser una página.
- **`Esc` para pausar**, además del botón. Es la tecla que el jugador ya va a pulsar; y al no ser una
  tecla del juego, no colisiona con nada.
- **Pausa automática al perder el foco, y al volver sigue en pausa.** El original capa el `dt` a 50ms
  precisamente porque volver de una pestaña oculta da un salto enorme; capar evita la explosión de
  física, pero no evita volver y encontrarte muerto. Reanudar es una decisión del jugador.
- **Los controles los declara el módulo del juego** (`controls`) y los pinta el envoltorio. Añadido
  durante la revisión del modelo de datos: hoy la plataforma no documenta las teclas en ninguna
  parte, y el overlay de arranque es el único sitio donde el jugador las mira. Así tetris y arkanoid
  no tocan `GameCanvas.tsx`.

### Visual

- **Retematizado a la paleta, no wireframe blanco.** Dentro de un marco CRT con scanlines y una
  plataforma de neón, el blanco puro del original se lee como un juego pegado con celo. Nave y balas
  en el amarillo de la ficha, power-up en cian, propulsor y partículas en el naranja cálido que ya
  traía.
- **Asteroides en blanco atenuado, no en amarillo.** Son el objeto que hay que leer rápido y en
  cantidad; que compartan color con la nave y con las balas es exactamente lo que no se quiere en el
  fotograma en que importa.
- **Fondo del canvas casi negro, no transparente ni negro puro.** Casi negro para que las scanlines
  del `.crt-screen` sigan viéndose por encima del juego, que es lo que lo integra en el mueble.
- **Los colores viven en `constants.ts`.** Ninguno escrito a mano dentro de un `draw()`: retematizar
  el siguiente juego es editar un fichero.
- **El diseño va con el skill `/frontend-design`**, como manda `CLAUDE.md`, y no a ojo.

### Verificación

- **La prueba de fuego es una sesión de juego a mano.** No hay runner de tests (sigue fuera desde la
  spec 01) y ninguna comprobación automática dice si el juego se siente bien o si el HUD miente. Por
  eso el paso 9 del plan es jugar, con lista cerrada de lo que hay que provocar: morir tres veces,
  subir de nivel, coger el power-up, pausar de las dos formas, cambiar de pestaña, pulsar `FIN` y
  reiniciar.
- **El motor se deja testeable, no testeado.** TypeScript puro, sin DOM más allá del canvas que
  recibe y sin globales: el día que haya runner, se prueba sin navegador. Escribir tests hoy exigía
  elegir e instalar el runner, que es una decisión de otra spec.
- **Varios criterios de aceptación son `grep`.** Los de disciplina de alcance (nada de Supabase, nada
  de `localStorage`, nada de audio, ningún id de juego en los componentes) son los que se rompen sin
  darse cuenta en la siguiente spec, y un `grep` los detecta en un segundo.

---

## Riesgos

- **Los botones del HUD se pelean con la pausa automática.** Es el riesgo más probable de toda la
  spec: hacer clic en `PAUSA` mueve el foco al botón, eso dispara el `blur` del canvas, y al pulsar
  `REANUDAR` el foco sigue en el botón — si el `blur` del canvas pausa, el juego se vuelve a pausar
  solo y el botón parece roto. Mitigación: al reanudar (botón o `Esc`), el envoltorio **devuelve el
  foco al canvas** explícitamente, y el `blur` del canvas no pausa si el foco se ha ido a un control
  de la propia pantalla de juego. Hay que provocarlo a mano en el paso 9; no hay forma de que salte
  en `build`.

- **El primer fotograma tras reanudar puede llegar con un `dt` enorme.** El `requestAnimationFrame`
  no corre en pestaña oculta, así que al volver la marca de tiempo ha saltado minutos. El capado a
  50ms del original lo amortigua, pero no arregla el caso: lo correcto es **reiniciar la referencia
  de tiempo al reanudar**, igual que hace `lastTime = null` en el arranque. Si no, se pierde una vida
  al volver de otra pestaña sin haber tocado nada.

- **Dos bucles a la vez por el doble montaje de StrictMode.** Se manifiesta como una nave que va al
  doble de velocidad, y en producción no pasa — lo que lo hace fácil de descartar como "cosa del
  dev". Mitigación: `destroy()` idempotente que cancela el `rAF` y suelta todos los listeners, y un
  criterio de aceptación específico.

- **El canvas se ve borroso en pantallas HiDPI, y arreglarlo mal rompe la física.** 800×600 lógicos
  en una pantalla a 2x se escalan y se emborronan; la solución es dimensionar el búfer por
  `devicePixelRatio` y aplicar `ctx.scale(dpr, dpr)` **una sola vez**, dejando las coordenadas del
  juego en 800×600. Si el escalado se aplica dos veces o se mezcla con el escalado CSS, el juego se
  sale de la pantalla o queda en un cuarto de ella.

- **Las scanlines del CRT pueden acabar debajo del canvas.** `.crt-screen` pinta sus efectos con
  `::before` y `::after`, y hoy los aplica sobre un `div`. Un `<canvas>` puede apilarse distinto y
  dejar el juego encima de los efectos — se pierde la integración con el mueble — o al contrario, con
  los efectos tan por encima que el juego se lea mal. Mitigación: revisar el apilado en el paso 7,
  con el skill de diseño, y no darlo por hecho.

- **El `preventDefault` puede secuestrar el teclado de la página.** Si la condición "solo en
  `playing`" se escapa por algún camino —el modal abierto, el juego destruido, un `blur` no
  gestionado—, la página se queda sin scroll por teclado y sin que nada lo explique. Es un fallo de
  accesibilidad, no solo de comodidad. Mitigación: los dos criterios de aceptación complementarios
  (con partida activa no hace scroll; en pausa, arranque y modal sí).

- **La traducción de globales a estado de instancia puede meter bugs silenciosos.** El original apoya
  cosas en el orden de sus globales y en el consumo de `justPressed` al leerlo; al mover todo dentro
  de la instancia es fácil romper un detalle que no da error, solo se siente raro (la cadencia, el
  parpadeo de invencibilidad, el reparto de fragmentos). El caso más fino es `justPressed`: en el
  original se consume **al leerlo**, no al final del fotograma, y solo se lee con la nave viva. Si
  `keyboard.ts` lo limpia por fotograma, cambia la sensación del disparo. Mitigación: portar
  literalmente antes de limpiar, y tener el original abierto en otra pestaña durante el paso 9 para
  comparar.

- **La fricción normalizada puede aplicarse mal.** Si `DRAG ** (dt * 60)` se aplica con `dt` en
  milisegundos en vez de segundos, o se aplica dos veces (en `update` y en el bucle), la nave se
  frena en seco o no se frena nunca, y no da ningún error. Mitigación: criterio de aceptación
  específico, y comparar la deriva con el original a 60 Hz en el paso 9, donde ambas versiones
  deben comportarse igual.

- **El hook de Prettier + ESLint reescribe el fichero portado** (líneas en blanco prohibidas,
  espacios dentro de paréntesis), así que el diff contra `game.js` deja de ser legible casi de
  inmediato. Mitigación: comparar **comportamiento y constantes**, no texto; el criterio de
  aceptación pide que los números coincidan uno a uno, no que el fichero se parezca.

- **60 fps compitiendo con los efectos CSS de la plataforma.** El marco CRT lleva scanlines, brillos
  y desenfoques; en un portátil modesto el juego puede ir a tirones sin que la culpa sea del motor.
  Mitigación: medirlo en el paso 9. Si baja de 60, el sospechoso son los efectos del marco, no el
  bucle: se rebajan los efectos antes de tocar el juego.

- **La detección de "no hay teclado" es heurística y falla.** `pointer: coarse` o `any-hover: none`
  marcan como táctiles portátiles con pantalla táctil. Mitigación: el aviso **no bloquea nada** — si
  sale de más, el juego se sigue pudiendo jugar con el teclado y el aviso solo estorba.

- **Poner `asteroides` primero mueve tres pantallas a la vez.** Home, hall of fame y biblioteca
  cambian sin que se haya tocado su código, porque los tres derivan de `GAMES`. Si algo en `home.ts`
  o en el hall of fame asumía un juego concreto en primera posición, se ve raro sin dar error.
  Mitigación: el paso 1 del plan existe precisamente para comprobar las cuatro cascadas **antes** de
  que haya una línea de motor con la que confundir la causa.

- **Dos juegos de asteroides en la biblioteca, uno real y otro maqueta.** Es consecuencia aceptada de
  hacerlos independientes, pero un visitante verá `ASTEROIDES` y `ROCAS` con descripciones casi
  iguales y solo uno jugable. El distintivo `JUGABLE` lo mitiga a medias; la solución de verdad es la
  spec que convierta o retire las maquetas.

- **Una puntuación real que no se guarda, al lado de un ranking inventado que sí se muestra.**
  Alguien hará 4.300 puntos, pulsará `GUARDAR PUNTUACIÓN`, verá `PUNTUACIÓN GUARDADA`, recargará y no
  encontrará nada — y en la misma pantalla habrá un top-12 con marcas de 200.000. Riesgo asumido
  explícitamente en las decisiones; es el primer trabajo de la spec de persistencia.

---

## Lo que **no** entra en esta spec

- Persistir puntuaciones: ninguna tabla, ninguna política RLS, ninguna migración, ninguna llamada a
  Supabase.
- Autenticación, `profiles`, sesión y jugador real. `AuthForm` sigue siendo maqueta y `Jugador` dice
  `INVITADO`.
- Récord local en `localStorage` o cualquier otra persistencia de navegador.
- Tetris y arkanoid: el registro los espera con una línea, pero no entran aquí.
- Controles táctiles, cruceta en pantalla y modo pantalla completa.
- Sonido, volumen y música.
- Cambiar el balance o cualquier número del juego original.
- Reescalar la física al tamaño del contenedor.
- Sustituir el ranking inventado de `seededScores`, ni en el detalle ni en el hall of fame.
- Convertir los otros siete juegos o retirar sus maquetas.
- Modificar `references/started-games/`.
- Tests y runner de tests.
- La incoherencia entre `game.best` y `seededScores`, arrastrada desde la spec 02.

Cada uno de ellos, si llega, va en su propia spec.
