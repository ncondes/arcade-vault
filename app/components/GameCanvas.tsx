"use client";
// Envoltorio React de un motor del runtime de juegos. No sabe qué juego monta:
// lo pide al registro por id y lo carga con import() dentro del efecto, así que
// el motor nunca se ejecuta en servidor ni entra en el chunk inicial.
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from "react";
import { getArcadeLoader } from "@/app/lib/arcade/registry";
import type {
  ArcadeEngine,
  ArcadeGameModule,
  ArcadeSnapshot,
  ArcadeStatus,
} from "@/app/lib/arcade/types";
type LoadState = "loading" | "ready" | "error";
/** Las órdenes que la pantalla de juego puede dar al motor. */
export type GameCanvasHandle = Pick<ArcadeEngine, "pause" | "resume" | "end" | "restart">;
type Props = {
  gameId: string;
  /** Recibe cada instantánea del motor, para el HUD. */
  onSnapshot?: (snapshot: ArcadeSnapshot) => void;
  ref?: Ref<GameCanvasHandle>;
};
/** Teclas del juego que, con la partida en marcha, no deben mover la página. */
const GAME_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);
/** La raíz de la pantalla de juego lleva este atributo: sus botones y enlaces
 *  (PAUSA, FIN, SALIR…) no cuentan como "salir del juego" a efectos de pausa. */
const SCREEN_SELECTOR = "[data-game-screen]";
// Heurística de "sin teclado físico": puntero principal grueso y sin hover.
// Falla con portátiles táctiles, por eso el aviso no bloquea nada.
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";
function subscribeTouch(onChange: () => void) {
  const mq = window.matchMedia(TOUCH_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
export default function GameCanvas({ gameId, onSnapshot, ref }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArcadeEngine | null>(null);
  // Copia síncrona del estado para los listeners de window, que no ven el render.
  const statusRef = useRef<ArcadeStatus>("idle");
  const [load, setLoad] = useState<LoadState>("loading");
  const [controls, setControls] = useState<ArcadeGameModule["controls"]>([]);
  const [snapshot, setSnapshot] = useState<ArcadeSnapshot | null>(null);
  const touchOnly = useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false
  );
  // El callback del padre se guarda en un ref para que cambiarlo no recree el motor.
  const onSnapshotRef = useRef(onSnapshot);
  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
  });
  /** Reanudar devuelve el foco al juego: si se quedara en el botón REANUDAR, el
   *  siguiente clic fuera no pausaría y Espacio volvería a pulsar el botón. */
  const focusGame = () => wrapperRef.current?.focus({ preventScroll: true });
  useImperativeHandle(
    ref,
    () => ({
      pause: () => engineRef.current?.pause(),
      resume: () => {
        engineRef.current?.resume();
        focusGame();
      },
      end: () => engineRef.current?.end(),
      restart: () => {
        engineRef.current?.restart();
        focusGame();
      },
    }),
    []
  );
  // ── Motor ──
  useEffect(() => {
    const loader = getArcadeLoader(gameId);
    const canvas = canvasRef.current;
    if (!loader || !canvas) return;
    // StrictMode monta, desmonta y vuelve a montar: si la carga llega después
    // del desmontaje, no se crea motor y no queda ningún bucle huérfano.
    let cancelled = false;
    let engine: ArcadeEngine | null = null;
    loader()
      .then((mod) => {
        if (cancelled) return;
        engine = mod.createEngine({
          canvas,
          onSnapshot: (next) => {
            statusRef.current = next.status;
            setSnapshot(next);
            onSnapshotRef.current?.(next);
          },
        });
        engineRef.current = engine;
        setControls(mod.controls);
        setLoad("ready");
      })
      .catch(() => {
        if (!cancelled) setLoad("error");
      });
    return () => {
      cancelled = true;
      engine?.destroy();
      engineRef.current = null;
      statusRef.current = "idle";
    };
  }, [gameId]);
  // ── Teclado de la página y pausa automática ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const status = statusRef.current;
      // Solo con la partida en marcha: en el arranque, en pausa o con el modal
      // la página vuelve a ser una página y las flechas hacen scroll.
      if (status === "playing" && GAME_KEYS.has(e.code)) e.preventDefault();
      if (e.code === "Escape") {
        if (status === "playing") engineRef.current?.pause();
        else if (status === "paused") {
          engineRef.current?.resume();
          focusGame();
        }
      }
    };
    const pauseIfPlaying = () => {
      if (statusRef.current === "playing") engineRef.current?.pause();
    };
    // Clic fuera del juego: pausa. Se decide en pointerdown y no en el blur del
    // canvas porque Safari no da el foco a un botón al hacer clic, y el blur no
    // distinguiría "clic en PAUSA" de "clic en cualquier otro sitio".
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || wrapperRef.current?.contains(target)) return;
      if (target.closest(`${SCREEN_SELECTOR} button, ${SCREEN_SELECTOR} a`)) return;
      pauseIfPlaying();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseIfPlaying();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", pauseIfPlaying);
    window.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", pauseIfPlaying);
      window.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  const status = snapshot?.status ?? "idle";
  const start = () => {
    if (status === "idle") engineRef.current?.start();
  };
  return (
    <div
      ref={wrapperRef}
      className="game-canvas"
      tabIndex={0}
      role="application"
      aria-label="Pantalla de juego"
      onClick={start}
      onKeyDown={(e) => {
        if (status !== "idle" || e.key === "Tab" || e.key === "Escape") return;
        // La tecla que arranca la partida no debe además mover la página.
        e.preventDefault();
        start();
      }}
      onBlur={(e) => {
        // Foco que sale con el teclado (Tab) hacia fuera de la pantalla de
        // juego. Los clics los resuelve pointerdown; el cambio de ventana, blur.
        const next = e.relatedTarget as Element | null;
        if (!next || next.closest(SCREEN_SELECTOR)) return;
        if (statusRef.current === "playing") engineRef.current?.pause();
      }}
    >
      <canvas ref={canvasRef} />
      {load === "loading" && (
        <div className="arcade-overlay">
          <div className="title">CARGANDO…</div>
        </div>
      )}
      {load === "error" && (
        <div className="arcade-overlay" role="alert">
          <div className="msg">
            No se pudo cargar el juego. Recarga la página para intentarlo de nuevo.
          </div>
        </div>
      )}
      {load === "ready" && status === "idle" && (
        <div className="arcade-overlay">
          <div className="title attract">PULSA PARA EMPEZAR</div>
          <dl className="arcade-controls" aria-label="Controles">
            {controls.map(([keys, action]) => (
              <div key={keys} style={{ display: "contents" }}>
                <dt>
                  {keys.split(" ").map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </dt>
                <dd>{action}</dd>
              </div>
            ))}
          </dl>
          {touchOnly && (
            <div className="arcade-notice" role="note">
              Este juego se juega con teclado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
