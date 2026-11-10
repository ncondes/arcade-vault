import type { Metadata } from "next";
import Link from "next/link";
import FeatureIcon from "@/app/components/FeatureIcon";
import FloatingSilhouettes from "@/app/components/FloatingSilhouettes";
import MiniCard from "@/app/components/MiniCard";
import RankingNotice from "@/app/components/RankingNotice";
import Reveal from "@/app/components/Reveal";
import { getGames } from "@/app/lib/data/games";
import { getRecentScores, getTopPlayers } from "@/app/lib/data/scores";
import { formatScore } from "@/app/lib/format";
import { FAQ, FEATURES, HOME_STATS } from "@/app/lib/home";
import type { HomeStat } from "@/app/lib/types";
export const metadata: Metadata = {
  // El `title.template` de `app/layout.tsx` no alcanza a la `page.tsx` de su
  // mismo segmento de ruta, así que aquí el título va compuesto a mano.
  title: { absolute: "Inicio · Arcade Vault" },
};
/** Distintivo de las tres primeras filas del top; el resto va sin clase. */
const TOP_RANK_CLASSES = [" top1", " top2", " top3"];
const FEATURED = 6;
const RECENT_LIMIT = 7;
const TOP_LIMIT = 5;
// Se renderiza en cada petición (spec 06). El catálogo lanza si falla (error.tsx);
// las dos listas de actividad devuelven `null` y solo degradan su tarjeta.
export default async function Home() {
  const [games, recent, top] = await Promise.all([
    getGames(),
    getRecentScores(RECENT_LIMIT),
    getTopPlayers(TOP_LIMIT),
  ]);
  const titles = new Map(games.map((g) => [g.id, g.title]));
  const stats: HomeStat[] = [
    { value: `${games.length}+`, unit: "JUEGOS", note: "Y CONTANDO" },
    ...HOME_STATS,
  ];
  // La barra del top es proporcional a la marca del #01.
  const topBest = top?.[0]?.score ?? 0;
  return (
    <div className="home fade-in">
      {/* Sin JavaScript el observador de `Reveal` no llega a correr y todo lo
          que va bajo el hero se quedaría en `opacity: 0`. El contenido sí está
          en el HTML, así que el fallo no lo detecta la compilación: solo se ve
          en el navegador. */}
      <noscript>
        <style>{`.reveal { opacity: 1; transform: none; }`}</style>
      </noscript>
      {/* HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link className="btn xl pulse" href="/games">
              ▶ EXPLORAR JUEGOS
            </Link>
            <Link className="btn xl magenta" href="/login?tab=registro">
              ✦ CREAR CUENTA
            </Link>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>
      {/* 01 — POR QUÉ */}
      <Reveal className="home-section">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">{"// 01"}</div>
          <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
          <div className="section-rule" />
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.icon} className={"feature-card " + f.accent}>
              <FeatureIcon kind={f.icon} />
              <div className="ft-title pixel">{f.title}</div>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </Reveal>
      {/* 02 — JUEGOS */}
      <Reveal className="home-section">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">{"// 02"}</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule" />
        </div>
        <div className="mini-rail">
          {games.slice(0, FEATURED).map((g) => (
            <MiniCard key={g.id} game={g} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link className="btn lg" href="/games">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </Reveal>
      {/* STATS */}
      <Reveal className="home-stats">
        <div className="stats-inner">
          {stats.map((st) => (
            <div key={st.unit} className="stat-block">
              <div className="stat-n neon-yellow">{st.value}</div>
              <div className="stat-u pixel">{st.unit}</div>
              <div className="stat-s">{st.note}</div>
            </div>
          ))}
        </div>
      </Reveal>
      {/* 03 — ACTIVIDAD */}
      <Reveal className="home-section">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">{"// 03"}</div>
          <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
          <div className="section-rule" />
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              <RankingNotice rows={recent} />
              {recent?.map((r, i) => (
                <div
                  key={`${i}-${r.player}-${r.gameId}`}
                  className="tick-row"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className={"tk-p neon-" + r.accent}>{r.player}</span>
                  {/* El título sale del catálogo: si mañana se renombra un juego,
                      el ticker se entera. */}
                  <span className="tk-mid">▸ {titles.get(r.gameId) ?? r.gameId}</span>
                  <span className="tk-s">+{formatScore(r.score)}</span>
                  <span className="tk-t">{r.ago}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES</div>
              <Link className="lb-link" href="/hall-of-fame">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              <RankingNotice rows={top} />
              {top?.map((p, i) => (
                <div key={p.player} className={"top-row" + (TOP_RANK_CLASSES[i] ?? "")}>
                  <span className="tp-rk">#{String(i + 1).padStart(2, "0")}</span>
                  <span className="tp-bar">
                    <span
                      className="tp-fill"
                      style={{ width: `${topBest > 0 ? (p.score / topBest) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="tp-p">{p.player}</span>
                  <span className="tp-s">{formatScore(p.score)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
      {/* 04 — PRECIOS */}
      <Reveal className="home-section">
        <div className="section-head">
          <div className="kicker pixel neon-green">{"// 04"}</div>
          <h2 className="section-title">PRECIOS</h2>
          <div className="section-rule" />
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              <li>✔ Acceso a todos los juegos</li>
              <li>✔ Ranking global y salón de la fama</li>
              <li>✔ Sin anuncios entre partidas</li>
              <li>✔ Guarda tus puntuaciones</li>
              <li>✔ Nuevos juegos cada mes</li>
              <li>✔ Funciona en cualquier navegador</li>
            </ul>
            <Link className="btn xl pulse" href="/login?tab=registro" style={{ width: "100%" }}>
              EMPEZAR GRATIS →
            </Link>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel">
              FREE
              <br />
              PLAY
            </div>
          </div>
          <div className="pricing-faq">
            {FAQ.map((item) => (
              <div key={item.q} className="faq-item">
                <div className="faq-q pixel">{item.q}</div>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      {/* CTA FINAL */}
      <Reveal className="home-final">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link className="btn xl pulse final-cta" href="/games">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </Reveal>
    </div>
  );
}
