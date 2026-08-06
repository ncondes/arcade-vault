# SPEC 02 — Pantalla de inicio (landing)

> **Estado:** Implementada
> **Depende de:** 01-mvp-pantallas-visuales (implementada)
> **Fecha:** 2026-08-02
> **Objetivo:** Portar la landing de `references/templates/home-about/home.jsx` a la raíz `/`
> y mover la biblioteca a `/games`, sin implementar la pantalla "Acerca de" ni ninguna
> lógica de negocio nueva.

---

## Alcance

**Dentro:**

- **La landing en `/`**, con las siete secciones de `home.jsx` en orden:
  1. Hero: eyebrow, título de tres líneas, subtítulo, dos CTA e indicador de scroll.
  2. `// 01` ¿POR QUÉ ARCADE VAULT? — cuatro tarjetas con icono SVG pixel.
  3. `// 02` JUEGOS DISPONIBLES AHORA — carril de 6 `MiniCard` + botón a la biblioteca.
  4. Banda de estadísticas — tres bloques.
  5. `// 03` ACTIVIDAD EN VIVO — ticker de últimas puntuaciones + top 5 del día.
  6. `// 04` PRECIOS — tarjeta de plan único + tres preguntas frecuentes.
  7. CTA final.
- **Ocho siluetas SVG flotantes** decorativas en el hero (`aria-hidden`).
- **La biblioteca se muda a `/games`**, con su hero y sus filtros intactos.
  `app/page.tsx` pasa a ser la landing; `GameLibrary` no cambia por dentro.
- **Reescritura de los cinco `href="/"`** que hoy significan "biblioteca" →
  `/games`: salón, login (invitado), 404, detalle, modal de fin de partida, y el
  `router.push("/")` de `AuthForm`.
- **Enlace "Inicio" en el nav** (escritorio y panel móvil), primero de la lista.
  El estado `active` de "Biblioteca" pasa a depender de `/games`, no de `/`.
- **Datos mock tipados** en `app/lib/home.ts`: features, stats, actividad
  reciente, top jugadores y FAQ, con sus tipos en `app/lib/types.ts`.
- **CSS**: se anexan a `globals.css` las secciones HOME, ACTIVITY y PRICING de
  `references/templates/home-about/styles.css`, reformateadas al estilo del
  fichero. Se generaliza el selector `.blink`.
- **`/login?tab=registro`**: el login lee `searchParams` y abre en la pestaña
  CREAR CUENTA cuando se llega desde los CTA del home.
- **Fallback `<noscript>`** para que las secciones `.reveal` sean visibles sin JS.

**Fuera de alcance (para futuras specs):**

- **La pantalla "Acerca de"** (`about.jsx`), su ruta `/about`, su enlace en el nav
  y los bloques CSS ABOUT y GAMEPAD. Es la otra mitad de la carpeta de referencia
  y va en su propia spec.
- **Datos reales**: actividad, top jugadores y estadísticas son literales
  estáticos. No hay backend, ni fetch, ni revalidación.
- **Ticker en vivo**: "hace 2 min" son cadenas fijas. Sin `setInterval`, sin
  `Date`, sin filas que entren o salgan solas.
- **Cobros**: la sección PRECIOS es informativa. No hay pasarela, ni plan de pago,
  ni nada que cobrar — el plan único es $0.
- **Todo lo que la spec 01 ya dejó fuera** y sigue fuera: juego real,
  autenticación, concepto de usuario, persistencia y tests. Esta spec no los toca.
- **Redirección de compatibilidad** desde alguna URL antigua: `/` no desaparece,
  cambia de contenido, así que no hay nada que redirigir.

---

## Modelo de datos

Todo son literales estáticos. Nada se persiste, nada se pide a un servidor.
Los tipos van en `app/lib/types.ts` y los datos en `app/lib/home.ts`.

### Tipos nuevos en `app/lib/types.ts`

```ts
export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export type Feature = {
  icon: FeatureIconKind;
  title: string;       // "JUEGOS CLÁSICOS"
  desc: string;
  accent: Accent;      // reutiliza el Accent de la spec 01
};

export type HomeStat = {
  value: string;       // "8+", "MILES", "GLOBAL" — no es un número
  unit: string;        // "JUEGOS"
  note: string;        // "Y CONTANDO"
};

export type RecentScore = {
  player: string;      // "NEONFOX"
  gameId: string;      // "caida" — el título sale de GAMES, no se duplica
  score: number;
  ago: string;         // "hace 2 min", cadena fija
  accent: Accent;
};

export type TopPlayer = {
  player: string;
  score: number;       // el rango (#01..#05) es el índice + 1
};

export type FaqItem = { q: string; a: string };
```

### `app/lib/home.ts`

Exporta cinco constantes:

- `FEATURES: Feature[]` — 4 entradas (cyan, yellow, magenta, green).
- `HOME_STATS: HomeStat[]` — 3 entradas. La primera se construye como
  `` `${GAMES.length}+` ``, así que el contador nunca contradice a la biblioteca.
- `RECENT_SCORES: RecentScore[]` — 7 entradas con `gameId`, no con el nombre suelto.
- `TOP_PLAYERS: TopPlayer[]` — 5 entradas, ya ordenadas de mayor a menor.
- `FAQ: FaqItem[]` — 3 entradas.

### Reglas de coherencia

- **El rango y la barra del top se derivan del índice**, no se guardan:
  `` `#${String(i + 1).padStart(2, "0")}` `` y `width: ${100 - i * 16}%`.
  Una lista ordenada no necesita llevar su propio número de orden encima.
- **Los nombres de juego del ticker salen de `getGame(row.gameId)!.title`**, en
  mayúsculas como el resto de la aplicación. El mockup los escribía a mano y en
  minúscula ("Caída", "Bloque Buster"); esa copia manual es justo lo que se puede
  desincronizar.
- **Los alias de jugador ya existen** en `PLAYERS` de `app/lib/scores.ts`
  (NEONFOX, PX_KAI, Z3R0COOL, VAULT_07, GLITCHA, M00NRYU…). No se inventan
  jugadores nuevos: los del ticker y el top salen de ese mismo repertorio.
- **Todas las puntuaciones se formatean con `toLocaleString("es-ES")`**, igual
  que en la spec 01.
- **`app/lib/home.ts` importa de `games.ts`**, no al revés. La dependencia va en
  un solo sentido.

### Cambios de contenido respecto al mockup

Tres textos de `home.jsx` no se portan literales, porque contradicen datos que la
propia aplicación muestra a un clic de distancia:

| Mockup | Esta spec | Motivo |
| --- | --- | --- |
| `"12+"` JUEGOS | `` `${GAMES.length}+` `` → "8+" | El catálogo tiene 8 juegos. |
| "Arkanoid, Tetris, Snake y muchos más." | "Bloque Buster, Caída, Serpentina y muchos más." | Son marcas ajenas que el sitio no ofrece; el catálogo usa nombres propios. |
| "LADDER BOARDS" | "SALÓN DE LA FAMA" | Único título en inglés de una interfaz en español, y nombra con otra palabra una sección que el nav ya llama así. |

---

## Plan de implementación

Siete pasos en orden. Cada uno deja el proyecto compilando y las cinco pantallas
de la spec 01 navegables.

1. **Estilos.** Anexar a `app/globals.css`, dentro de la misma capa donde vive el
   resto, tres bloques de `references/templates/home-about/styles.css`:
   HOME (líneas 930–1069), ACTIVITY (1621–1671) y PRICING (1672–1725),
   reformateados al estilo multilínea del fichero.
   Generalizar `.av-hero .sub .blink` → `.blink`.
   _Verificación:_ `npm run build` pasa y las cinco pantallas existentes se ven
   igual que antes (el CSS nuevo no lo usa todavía ningún componente).

2. **Datos y tipos.** Añadir los cinco tipos a `app/lib/types.ts` y crear
   `app/lib/home.ts` con `FEATURES`, `HOME_STATS`, `RECENT_SCORES`, `TOP_PLAYERS`
   y `FAQ`. Aplicar los tres cambios de contenido de la tabla anterior.
   _Verificación:_ `npx tsc --noEmit` sin errores.

3. **Componentes auxiliares.** Cuatro ficheros en `app/components/`:
   - `Reveal.tsx` — Client Component. Envuelve `children` en un `<section>` con
     clase `reveal` y monta el `IntersectionObserver` (`threshold: 0.12`,
     `unobserve` al entrar, `disconnect` al desmontar). Acepta `className`.
   - `FloatingSilhouettes.tsx` — Server Component. Las ocho siluetas SVG del
     hero, `aria-hidden="true"`.
   - `FeatureIcon.tsx` — Server Component. Los cuatro iconos SVG, tipado con
     `FeatureIconKind` para que el `switch` sea exhaustivo (sin rama `null`).
   - `MiniCard.tsx` — Server Component. `` <Link href={`/games/${game.id}`}> `` con
     el markup de `.mini-card`.
   _Verificación:_ `npx tsc --noEmit` y `npm run lint` sin errores. Ningún
   componente se usa aún.

4. **Mudanza de la biblioteca a `/games`.** Crear `app/games/page.tsx` con
   `metadata.title = "Biblioteca"` renderizando `<GameLibrary />`. Repuntar a
   `/games` los seis destinos que hoy apuntan a `/`:
   `HallOfFameBoard.tsx:98`, `AuthForm.tsx:19` (`router.push`), `AuthForm.tsx:93`,
   `not-found.tsx:35`, `GamePlayerScreen.tsx:132` y `app/games/[id]/page.tsx:78`.
   En `Nav.tsx`, "Biblioteca" pasa a `href="/games"` y su estado activo a
   `pathname.startsWith("/games")`.
   _Verificación:_ `/games` lista los 8 juegos; los seis botones llevan a
   `/games`; estando en `/games/caida` el enlace "Biblioteca" tiene clase `active`.
   `app/page.tsx` sigue mostrando la biblioteca — es el único paso en que `/` y
   `/games` renderizan lo mismo, y el paso 5 lo deshace.

5. **La landing.** Reescribir `app/page.tsx` como Server Component con
   `metadata.title = "Inicio"` y las siete secciones en el orden del mockup: hero,
   `// 01` features, `// 02` carril de 6 `MiniCard`, banda de stats, `// 03`
   actividad, `// 04` precios y CTA final. Las secciones 2 a 7 van envueltas en
   `<Reveal>`. Incluir el `<noscript>` con
   `.reveal { opacity: 1; transform: none; }`. En `Nav.tsx`, añadir "Inicio"
   (`href="/"`, activo solo con `pathname === "/"`) como primer enlace, en
   escritorio y en el panel móvil.
   _Verificación:_ `/` muestra la landing completa; el nav marca "Inicio" en `/`
   y "Biblioteca" en `/games`; con JavaScript desactivado en el navegador, las
   siete secciones siguen visibles.

6. **Pestaña de registro.** `app/login/page.tsx` pasa a leer
   `const { tab } = await searchParams` y le pasa a `AuthForm` una prop
   `initialTab: Tab` (`"up"` si `tab === "registro"`, `"in"` en cualquier otro
   caso). `AuthForm` la usa como valor inicial de su `useState`. Los CTA
   "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" del home apuntan a
   `/login?tab=registro`.
   _Verificación:_ `/login?tab=registro` abre en CREAR CUENTA con el campo de
   correo visible; `/login` y `/login?tab=cualquier-cosa` abren en INICIAR SESIÓN.

7. **Verificación final.** Recorrer la lista de criterios de aceptación completa,
   incluidas las cinco pantallas de la spec 01, que esta spec ha tocado.

---

## Criterios de aceptación

### Compilación

- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta ningún problema.
- [ ] `npm run build` termina sin errores y lista 6 rutas más la 404:
      `/`, `/games`, `/games/[id]`, `/games/[id]/play`, `/login`, `/hall-of-fame`.
- [ ] `grep -rn 'href="/"' app/` solo devuelve el logo del nav y el enlace "Inicio".
- [ ] `grep -rn "localStorage\|document.cookie\|fetch(\|setInterval" app/` no
      devuelve nada.
- [ ] Ninguna ruta emite advertencias de hidratación en la consola.
- [ ] `"use client"` aparece exactamente en 7 componentes: los 6 de la spec 01
      más `Reveal.tsx`.

### Landing (`/`)

- [ ] El hero muestra las tres líneas "EL ARCADE" / "CLÁSICO ESTÁ" / "DE VUELTA",
      la segunda en cian y la tercera en magenta.
- [ ] El `_` del eyebrow "▸ INSERTA UNA MONEDA" parpadea.
- [ ] Hay 8 siluetas SVG flotantes y todas están dentro de un contenedor
      `aria-hidden="true"`.
- [ ] La sección `// 01` muestra 4 tarjetas, cada una con su icono SVG, en el
      orden cian · amarillo · magenta · verde.
- [ ] La tarjeta de la izquierda dice "JUEGOS CLÁSICOS" y su texto nombra juegos
      del catálogo, no "Arkanoid, Tetris, Snake".
- [ ] La tercera tarjeta se titula "SALÓN DE LA FAMA", no "LADDER BOARDS".
- [ ] La sección `// 02` muestra exactamente 6 `mini-card`, las 6 primeras de
      `GAMES`, y pulsar una lleva a `/games/<id>`.
- [ ] "VER TODOS LOS JUEGOS →" lleva a `/games`.
- [ ] La banda de stats muestra 3 bloques y el primero dice "8+" sobre "JUEGOS".
- [ ] La sección `// 03` muestra 7 filas de actividad; la de CAÍDA muestra
      "+184.220" con punto de millar y el nombre en mayúsculas.
- [ ] Los 7 nombres de juego del ticker coinciden carácter a carácter con el
      `title` del juego correspondiente en `app/lib/games.ts`.
- [ ] "TOP JUGADORES · HOY" muestra 5 filas, numeradas #01 a #05, y las tres
      primeras llevan las clases `top1`, `top2` y `top3`.
- [ ] "VER SALÓN →" lleva a `/hall-of-fame`.
- [ ] La sección `// 04` muestra la tarjeta de plan con "$0", 6 items en la lista
      y 3 preguntas frecuentes al lado.
- [ ] El CTA final "INSERTAR MONEDA →" lleva a `/games`.
- [ ] El título del navegador es "Inicio · Arcade Vault".

### Reveal

- [ ] Al cargar `/` sin haber hecho scroll, las secciones de abajo están ocultas
      y aparecen al llegar a ellas.
- [ ] Con JavaScript desactivado en el navegador, las siete secciones de `/` son
      visibles y legibles.
- [ ] Con `prefers-reduced-motion: reduce` activo, todo el contenido de `/` es
      visible y no hay animación de entrada, siluetas flotando ni flecha rebotando.

### Biblioteca mudada (`/games`)

- [ ] `/games` renderiza las 8 tarjetas, el buscador y los chips de categoría.
- [ ] Los cuatro criterios de biblioteca de la spec 01 siguen pasando en `/games`:
      "serp" deja 1 tarjeta, el chip SHOOTER deja 2, PUZZLE + "zzz" muestra
      "NO HAY RESULTADOS", y la tarjeta se inclina al pasar el cursor.
- [ ] `/games` ya no es la misma página que `/`.
- [ ] El título del navegador en `/games` es "Biblioteca · Arcade Vault".

### Navegación

- [ ] El nav muestra 3 enlaces en este orden: Inicio · Biblioteca · Salón de la Fama.
- [ ] En `/`, "Inicio" tiene clase `active` y "Biblioteca" no.
- [ ] En `/games`, `/games/caida` y `/games/caida/play`, "Biblioteca" tiene clase
      `active` e "Inicio" no.
- [ ] El logo lleva a `/`.
- [ ] El nav no muestra ningún enlace "Acerca de".
- [ ] A 375px de ancho, el panel móvil muestra los mismos 3 enlaces más
      "Iniciar Sesión", y el backdrop lo cierra.

### Regresión de la spec 01

- [ ] "VOLVER A LA BIBLIOTECA" del salón lleva a `/games`.
- [ ] "VOLVER AL VAULT" de la 404, del detalle y del modal de fin de partida
      lleva a `/games`.
- [ ] "JUGAR COMO INVITADO" del login lleva a `/games`.
- [ ] Enviar el formulario de `/login` navega a `/games`.
- [ ] `/games/no-existe` y `/ruta-inventada` siguen mostrando la 404.
- [ ] Las cinco pantallas de la spec 01 se ven exactamente igual que antes de
      esta spec: el CSS anexado no altera ninguna regla existente.

### Pestaña de registro (`/login`)

- [ ] `/login?tab=registro` abre en CREAR CUENTA, con 3 campos y el correo
      entrando con `slide-in`.
- [ ] `/login` abre en INICIAR SESIÓN, con 2 campos.
- [ ] `/login?tab=basura` abre en INICIAR SESIÓN, sin error.
- [ ] Los CTA "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" del home aterrizan en la
      pestaña CREAR CUENTA.

---

## Decisiones

### Rutas

- **Sí:** `/` es la landing y la biblioteca se muda a `/games`. La landing es la
  puerta de entrada del producto; dejarla en `/home` habría creado una página que
  nadie ve al escribir el dominio.
- **Sí:** la biblioteca cuelga de `/games`, el mismo segmento que `/games/[id]` y
  `/games/[id]/play`. El listado y sus detalles quedan en la misma rama.
- **No:** `/library`. Habría roto esa relación jerárquica sin ganar nada.
- **No:** una redirección de compatibilidad. `/` no desaparece, cambia de
  contenido: no hay ninguna URL rota que redirigir.
- **Sí:** los seis destinos que hoy apuntan a `/` pasan a `/games`, incluidos los
  tres botones que dicen "VOLVER AL VAULT". Preservar a dónde llegaba el usuario
  pesa más que la literalidad del texto del botón.

### Contenido

- **Sí:** el contador de stats se construye con `${GAMES.length}+`. El mockup
  decía "12+" con 8 juegos en el catálogo, y la biblioteca que desmiente esa
  cifra está a un clic.
- **Sí:** los nombres de juego del ticker se derivan de `getGame(gameId)!.title`.
  El mockup los escribía a mano y en minúscula ("Caída", "Bloque Buster"), que es
  exactamente el dato que se desincroniza cuando alguien renombra un juego.
- **Sí:** "JUEGOS CLÁSICOS" nombra juegos del catálogo en vez de "Arkanoid,
  Tetris, Snake". Misma coherencia, y de paso la portada deja de anunciar marcas
  ajenas que el sitio no ofrece.
- **Sí:** "LADDER BOARDS" pasa a "SALÓN DE LA FAMA". Era el único título en inglés
  de una interfaz en español, y nombraba con otra palabra una sección que el nav
  ya llama así.
- **Sí:** las siete puntuaciones del ticker se quedan con los valores del mockup,
  que resultan ser el `best` de cada juego. Se guardan como literal y no derivados
  de `game.best`: son conceptos distintos (una es "última puntuación", el otro
  "récord") y hacerlos el mismo dato ataría dos cosas que no tienen por qué
  moverse juntas.
- **Sí:** "ACTIVIDAD EN VIVO" y "MILES DE PARTIDAS JUGADAS CADA DÍA" se portan
  literales. Son copy de mockup y no hay dato real que los contradiga todavía.
  Quedan anotados como deuda de contenido para cuando exista backend.

### Estructura

- **Sí:** las siete secciones viven inline en `app/page.tsx`. Son ~200 líneas de
  markup sin estado que se leen de arriba abajo igual que `home.jsx`, lo que hace
  el diff contra la referencia inmediato.
- **No:** siete componentes `HomeHero`, `HomeFeatures`, `HomeStats`… Fragmentar
  200 líneas estáticas en siete ficheros añade saltos de navegación sin añadir
  reutilización: ninguna de esas secciones se usa en otro sitio.
- **No:** una subcarpeta `app/components/home/`. La spec 01 dejó
  `app/components/` plano y esta spec solo añade cuatro ficheros.
- **Sí:** se extrae lo que se repite (`MiniCard`), lo voluminoso (los dos ficheros
  de SVG) y lo que necesita cliente (`Reveal`).
- **Sí:** `Reveal` es el único Client Component nuevo y recibe las secciones por
  `children`, así que el markup y los datos siguen renderizándose en servidor.
- **No:** marcar todo el home como `"use client"`. Mandaría al bundle 200 líneas
  de markup y cinco arrays de datos para montar un `IntersectionObserver`.

### Reveal y movimiento

- **Sí:** fallback `<noscript>` que fuerza `.reveal { opacity: 1; transform: none; }`.
  Sin él, el 100% del contenido bajo el hero queda en `opacity: 0` si el JS no
  corre — y el contenido está en el HTML, así que el fallo sería invisible en el
  build y visible solo en el navegador.
- **No:** `animation-timeline: view()` en CSS puro. Sin soporte en Safari.
- **No:** renderizar visible y ocultar en `useEffect`. Introduce un parpadeo entre
  la hidratación y el efecto, y ese parpadeo lo ve todo el mundo, no solo quien
  navega sin JS.
- **Sí:** el bloque `prefers-reduced-motion` global de `globals.css` ya neutraliza
  las animaciones nuevas (siluetas, flecha, `.reveal`, ticker) porque actúa sobre
  `*`. No hace falta código adicional: el `.in` lo sigue añadiendo el observer, y
  la transición simplemente es instantánea.

### Estilos

- **Sí:** anexar solo HOME, ACTIVITY y PRICING. Es lo que consume `home.jsx`.
- **No:** anexar también ABOUT y GAMEPAD. Son ~400 líneas que ningún componente
  usaría hasta la spec del "Acerca de".
- **No:** un `app/home.css` aparte. Partiría en dos la hoja de estilos por una
  sola pantalla.
- **Sí:** el CSS se reformatea al estilo multilínea que ya tiene `globals.css`.
  El fichero portado en el commit `9aa6d84` no es una copia byte a byte del
  template, y mezclar dos formatos en la misma hoja envejece mal.
- **Sí:** generalizar `.av-hero .sub .blink` → `.blink`. El `_` del hero del home
  no parpadeaba ni en la referencia, y ese selector acotado es la causa.
- **No:** reescribir nada con utilidades de Tailwind. Misma decisión que la spec 01.

### Login

- **Sí:** `/login?tab=registro` con `await searchParams` y una prop `initialTab`.
  Dos CTA que prometen "crear cuenta" y "empezar gratis" deben aterrizar donde
  dicen.
- **Sí:** cualquier valor de `tab` que no sea `registro` abre en INICIAR SESIÓN.
  Un parámetro de URL es entrada del usuario y no debe poder romper la pantalla.
- **No:** una ruta `/register` propia. El formulario es el mismo componente con
  otra pestaña, no otra pantalla.

### Alcance

- **Sí:** el "Acerca de" queda fuera, incluido su enlace en el nav. Portar el
  enlace sin la ruta sería un botón que lleva a la 404.
- **Sí:** `references/templates/home-about/` se queda en el repositorio como
  referencia. No se importa desde `app/` ni se borra, igual que la spec 01.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `transitionDelay` inline retrasa el `:hover` de las feature cards hasta 240 ms, y en `.stat-block` es inerte porque ese selector no declara ninguna `transition`. En ambos casos el escalonado que pretendía no existe: `.reveal` vive en el `<section>` padre. | **Eliminar los dos `style={{ transitionDelay }}`** al portar. Si más adelante se quiere el escalonado de verdad, se consigue moviendo `.reveal` a cada tarjeta, no con un delay sobre la transición de hover. |
| `.reveal` con `threshold: 0.12` exige que el 12% de la sección sea visible. Una sección mucho más alta que la ventana —PRECIOS a 375 px, con la tarjeta de plan y tres FAQ apiladas— podría no alcanzar nunca ese porcentaje y quedarse invisible. | Verificar `/` a 375 px de ancho haciendo scroll hasta el final. Si alguna sección no aparece, cambiar a `threshold: 0` con `rootMargin: "0px 0px -10% 0px"`, que dispara en cuanto el borde superior entra. |
| El fallo del `IntersectionObserver` es silencioso: el contenido está en el HTML, así que `npm run build` pasa, el crawler lo indexa y solo se ve el hueco en el navegador. | El criterio de aceptación "con JavaScript desactivado las siete secciones son visibles" es manual y obligatorio. No hay forma de detectarlo desde la compilación. |
| Mover la biblioteca a `/games` deja enlaces apuntando al sitio equivocado en cualquier fichero que no esté en la lista de seis. | El criterio `grep -rn 'href="/"' app/` debe devolver solo el logo del nav y el enlace "Inicio". Cualquier otra línea es un enlace olvidado. |
| El CSS nuevo usa selectores descendientes atados a la estructura exacta del DOM (`.feature-card .ft-title`, `.top-row.top1 .tp-rk`, `.price-card .pc-list li`). Cualquier "mejora" del markup rompe estilos sin error de compilación. | Replicar la jerarquía de `home.jsx` etiqueta por etiqueta. Del CSS anexado no se modifica nada salvo el reformateo. |
| **Incoherencia preexistente que esta spec lleva a la portada:** `game.best` es menor que la fila #01 del ranking de ese mismo juego en los 8 casos (Caída: `best` 184.220 frente a un top de 298.105). El ticker del home publica ahora esos `best` en la página de entrada, junto a un enlace al detalle que los desmiente. | **Fuera de alcance de esta spec** — el defecto está en `seededScores` de la spec 01, no en el home. Queda registrado para la spec que toque los datos: la solución es acotar `seededScores` a `game.best` como techo, o dejar de llamarlo "mejor global". |

---

## Lo que **no** entra en esta spec

- La pantalla "Acerca de", su ruta, su enlace en el nav y los bloques CSS
  ABOUT y GAMEPAD.
- Datos reales de actividad, ranking o estadísticas. Todo es literal estático.
- Ticker que se actualice solo, con temporizadores o con `Date`.
- Cobros o planes de pago: la sección PRECIOS es informativa.
- Juego real, autenticación, concepto de usuario, persistencia y tests, que ya
  quedaron fuera de la spec 01 y siguen fuera.
- Arreglar la incoherencia entre `game.best` y `seededScores`, registrada arriba
  como riesgo.

Cada uno de ellos, si llega, va en su propia spec.
