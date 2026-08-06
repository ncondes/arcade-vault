import type { Metadata } from "next";
import ContactForm from "@/app/components/ContactForm";
import HighlightIcon from "@/app/components/HighlightIcon";
import Reveal from "@/app/components/Reveal";
import { CONTACT_TIPS, HIGHLIGHTS } from "@/app/lib/about";
import type { ContactTip } from "@/app/lib/types";

export const metadata: Metadata = {
  title: "Acerca de",
};

/**
 * El dato dice el color del punto; el CSS lo escribe con modificadores de una
 * letra. La traducción vive aquí y no en `about.ts`.
 */
const LED_CLASS: Record<ContactTip["led"], string> = {
  green: "tip-led",
  yellow: "tip-led y",
  magenta: "tip-led m",
};

export default function About() {
  return (
    <div className="about fade-in">
      {/* Sin JavaScript el observador de `Reveal` no llega a correr y tanto el
          divisor como la sección de contacto —el formulario incluido— se
          quedarían en `opacity: 0`. El contenido sí está en el HTML, así que el
          fallo no lo detecta la compilación: solo se ve en el navegador. */}
      <noscript>
        <style>{`.reveal { opacity: 1; transform: none; }`}</style>
      </noscript>

      {/* ACERCA DE */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra
          misión es preservar y celebrar los arcades que definieron una
          generación, haciéndolos accesibles para todos, en cualquier lugar y
          sin costo.
        </p>

        <div className="highlight-row">
          {HIGHLIGHTS.map((h) => (
            <div key={h.icon} className={`highlight ${h.accent}`}>
              <HighlightIcon kind={h.icon} />
              <div className="hl-text pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divisor decorativo: no aporta nada a quien no lo ve, de ahí
          `decorative`, que le pone `aria-hidden`. */}
      <Reveal className="about-divider" decorative>
        <div className="div-bar" />
        <div className="div-pixels">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="div-bar" />
      </Reveal>

      {/* CONTACTO */}
      <Reveal className="about-contact">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o
              simplemente quieres saludar? Escríbenos.
            </p>
            <div className="contact-tips">
              {CONTACT_TIPS.map((t) => (
                <div key={t.text} className="tip">
                  <span className={LED_CLASS[t.led]} />
                  {t.text}
                </div>
              ))}
            </div>
          </div>

          <ContactForm />
        </div>
      </Reveal>
    </div>
  );
}
