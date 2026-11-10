// Única puerta pública de Asteroides: nadie importa engine, entities ni
// constants desde fuera de esta carpeta.
import type { ArcadeGameModule } from "@/app/lib/arcade/types";
import { H, W } from "@/app/lib/arcade/asteroides/constants";
import { createAsteroidsEngine } from "@/app/lib/arcade/asteroides/engine";
const asteroides: ArcadeGameModule = {
  width: W,
  height: H,
  controls: [
    ["← →", "Rotar"],
    ["↑", "Propulsar"],
    ["Espacio", "Disparar"],
  ],
  createEngine: createAsteroidsEngine,
};
export default asteroides;
