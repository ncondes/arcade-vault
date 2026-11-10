// Registro de juegos reales: id del catálogo → import() del motor. Es la única
// fuente de verdad de "este juego es jugable"; la usan la pantalla de juego, la
// tarjeta de la biblioteca y el detalle. Añadir un juego = una línea aquí y una
// carpeta en app/lib/arcade/.
import type { ArcadeGameModule } from "@/app/lib/arcade/types";
type ArcadeLoader = () => Promise<ArcadeGameModule>;
const LOADERS: Record<string, ArcadeLoader> = {
  asteroides: () => import("@/app/lib/arcade/asteroides").then((m) => m.default),
};
export function isPlayable(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(LOADERS, id);
}
export function getArcadeLoader(id: string): ArcadeLoader | undefined {
  return isPlayable(id) ? LOADERS[id] : undefined;
}
