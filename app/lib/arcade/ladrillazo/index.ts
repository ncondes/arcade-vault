// Única puerta pública de Ladrillazo: nadie importa engine, constants, levels,
// sprites ni sounds desde fuera de esta carpeta.
import type { ArcadeGameModule } from "@/app/lib/arcade/types";
import { H, W } from "@/app/lib/arcade/ladrillazo/constants";
import { createLadrillazoEngine } from "@/app/lib/arcade/ladrillazo/engine";
const ladrillazo: ArcadeGameModule = {
  width: W,
  height: H,
  controls: [
    ["← →", "Mover"],
    ["Ratón", "Mover"],
  ],
  createEngine: createLadrillazoEngine,
};
export default ladrillazo;
