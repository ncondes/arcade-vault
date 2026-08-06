import type { ContactTip, Highlight } from "@/app/lib/types";

/**
 * Datos de la pantalla "Acerca de". Copia literal de
 * `references/templates/home-about/about.jsx:41-43,73-75`.
 *
 * A diferencia del home, aquí no hay ningún dato de la aplicación que pueda
 * contradecirlos, así que se portan tal cual, incluido "RESPUESTA EN 24-48H".
 */

export const HIGHLIGHTS: Highlight[] = [
  { icon: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", accent: "magenta" },
  {
    icon: "BROWSER",
    text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",
    accent: "cyan",
  },
  { icon: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", accent: "green" },
];

export const CONTACT_TIPS: ContactTip[] = [
  { text: "RESPUESTA EN 24-48H", led: "green" },
  { text: "SUGERENCIAS BIENVENIDAS", led: "yellow" },
  { text: "SIN SPAM, JAMÁS", led: "magenta" },
];
