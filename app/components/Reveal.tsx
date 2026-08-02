"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Envuelve una sección del home y le añade la clase `in` cuando entra en
 * pantalla. El markup y los datos siguen renderizándose en el servidor: aquí
 * solo viaja al cliente el observador.
 *
 * Si el JavaScript no corre, el contenido está igualmente en el HTML pero
 * quedaría en `opacity: 0`; de eso se encarga el `<noscript>` de `app/page.tsx`.
 */
export default function Reveal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            // Una vez revelada, la sección ya no interesa: la animación es de
            // entrada, no de ida y vuelta.
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={className ? `${className} reveal` : "reveal"}>
      {children}
    </section>
  );
}
