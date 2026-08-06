import Link from "next/link";
import type { Game } from "@/app/lib/types";

/**
 * Tarjeta compacta del carril `// 02` del home. En el mockup era un `<div>` con
 * `onClick`; aquí el destino es un enlace de verdad, así que se puede abrir en
 * otra pestaña y se alcanza con el teclado.
 */
export default function MiniCard({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} className="mini-card">
      <div className="mini-cover">
        <div className={"cover-bg " + game.cover} />
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </Link>
  );
}
