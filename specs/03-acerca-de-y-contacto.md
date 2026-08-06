# SPEC 03 — Acerca de y contacto

> **Estado:** Implementado
> **Depende de:** 01-mvp-pantallas-visuales (implementada), 02-pantalla-de-inicio (implementada)
> **Fecha:** 2026-08-06
> **Objetivo:** Portar la pantalla "Acerca de" de `references/templates/home-about/about.jsx`
> a la ruta `/about` y hacer que su formulario de contacto envíe un correo real con Resend
> desde una Server Action.

---

## Por qué existe esta spec

Es la **primera spec del proyecto con backend**. Las specs 01 y 02 no hacían ni
una llamada a servidor — la 02 lo tenía como criterio de aceptación literal
(`grep fetch(` no devolvía nada). Esta lo rompe a propósito, y eso trae
dependencia nueva (`resend`), variables de entorno y un camino de fallo que hasta
ahora no existía en ninguna pantalla.

Además cierra la carpeta `references/templates/home-about/`: la spec 02 portó
`home.jsx`, esta porta `about.jsx` y el cuarto enlace de `nav.jsx`. Después de
esta spec, de esa carpeta solo queda sin usar el bloque CSS `GAMEPAD`.

---

## Alcance

**Dentro:**

- **La ruta `/about`** (`app/about/page.tsx`, Server Component, `metadata.title = "Acerca de"`)
  con las dos secciones de `about.jsx` en orden:
  1. Hero: kicker `▸ ACERCA DE`, título, misión y tres tarjetas `highlight`
     con icono SVG pixel (magenta · cian · verde).
  2. Divisor decorativo de 24 píxeles parpadeantes.
  3. `▸ CONTACTO`: intro con tres `tip` y el formulario al lado.
- **`HighlightIcon.tsx`** — Server Component con los tres iconos SVG (`HEART`,
  `BROWSER`, `PLANT`), tipado para que el `switch` sea exhaustivo, igual que
  `FeatureIcon.tsx` de la spec 02.
- **`ContactForm.tsx`** — Client Component. Único de esta spec. Gestiona el
  `shake` de campos vacíos, la terminal de éxito y la terminal de error.
- **Envío real por Resend** desde una Server Action (`app/actions/contact.ts`):
  validación en servidor, honeypot, `replyTo` al visitante y correo en texto plano.
- **Tres estados que el mockup no tiene**: enviando (botón deshabilitado,
  `▶ ENVIANDO…`), error (terminal en magenta con `[FAIL]` y botón REINTENTAR) y
  descarte silencioso del honeypot.
- **Enlace "Acerca de" en el nav**, cuarto de la lista, en escritorio y panel
  móvil, tal y como está en `references/templates/home-about/nav.jsx:20,41`.
- **CSS**: se anexa a `@layer components` de `globals.css` el bloque ABOUT PAGE
  de `references/templates/home-about/styles.css` (líneas 1071–1147),
  reformateado al estilo multilínea del fichero. Se omite `.divider`, que ya
  existe idéntica. Se añaden las clases de la terminal de error, que no están
  en la plantilla.
- **`Reveal.tsx` gana una prop opcional `decorative`** que le pone
  `aria-hidden="true"` a la sección. La necesita el divisor, que en la
  plantilla es `<div className="about-divider reveal" aria-hidden="true">`.
- **Dependencia nueva**: `resend` en `package.json`.
- **`CONTACT_TO_EMAIL`** se añade a `.env`, junto a la `RESEND_API_KEY` que ya
  está.
- **`.env.example`** versionado, con las dos claves vacías y documentadas, más
  la excepción `!.env.example` en `.gitignore`.

**Fuera de alcance (para futuras specs):**

- **Dominio propio verificado en Resend.** El `from` es
  `Arcade Vault <onboarding@resend.dev>`, el remitente de pruebas de Resend, que
  **solo puede entregar al correo dueño de la cuenta**. Es una limitación
  asumida, no un descuido: se levanta el día que haya dominio.
- **Autorespuesta al visitante.** Sería un segundo envío y otro remitente que
  verificar.
- **Correo en HTML.** Se envía `text` plano. Es un correo interno.
- **Límite por IP, captcha o reCAPTCHA.** Solo honeypot. Queda anotado como riesgo.
- **Persistir los mensajes.** No hay base de datos, ni panel de administración,
  ni historial. El correo es el único registro.
- **Adjuntos** en el formulario.
- **Webhooks de Resend** (rebotes, entregas, quejas).
- **El bloque CSS `GAMEPAD`** (`styles.css:1151–1620`). Sigue sin usarlo ningún
  componente, igual que después de la spec 02.
- **Todo lo que las specs 01 y 02 dejaron fuera** y sigue fuera: juego real,
  autenticación, concepto de usuario, persistencia y tests.
- **La incoherencia entre `game.best` y `seededScores`**, registrada como riesgo
  en la spec 02. Esta spec no toca esos datos.

---

## Modelo de datos

### Tipos nuevos en `app/lib/types.ts`

```ts
export type HighlightIconKind = "HEART" | "BROWSER" | "PLANT";

export type Highlight = {
  icon: HighlightIconKind;
  text: string;        // "HECHO CON ❤️ PARA JUGADORES"
  accent: Accent;      // reutiliza el Accent de la spec 01
};

export type ContactTip = {
  text: string;                                  // "RESPUESTA EN 24-48H"
  led: "green" | "yellow" | "magenta";           // el color del punto
};
```

### `app/lib/about.ts`

Dos constantes, ambas copia literal de `about.jsx`:

- `HIGHLIGHTS: Highlight[]` — 3 entradas (magenta, cyan, green), en ese orden.
- `CONTACT_TIPS: ContactTip[]` — 3 entradas (green, yellow, magenta).

El CSS usa modificadores de una letra (`.tip-led.y`, `.tip-led.m`, y verde sin
modificador). La traducción vive en un `Record` dentro del componente, no en los
datos: el dato dice el color, no la clase.

### Contrato de la Server Action — `app/actions/contact.ts`

```ts
export type ContactValues = { name: string; email: string; message: string };

export type ContactState =
  | { status: "idle" }
  | { status: "sent"; name: string }                                    // terminal verde
  | { status: "invalid"; message: string; values: ContactValues }       // shake + aviso
  | { status: "failed"; values: ContactValues };                        // terminal magenta
```

Reglas:

- **Los nombres de campo del formulario son `name`, `email`, `message`** y el
  honeypot es `website`. El honeypot es un `<input>` fuera de pantalla con
  `tabIndex={-1}` y `autoComplete="off"`.
- **`status: "failed"` nunca lleva el error de Resend.** El motivo real va a
  `console.error` en el servidor; al navegador solo llega el estado. Un mensaje
  de proveedor puede filtrar la clave, el dominio o el destinatario.
- **`values` viaja de vuelta** en los dos estados de fallo, para que el
  formulario se repueble aunque el navegador haya recargado sin JavaScript.
- **Los inputs son no controlados** (`defaultValue`), no `useState` como en la
  plantilla. Con JavaScript el DOM conserva lo escrito durante el re-render, y
  sin JavaScript lo repuebla `values`. La versión controlada de `about.jsx` solo
  funciona en el primer caso.

### Validación en servidor

| Campo | Regla | Mensaje |
| --- | --- | --- |
| `name` | 1–80 tras `trim()` | `EL NOMBRE ES OBLIGATORIO` |
| `email` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` y ≤ 254 | `CORREO NO VÁLIDO` |
| `message` | 1–5000 tras `trim()` | `EL MENSAJE ES OBLIGATORIO` |
| `website` | debe llegar vacío | — (se responde `sent` sin enviar nada) |

### Correo enviado

```ts
{
  from: "Arcade Vault <onboarding@resend.dev>",
  to: process.env.CONTACT_TO_EMAIL,
  replyTo: email,                                  // responder desde la bandeja funciona
  subject: `[Arcade Vault] Mensaje de ${name}`,
  text: `${name} <${email}>\n\n${message}`,
}
```

Ambas variables de entorno se leen **dentro** de la acción, no al importar el
módulo. Si falta cualquiera de las dos, la acción devuelve `failed` y lo registra
en el log; la página `/about` sigue cargando y el build nunca se rompe.

---

## Plan de implementación

Nueve pasos. Cada uno deja el proyecto compilando y las seis pantallas actuales
navegables. Hasta el paso 8, `/about` no está enlazada desde ningún sitio: se
llega escribiendo la URL, y eso es deliberado.

1. **Dependencia y entorno.** `npm install resend`. Añadir `CONTACT_TO_EMAIL` a
   `.env` con el correo dueño de la cuenta de Resend. Crear `.env.example` con
   las dos claves vacías y un comentario por cada una. Añadir `!.env.example`
   a `.gitignore`, bajo la regla `.env*` que hoy lo ignoraría.
   _Verificación:_ `git check-ignore .env.example` no devuelve nada y
   `git check-ignore .env` sí devuelve `.env`. `npm run build` sigue pasando.

2. **Estilos.** Anexar dentro de `@layer components` de `app/globals.css`, antes
   de su cierre en la línea 2520, el bloque ABOUT PAGE de
   `references/templates/home-about/styles.css` (líneas 1071–1147),
   reformateado al estilo multilínea del fichero. **Se omite `.divider`**
   (líneas 1148–1149), que ya existe idéntica en `globals.css:1648`.
   Añadir después dos reglas que la plantilla no tiene, para la terminal de
   fallo: `.terminal-success.fail` (borde y resplandor en `--magenta`) y
   `.term-body .fail` (texto en `--magenta`). Se usa `--magenta`, no un rojo
   nuevo: la paleta no tiene rojo y no se inventa uno para una pantalla.
   _Verificación:_ `npm run build` pasa y las seis pantallas se ven igual que
   antes. El CSS nuevo todavía no lo usa ningún componente.

3. **Datos y tipos.** Añadir `HighlightIconKind`, `Highlight` y `ContactTip` a
   `app/lib/types.ts`. Crear `app/lib/about.ts` con `HIGHLIGHTS` y
   `CONTACT_TIPS`, copia literal de `about.jsx`.
   _Verificación:_ `npx tsc --noEmit` sin errores.

4. **Componentes de presentación.** Crear `app/components/HighlightIcon.tsx`
   (Server Component, los tres SVG, `switch` exhaustivo sobre
   `HighlightIconKind`, sin rama `null`, igual que `FeatureIcon.tsx`). Añadir a
   `app/components/Reveal.tsx` una prop opcional `decorative?: boolean` que
   emite `aria-hidden="true"` en el `<section>`.
   _Verificación:_ `npx tsc --noEmit` y `npm run lint` sin errores. `/` se
   comporta igual: la prop es opcional y el home no la pasa.

5. **Server Action.** Crear `app/actions/contact.ts` con `"use server"`:
   `sendContactMessage(prev: ContactState, formData: FormData)`. Orden de
   comprobaciones: honeypot primero (devuelve `sent` sin enviar nada), luego
   validación de los tres campos, luego lectura de `RESEND_API_KEY` y
   `CONTACT_TO_EMAIL`, luego el envío. Cualquier excepción o error de Resend se
   registra con `console.error` y devuelve `failed`.
   _Verificación:_ `npx tsc --noEmit` y `npm run build`. Todavía no hay
   formulario que la invoque; este paso no se puede probar en el navegador y no
   se pretende que lo sea.

6. **Formulario.** Crear `app/components/ContactForm.tsx`, Client Component:
   `useActionState(sendContactMessage, { status: "idle" })`, inputs no
   controlados con `defaultValue` tomado de `state.values`, honeypot `website`,
   guarda `onSubmit` que hace `preventDefault` y dispara el `shake` de 400 ms si
   algún campo está vacío, botón deshabilitado con `▶ ENVIANDO…` mientras
   `pending`, terminal verde en `sent`, terminal magenta con `[FAIL]` y
   REINTENTAR en `failed`, y aviso corto sobre el botón en `invalid`.
   _Verificación:_ `npx tsc --noEmit` y `npm run lint`. Sin usar aún.

7. **La página.** Crear `app/about/page.tsx`, Server Component, con
   `metadata.title = "Acerca de"`. Raíz `<div className="about fade-in">`, el
   `<noscript>` con `.reveal { opacity: 1; transform: none; }` igual que
   `app/page.tsx:32`, el hero **sin** envolver en `Reveal` (la plantilla tampoco
   lo envuelve), el divisor en `<Reveal className="about-divider" decorative>` y
   el contacto en `<Reveal className="about-contact">`.
   _Verificación:_ `/about` muestra las dos secciones, el envío real llega al
   buzón de `CONTACT_TO_EMAIL` y responder a ese correo abre una respuesta
   dirigida al visitante.

8. **Navegación.** En `app/components/Nav.tsx`, añadir `const isAbout =
   pathname === "/about"` y el enlace `Acerca de` como cuarto de la lista, en
   escritorio y en el panel móvil, igual que `nav.jsx:20,41`.
   _Verificación:_ el nav muestra cuatro enlaces, `Acerca de` se marca en
   `/about`, y a 900 px de ancho los cuatro caben sin desbordar ni solapar el
   botón `Iniciar Sesión`.

9. **Verificación final.** Recorrer la lista completa de criterios de
   aceptación, incluidos los de regresión de las specs 01 y 02.

---

## Criterios de aceptación

### Compilación

- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta ningún problema.
- [ ] `npm run build` termina sin errores y lista 7 rutas más la 404:
      `/`, `/about`, `/games`, `/games/[id]`, `/games/[id]/play`, `/login`,
      `/hall-of-fame`.
- [ ] `"use client"` aparece en exactamente 8 componentes: los 7 tras la spec 02
      más `ContactForm.tsx`.
- [ ] `grep -rn "localStorage\|document.cookie\|fetch(\|setInterval" app/` sigue
      sin devolver nada: el envío usa el SDK de Resend, no `fetch` directo.
- [ ] `grep -rn "RESEND_API_KEY\|CONTACT_TO_EMAIL" app/` solo devuelve líneas de
      `app/actions/contact.ts`.
- [ ] Ninguna ruta emite advertencias de hidratación en la consola.

### Entorno

- [ ] `.env.example` está versionado y `.env` no:
      `git check-ignore .env` devuelve `.env`, y `git check-ignore .env.example`
      no devuelve nada.
- [ ] `.env.example` contiene `RESEND_API_KEY=` y `CONTACT_TO_EMAIL=`, ambas sin
      valor.
- [ ] `resend` aparece en `dependencies` de `package.json`, no en
      `devDependencies`.

### Pantalla `/about`

- [ ] El kicker dice `▸ ACERCA DE` en amarillo y el título `ACERCA DE ARCADE VAULT`.
- [ ] Hay 3 tarjetas `highlight`, con icono SVG, en el orden magenta · cian · verde,
      y sus textos coinciden carácter a carácter con `about.jsx:41-43`.
- [ ] Al pasar el cursor sobre una `highlight`, sube 3 px y su borde toma el
      color de la tarjeta.
- [ ] El divisor muestra 24 píxeles y su contenedor tiene `aria-hidden="true"`.
- [ ] La sección de contacto muestra 3 `tip` con puntos verde, amarillo y magenta,
      en ese orden.
- [ ] El formulario muestra los 3 campos con las etiquetas NOMBRE, CORREO
      ELECTRÓNICO y MENSAJE, y sus `placeholder` son `px_kai`,
      `jugador@vault.gg` y `Cuéntanos qué tienes en mente…`.
- [ ] Cada `<label>` está asociada a su campo por `htmlFor`/`id`.
- [ ] El título del navegador es `Acerca de · Arcade Vault`.
- [ ] A 900 px de ancho el grid del contacto pasa a una sola columna.

### Formulario — validación

- [ ] Enviar con los tres campos vacíos sacude el formulario 400 ms, no llama al
      servidor y no borra nada.
- [ ] Enviar con `correo` = `hola` deja el formulario en pie, muestra
      `CORREO NO VÁLIDO` sobre el botón y **conserva** lo escrito en los tres
      campos.
- [ ] Un mensaje de 5001 caracteres se rechaza; uno de 5000 se envía.
- [ ] Un nombre de 81 caracteres se rechaza; uno de 80 se envía.
- [ ] Un fallo de validación **nunca** muestra la terminal.

### Formulario — envío correcto

- [ ] Mientras se envía, el botón está deshabilitado y dice `▶ ENVIANDO…`.
- [ ] Al terminar, el formulario se sustituye por la terminal verde y la última
      línea dice `> MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE>.`
      con el nombre en mayúsculas y un `_` parpadeando.
- [ ] El correo llega a la dirección de `CONTACT_TO_EMAIL`.
- [ ] Su asunto es `[Arcade Vault] Mensaje de <nombre>` y su cuerpo es texto
      plano con el nombre, el correo y el mensaje.
- [ ] Pulsar "Responder" en ese correo dirige la respuesta al correo que escribió
      el visitante, no a `onboarding@resend.dev`.
- [ ] `ENVIAR OTRO MENSAJE` devuelve el formulario con los tres campos vacíos.

### Formulario — fallo

- [ ] Con `RESEND_API_KEY` borrada del entorno, `/about` **carga igual** y el
      envío muestra la terminal magenta con `[FAIL]`.
- [ ] Con `CONTACT_TO_EMAIL` borrada, mismo resultado.
- [ ] Con una `RESEND_API_KEY` inválida, mismo resultado.
- [ ] La terminal de fallo ofrece REINTENTAR, y pulsarlo devuelve el formulario
      **con lo que se había escrito**, no vacío.
- [ ] Ningún mensaje de error de Resend, ni la clave, ni el destinatario
      aparecen en el HTML ni en la consola del navegador. El motivo real solo
      está en el log del servidor.

### Honeypot

- [ ] El campo `website` no es visible ni alcanzable con el tabulador.
- [ ] Enviando el formulario con `website` relleno, la respuesta es la terminal
      verde y **no llega ningún correo**.

### Sin JavaScript

- [ ] Con JavaScript desactivado, las dos secciones de `/about` son visibles.
- [ ] Con JavaScript desactivado, enviar el formulario **envía el correo** y
      muestra la terminal verde.
- [ ] Con JavaScript desactivado, un correo inválido devuelve el formulario con
      el aviso y los tres campos repoblados.
- [ ] Con `prefers-reduced-motion: reduce`, todo `/about` es visible y no hay
      animación de entrada, parpadeo del divisor ni sacudida.

### Navegación

- [ ] El nav muestra 4 enlaces en este orden: Inicio · Biblioteca · Salón de la
      Fama · Acerca de.
- [ ] En `/about`, "Acerca de" tiene clase `active` y los otros tres no.
- [ ] En `/`, `/games` y `/hall-of-fame`, "Acerca de" no está activo.
- [ ] A 900 px de ancho los cuatro enlaces caben en una línea, sin solapar el
      botón "Iniciar Sesión" ni desbordar el nav.
- [ ] A 375 px, el panel móvil muestra los mismos 4 enlaces más "Iniciar Sesión",
      y el backdrop lo cierra.

### Regresión de las specs 01 y 02

- [ ] Las siete secciones de `/` se ven exactamente igual que antes: el CSS
      anexado no altera ninguna regla existente.
- [ ] Las secciones `.reveal` de `/` siguen apareciendo al hacer scroll: la prop
      `decorative` es opcional y el home no la pasa.
- [ ] Las seis pantallas anteriores siguen navegables y sin cambios visuales.

---

## Decisiones

### Envío

- **Sí:** Server Action (`app/actions/contact.ts`) en vez de Route Handler. El
  formulario funciona sin JavaScript, no queda un `POST /api/contact` público
  que cualquiera pueda golpear con curl, y es el patrón que documenta Next 16
  para formularios (`node_modules/next/dist/docs/01-app/02-guides/forms.md`).
- **No:** `app/api/contact/route.ts` con `fetch` desde el cliente. Expone el
  endpoint, obliga a JavaScript y no gana nada a cambio.
- **Sí:** el SDK `resend` en vez de llamar a su API REST con `fetch`. Es una
  dependencia que solo corre en servidor y no entra en el bundle.
- **Sí:** `replyTo` con el correo del visitante. Sin él, responder desde la
  bandeja va a `onboarding@resend.dev` y se pierde.
- **Sí:** texto plano. Es un correo interno para una persona, no una campaña, y
  el HTML solo añade una plantilla que mantener.
- **No:** autorespuesta al visitante. Es un segundo envío, otro remitente que
  verificar y otro camino de fallo; con `onboarding@resend.dev` ni siquiera
  llegaría, porque ese remitente solo entrega al dueño de la cuenta.
- **Sí:** `from: "Arcade Vault <onboarding@resend.dev>"`, asumiendo que **solo
  entrega al correo de la cuenta de Resend**. Es la única opción sin dominio
  propio, y comprar un dominio no es trabajo de esta spec.

### Variables de entorno

- **Sí:** el destinatario es `CONTACT_TO_EMAIL`, no un literal en el código. Un
  correo personal en el repositorio es un correo personal publicado.
- **Sí:** ambas variables se leen **dentro** de la acción, no al importar el
  módulo. Validar el entorno al importar tumba toda la aplicación —incluidas
  seis pantallas que no envían nada— por una configuración que solo hace falta
  al pulsar un botón.
- **Sí:** `.env.example` versionado con `!.env.example` en `.gitignore`. Sin él,
  quien clone el repositorio descubre que faltan variables cuando falla el
  envío, no al arrancar.

### Estados del formulario

- **Sí:** `invalid` y `failed` son estados distintos. Un correo mal escrito se
  arregla en el formulario; un Resend caído no. Sustituir el formulario por una
  terminal roja porque falta una arroba obliga a pulsar REINTENTAR para
  recuperar un formulario que nunca estuvo mal.
- **Sí:** la terminal de fallo reutiliza el markup de `.terminal-success` con un
  modificador `.fail`. Es la misma pantalla con otro color, no otra pantalla.
- **Sí:** `--magenta` para el fallo. La paleta no tiene rojo y no se inventa uno
  para una sola pantalla.
- **Sí:** inputs **no controlados** con `defaultValue`, en contra de la
  plantilla, que los tiene controlados con `useState`. La versión controlada
  pierde lo escrito cuando el navegador recarga sin JavaScript; la no controlada
  lo conserva en los dos casos, porque el servidor devuelve `values`.
- **Sí:** el `shake` de campos vacíos se queda en el cliente, con un `onSubmit`
  que hace `preventDefault`. Ir al servidor para sacudir un formulario vacío
  añade 300 ms a un aviso que el mockup da al instante.
- **Sí:** el servidor revalida los tres campos aunque el cliente ya lo haya
  hecho. La comprobación del cliente es comodidad; la del servidor es la única
  que cuenta.
- **Sí:** botón deshabilitado con `▶ ENVIANDO…` durante `pending`. El mockup no
  tiene espera porque no envía nada; con un envío real hay entre 200 ms y 2 s en
  los que un botón vivo invita a pulsar otra vez.
- **No:** animar las líneas `[OK] Conectando…` al ritmo real del envío. Es
  bonito y es bastante más código para un estado que dura un segundo.

### Seguridad

- **Sí:** honeypot `website`, oculto y con `tabIndex={-1}`. Cuesta diez líneas y
  para el grueso de los bots de formulario.
- **Sí:** cuando el honeypot viene relleno se responde **éxito** sin enviar nada.
  Devolver un error le enseña al bot que ha sido detectado.
- **No:** límite por IP en memoria. Se pierde en cada despliegue, no funciona con
  varias instancias y da una sensación de protección que no existe.
- **No:** captcha. Fricción real para todos los visitantes por un formulario que
  todavía no ha recibido spam.
- **Sí:** el error de Resend nunca llega al navegador. Un mensaje de proveedor
  puede nombrar la clave, el dominio o el destinatario.
- **Sí:** tope de 5000 caracteres en el mensaje y 254 en el correo. Sin tope, el
  cuerpo del `POST` lo decide quien lo envía.

### Estructura

- **Sí:** las dos secciones viven inline en `app/about/page.tsx`, igual que las
  siete del home viven en `app/page.tsx`. Misma decisión que la spec 02.
- **Sí:** se extrae lo que lo pide: `HighlightIcon` (SVG voluminoso) y
  `ContactForm` (lo único que necesita cliente).
- **No:** marcar toda la página como `"use client"`. Mandaría al bundle el hero,
  la misión y los datos para montar un formulario.
- **Sí:** `app/actions/contact.ts`, carpeta `actions/` nueva. Una Server Action
  no es un componente ni una librería de datos; mezclarla en `app/lib/` haría
  que `lib` contuviera a la vez datos estáticos y código con efectos.
- **Sí:** `app/lib/about.ts` para los seis literales, aunque sean pocos. La
  spec 02 puso los del home en `home.ts` y romper el patrón por seis entradas no
  compensa.
- **Sí:** `Reveal` gana una prop opcional `decorative` en vez de duplicarse. Es
  un booleano que emite `aria-hidden`, y el home no lo pasa.

### Estilos y contenido

- **Sí:** anexar solo el bloque ABOUT PAGE. Es lo que consume `about.jsx`.
- **No:** anexar GAMEPAD. Son ~470 líneas que ningún componente usaría.
- **Sí:** omitir `.divider` al anexar. Ya existe idéntica en `globals.css:1648`.
- **Sí:** el CSS se reformatea al estilo multilínea del fichero, como en la
  spec 02. Del resto no se modifica nada.
- **Sí:** los textos de `about.jsx` se portan literales, incluido
  "RESPUESTA EN 24-48H". A diferencia del home, aquí no hay ningún dato de la
  aplicación que los contradiga.
- **No:** reescribir nada con utilidades de Tailwind. Misma decisión que las
  specs 01 y 02.

### Navegación

- **Sí:** se añade "Acerca de" al nav, cuarto, como en `nav.jsx:20,41`. **Esto
  invalida a propósito el criterio de la spec 02** que decía "el nav no muestra
  ningún enlace Acerca de". Aquel criterio existía porque la ruta no existía;
  ahora existe.
- **Sí:** "Acerca de" se marca activo solo con `pathname === "/about"`. No cuelga
  nada de esa ruta, así que no hace falta `startsWith`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| **`onboarding@resend.dev` solo entrega al correo dueño de la cuenta de Resend.** Si `CONTACT_TO_EMAIL` es cualquier otra dirección, Resend responde 403 y el formulario muestra la terminal de fallo para todo el mundo, siempre. Es el fallo más probable al probarlo por primera vez, y desde el navegador se ve idéntico a "la clave está mal". | `CONTACT_TO_EMAIL` debe ser exactamente el correo de la cuenta de Resend. El `console.error` del servidor lleva el motivo real de Resend, que sí distingue 403 de 401. Se levanta el día que haya dominio verificado. |
| **Las variables de entorno viven en `.env`, que no se versiona.** Al desplegar, `RESEND_API_KEY` y `CONTACT_TO_EMAIL` no viajan con el código: hay que declararlas en el panel del proveedor. Si se olvidan, la aplicación despliega sin errores y el formulario falla en producción y solo ahí. | `.env.example` documenta las dos claves. El criterio "con `RESEND_API_KEY` borrada, `/about` carga igual y el envío muestra `[FAIL]`" describe exactamente lo que se verá si pasa. |
| **El formulario vive dentro de una sección `.reveal`, es decir con `opacity: 0` hasta que el `IntersectionObserver` la revela.** Si el JavaScript no se desactiva sino que *falla* —un error en otro componente, una extensión que rompe el bundle—, el `<noscript>` no se aplica y el formulario queda invisible aunque esté en el HTML. El build pasa y el crawler lo indexa. | Es el mismo riesgo que la spec 02 aceptó para el home, ahora sobre un formulario. El criterio de "sin JavaScript" es manual y obligatorio. No hay forma de detectarlo desde la compilación. |
| **La sección de contacto a 375 px queda muy alta**: intro, tres tips y formulario apilados en una columna. Con `threshold: 0.12`, una sección mucho más alta que la ventana puede no alcanzar nunca ese 12% y quedarse invisible. | Mismo riesgo y misma mitigación que la spec 02: verificar `/about` a 375 px haciendo scroll hasta el final. Si no aparece, cambiar a `threshold: 0` con `rootMargin: "0px 0px -10% 0px"`. Cambiar `Reveal` afecta también al home. |
| **El honeypot es toda la protección que hay.** Un bot que rellene solo los campos visibles pasa, y cada mensaje que pasa es un correo enviado contra la cuota de Resend. El plan gratuito son 100 correos al día. | Aceptado a sabiendas. Si llega spam, el límite por IP o el captcha van en su propia spec. Mientras tanto, agotar la cuota se manifiesta como terminal de fallo, no como caída. |
| **No queda registro de los mensajes.** El correo es el único ejemplar. Si Resend lo acepta y luego rebota, o si acaba en spam, el mensaje se pierde y nadie se entera: el visitante vio la terminal verde. | Fuera de alcance de esta spec. Queda anotado para la que traiga base de datos: persistir antes de enviar es lo que convierte el correo en una notificación en vez de en el único ejemplar. |
| **`app/actions/contact.ts` es el primer fichero del proyecto que lee un secreto.** Si alguien lo importa desde un Client Component sin `"use server"`, la clave entraría en el bundle. | La directiva `"use server"` al principio del fichero convierte cada export en una frontera de red: Next no permite que el cuerpo llegue al cliente. El criterio `grep -rn "RESEND_API_KEY\|CONTACT_TO_EMAIL" app/` debe devolver solo líneas de ese fichero. |

---

## Lo que **no** entra en esta spec

- Dominio propio verificado en Resend. El remitente es `onboarding@resend.dev`,
  con la limitación de que solo entrega al correo de la cuenta.
- Autorespuesta al visitante y correo en HTML.
- Límite por IP, captcha o cualquier protección más allá del honeypot.
- Persistir los mensajes: no hay base de datos, ni panel, ni historial.
- Adjuntos en el formulario y webhooks de Resend.
- El bloque CSS `GAMEPAD` de `references/templates/home-about/styles.css`,
  que sigue sin usar ningún componente.
- Juego real, autenticación, concepto de usuario, persistencia y tests, que ya
  quedaron fuera de las specs 01 y 02 y siguen fuera.
- La incoherencia entre `game.best` y `seededScores`, registrada como riesgo en
  la spec 02.

Cada uno de ellos, si llega, va en su propia spec.
