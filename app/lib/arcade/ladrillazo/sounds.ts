// Los dos efectos del original, un `Audio` por efecto y por motor. Cada golpe
// suena con un clon para que se puedan solapar. Sin control de volumen: el
// silencio global es de una spec de plataforma.
import { SOUND_BOUNCE_SRC, SOUND_BREAK_SRC } from "./constants";
export type Sounds = {
  /** Rebote en las paredes y en la pala. */
  bounce(): void;
  /** Rotura de un ladrillo. */
  brick(): void;
};
/** El rechazo de `play()` (autoplay, fichero que no carga) se captura: la consola queda limpia. */
function play(audio: HTMLAudioElement): void {
  const clone = audio.cloneNode() as HTMLAudioElement;
  clone.play().catch(() => {});
}
export function createSounds(): Sounds {
  const bounceAudio = new Audio(SOUND_BOUNCE_SRC);
  const breakAudio = new Audio(SOUND_BREAK_SRC);
  return {
    bounce: () => play(bounceAudio),
    brick: () => play(breakAudio),
  };
}
