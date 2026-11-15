// Única puerta pública de Tuerca: nadie importa engine, board ni constants desde
// fuera de esta carpeta.
import type { ArcadeGameModule } from "@/app/lib/arcade/types";
import { H, W } from "@/app/lib/arcade/tuerca/constants";
import { createTuercaEngine } from "@/app/lib/arcade/tuerca/engine";
const tuerca: ArcadeGameModule = {
  width: W,
  height: H,
  controls: [
    ["← →", "Mover"],
    ["↑ X", "Rotar"],
    ["↓", "Bajar"],
    ["Espacio", "Caída"],
  ],
  createEngine: createTuercaEngine,
};
export default tuerca;
