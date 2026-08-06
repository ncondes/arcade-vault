"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { sendContactMessage, type ContactState } from "@/app/actions/contact";

const INICIAL: ContactState = { status: "idle" };

const CAMPOS = ["name", "email", "message"] as const;

/**
 * Formulario de contacto de `/about`. Es el único componente de cliente de esta
 * pantalla: el hero, la misión y los datos se quedan en el servidor.
 *
 * Los inputs son NO controlados, en contra de la plantilla, que los tiene con
 * `useState`. Con JavaScript el DOM conserva lo escrito durante el re-render;
 * sin JavaScript lo repuebla el `values` que devuelve la acción. La versión
 * controlada solo funciona en el primer caso.
 */
export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    INICIAL,
  );
  const [shake, setShake] = useState(false);
  // Tras `sent` o `failed`, la terminal sustituye al formulario. Estos botones
  // lo devuelven sin que el estado del servidor tenga que cambiar.
  const [reabierto, setReabierto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [estadoVisto, setEstadoVisto] = useState(state);

  // El reabierto se cancela cuando llega un estado NUEVO del servidor, no al
  // pulsar enviar. Si se cancelase al enviar, durante el `pending` —que conserva
  // el estado anterior— reaparecería la terminal vieja y `▶ ENVIANDO…` no se
  // vería nunca al reenviar. `useActionState` siempre devuelve un objeto nuevo,
  // así que comparar por identidad basta.
  //
  // Ajustar el estado durante el render es el patrón que documenta React para
  // esto; un `useEffect` correría tras pintar y dejaría ver un fotograma del
  // formulario antes de la terminal.
  if (estadoVisto !== state) {
    setEstadoVisto(state);
    setReabierto(false);
  }

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  // Guarda de campos vacíos. Se queda en el cliente: ir al servidor para sacudir
  // un formulario vacío añade cientos de ms a un aviso que debe ser instantáneo.
  // `preventDefault` cancela también la Server Action, no solo el envío nativo.
  const alEnviar = (e: React.FormEvent<HTMLFormElement>) => {
    const datos = new FormData(e.currentTarget);
    const hayVacios = CAMPOS.some((k) => !String(datos.get(k) ?? "").trim());

    if (hayVacios) {
      e.preventDefault();
      setShake(true);
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setShake(false), 400);
    }
  };

  const enTerminal =
    !reabierto && (state.status === "sent" || state.status === "failed");

  // Repuebla los campos cuando el navegador recargó sin JavaScript, y tras
  // REINTENTAR, que sí los desmonta.
  const valores =
    state.status === "invalid" || state.status === "failed"
      ? state.values
      : undefined;

  return (
    <form
      className={shake ? "contact-form shake" : "contact-form"}
      action={formAction}
      onSubmit={alEnviar}
      // La validación nativa del navegador se apaga a propósito: con ella, un
      // correo mal escrito nunca llegaría al servidor y `CORREO NO VÁLIDO` no
      // se vería nunca. `type="email"` se mantiene por el teclado del móvil.
      noValidate
    >
      {enTerminal ? (
        state.status === "sent" ? (
          <div className="terminal-success" role="status" aria-live="polite">
            <div className="term-bar">
              <span className="dot r" />
              <span className="dot y" />
              <span className="dot g" />
              <span className="term-title">VAULT-OS // TERMINAL</span>
            </div>
            <div className="term-body">
              <div className="line">
                <span className="prompt">vault@arcade:~$</span> ./send_message
                --to=team
              </div>
              <div className="line dim">[OK] Conectando con servidor…</div>
              <div className="line dim">[OK] Validando contenido…</div>
              <div className="line dim">[OK] Transmitiendo paquete…</div>
              <div className="line success">
                &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
                {state.name.toUpperCase()}.<span className="caret">_</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setReabierto(true)}
                >
                  ENVIAR OTRO MENSAJE
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="terminal-success fail" role="alert">
            <div className="term-bar">
              <span className="dot r" />
              <span className="dot y" />
              <span className="dot g" />
              <span className="term-title">VAULT-OS // TERMINAL</span>
            </div>
            <div className="term-body">
              <div className="line">
                <span className="prompt">vault@arcade:~$</span> ./send_message
                --to=team
              </div>
              {/* Esta línea sí es cierta: el mensaje pasó la validación antes
                  de intentar enviarse. No se inventan más pasos correctos. */}
              <div className="line dim">[OK] Validando contenido…</div>
              <div className="line fail">
                [FAIL] No se pudo entregar el mensaje.
              </div>
              <div className="line success fail">
                &gt; EL MENSAJE NO SALIÓ. VUELVE A INTENTARLO EN UN MOMENTO.
                <span className="caret">_</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setReabierto(true)}
                >
                  REINTENTAR
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              defaultValue={valores?.name}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              defaultValue={valores?.email}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">MENSAJE</label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              defaultValue={valores?.message}
              placeholder="Cuéntanos qué tienes en mente…"
            />
          </div>

          {/* Honeypot. Ningún humano lo ve ni lo alcanza con el tabulador; si
              llega relleno, el servidor responde éxito sin enviar nada. Va
              fuera de pantalla en vez de con `display: none`, que algunos bots
              detectan. `.contact-form` es `position: relative`. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            <label htmlFor="contact-website">No rellenes este campo</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {state.status === "invalid" && (
            <p
              className="mono"
              role="alert"
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "var(--magenta)",
              }}
            >
              {state.message}
            </p>
          )}

          <button
            className="btn xl press"
            type="submit"
            style={{ width: "100%" }}
            disabled={pending}
          >
            {pending ? "▶ ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}
    </form>
  );
}
