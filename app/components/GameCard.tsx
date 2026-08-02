"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Game } from "@/app/lib/types";

/** `.btn` solo define variantes para magenta y amarillo; el resto usa el cian por defecto. */
function accentClass(color: Game["color"]) {
  if (color === "magenta") return "btn magenta";
  if (color === "yellow") return "btn yellow";
  return "btn";
}

export default function GameCard({ game }: { game: Game }) {
  const tiltRef = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    // El reset de `prefers-reduced-motion` de globals.css solo alcanza a las
    // animaciones y transiciones CSS, no a este transform escrito desde JS.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = "";
  };

  return (
    <Link
      ref={tiltRef}
      href={`/games/${game.id}`}
      className="card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="cover">
        <div className={"cover-bg " + game.cover} />
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          {/* Adorno: el destino es la tarjeta entera, así que no puede ser un
              <button> anidado dentro del <a>. */}
          <span className={accentClass(game.color)}>JUGAR</span>
        </div>
      </div>
    </Link>
  );
}
