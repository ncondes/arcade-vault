"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  // La plantilla marcaba "biblioteca" también en las rutas de detalle y
  // reproductor; con rutas reales eso es todo lo que cuelga de /games.
  const isLibrary = pathname.startsWith("/games");
  const isHall = pathname === "/hall-of-fame";
  // No cuelga nada de /about, así que no hace falta `startsWith`.
  const isAbout = pathname === "/about";
  const isLogin = pathname === "/login";

  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="links">
          <Link href="/" className={isHome ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/games" className={isLibrary ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/hall-of-fame" className={isHall ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isAbout ? "active" : ""}>
            Acerca de
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        <Link href="/login" className="btn auth-btn">
          Iniciar Sesión
        </Link>

        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      />

      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={isHome ? "active" : ""} onClick={close}>
          Inicio
        </Link>
        <Link href="/games" className={isLibrary ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link
          href="/hall-of-fame"
          className={isHall ? "active" : ""}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link href="/about" className={isAbout ? "active" : ""} onClick={close}>
          Acerca de
        </Link>
        <Link href="/login" className={isLogin ? "active" : ""} onClick={close}>
          Iniciar Sesión
        </Link>
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
