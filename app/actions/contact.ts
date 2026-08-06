"use server";

import { Resend } from "resend";

/**
 * Envío del formulario de contacto de `/about`.
 *
 * Es Server Action y no Route Handler a propósito: el formulario funciona sin
 * JavaScript y no queda un `POST /api/contact` público que cualquiera pueda
 * golpear. La directiva `"use server"` convierte cada export en una frontera de
 * red, así que la clave nunca puede acabar en el bundle del navegador.
 */

export type ContactValues = { name: string; email: string; message: string };

export type ContactState =
  | { status: "idle" }
  | { status: "sent"; name: string }
  | { status: "invalid"; message: string; values: ContactValues }
  | { status: "failed"; values: ContactValues };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sin tope, el tamaño del `POST` lo decide quien lo envía. */
const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

/** `formData.get` devuelve `File | string | null`; aquí solo interesan cadenas. */
function field(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Lo tecleado, sin recortar: si algo falla vuelve tal cual al formulario para
  // que el visitante no pierda nada, incluso si el navegador recargó sin JS.
  const values: ContactValues = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    message: field(formData, "message"),
  };

  // 1) Honeypot. Un campo que ningún humano ve ni alcanza con el tabulador: si
  // llega relleno, es un bot. Se responde éxito y no se envía nada, porque
  // devolver un error le enseñaría al bot que ha sido detectado.
  if (field(formData, "website").trim() !== "") {
    return { status: "sent", name: values.name.trim() };
  }

  // 2) Validación. El cliente ya avisa de los campos vacíos, pero esa
  // comprobación es comodidad: esta es la única que cuenta.
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (name.length === 0 || name.length > MAX_NAME) {
    return { status: "invalid", message: "EL NOMBRE ES OBLIGATORIO", values };
  }
  if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL) {
    return { status: "invalid", message: "CORREO NO VÁLIDO", values };
  }
  if (message.length === 0 || message.length > MAX_MESSAGE) {
    return { status: "invalid", message: "EL MENSAJE ES OBLIGATORIO", values };
  }

  // 3) Entorno. Se lee aquí y no al importar el módulo: validar el entorno al
  // importar tumbaría toda la aplicación —incluidas las seis pantallas que no
  // envían nada— por una configuración que solo hace falta al pulsar el botón.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    const faltan = [!apiKey && "RESEND_API_KEY", !to && "CONTACT_TO_EMAIL"]
      .filter(Boolean)
      .join(", ");
    console.error(`[contact] Falta configuración en el entorno: ${faltan}`);
    return { status: "failed", values };
  }

  // 4) Envío. Texto plano: es un correo interno para una persona, no una
  // campaña. `replyTo` es lo que hace que responder desde la bandeja llegue al
  // visitante y no a onboarding@resend.dev.
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: "Arcade Vault <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      text: `${name} <${email}>\n\n${message}`,
    });

    if (error) {
      // El motivo real se queda en el servidor. Al navegador solo llega el
      // estado: un mensaje de proveedor puede nombrar la clave, el dominio o el
      // destinatario. Este log es lo único que distingue un 403 de un 401.
      console.error("[contact] Resend rechazó el envío:", error);
      return { status: "failed", values };
    }
  } catch (cause) {
    console.error("[contact] Excepción al enviar:", cause);
    return { status: "failed", values };
  }

  return { status: "sent", name };
}
