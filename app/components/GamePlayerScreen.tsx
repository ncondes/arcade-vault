"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import GameCanvas, { type GameCanvasHandle } from "@/app/components/GameCanvas";
import { isPlayable } from "@/app/lib/arcade/registry";
import type { ArcadeSnapshot } from "@/app/lib/arcade/types";
import type { Game } from "@/app/lib/types";
// Dos ramas según el registro. Juego registrado: el HUD lee la instantánea del
// motor y los botones le dan órdenes. Juego sin registrar: la maqueta de la
// spec 01, sin cambios — el HUD no simula nada.
const LIVES = 3;
const LEVEL = 3;
const DEFAULT_PLAYER = "INVITADO";
export default function GamePlayerScreen({ game }: { game: Game }) {
  const playable = isPlayable(game.id);
  const engine = useRef<GameCanvasHandle>(null);
  const [snapshot, setSnapshot] = useState<ArcadeSnapshot | null>(null);
  const [mockPaused, setMockPaused] = useState(false);
  const [mockOver, setMockOver] = useState(false);
  const [name, setName] = useState(DEFAULT_PLAYER);
  const [saved, setSaved] = useState(false);
  const score = playable ? (snapshot?.score ?? 0) : game.best;
  const lives = playable ? (snapshot?.lives ?? LIVES) : LIVES;
  const level = playable ? (snapshot?.level ?? 1) : LEVEL;
  const paused = playable ? snapshot?.status === "paused" : mockPaused;
  const over = playable ? snapshot?.status === "gameover" : mockOver;
  // Antes del primer clic no hay partida que pausar ni que terminar.
  const idle = playable && (snapshot?.status ?? "idle") === "idle";
  const togglePause = () => {
    if (!playable) return setMockPaused((p) => !p);
    if (paused) engine.current?.resume();
    else engine.current?.pause();
  };
  const finish = () => {
    if (playable) engine.current?.end();
    else setMockOver(true);
  };
  const restart = () => {
    if (playable) engine.current?.restart();
    setMockPaused(false);
    setMockOver(false);
    setSaved(false);
    setName(DEFAULT_PLAYER);
  };
  return (
    <div className="av-player fade-in" data-game-screen>
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(Math.max(lives, 0)).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={togglePause} disabled={idle}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={finish} disabled={idle}>
            FIN
          </button>
          <Link className="btn ghost" href={`/games/${game.id}`}>
            SALIR
          </Link>
        </div>
      </div>
      <div className="crt">
        <div className="crt-screen">
          {isPlayable(game.id) ? (
            <GameCanvas ref={engine} gameId={game.id} onSnapshot={setSnapshot} />
          ) : (
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
              <div className="player-ship" />
            </div>
          )}
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  {playable
                    ? "PULSA REANUDAR O ESC PARA CONTINUAR"
                    : "PULSA REANUDAR PARA CONTINUAR"}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                  aria-label="Tus iniciales"
                />
                {/* Solo cambia el texto: esta spec no persiste puntuaciones. */}
                <button className="btn yellow" onClick={() => setSaved(true)}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link className="btn magenta" href="/games">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
