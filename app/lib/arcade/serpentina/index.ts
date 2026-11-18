// Única puerta pública de Serpentina: nadie importa engine, board, sprites ni
// constants desde fuera de esta carpeta.
import type { ArcadeGameModule } from "@/app/lib/arcade/types";
import { H, W } from "@/app/lib/arcade/serpentina/constants";
import { createSerpentinaEngine } from "@/app/lib/arcade/serpentina/engine";
const serpentina: ArcadeGameModule = {
  width: W,
  height: H,
  controls: [
    ["← ↑ → ↓", "Girar"],
    ["W A S D", "Girar"],
  ],
  createEngine: createSerpentinaEngine,
};
export default serpentina;
