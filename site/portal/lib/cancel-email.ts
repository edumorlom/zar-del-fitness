// Los correos del botón de arrepentimiento y del botón de baja (portal/cancel-actions.ts, Disp. 954/2025): a quien lo
// pidió, con el código de su pedido (la constancia: art. 10 ter de la Ley 24.240), y al gimnasio, con los datos.
import { esc, heading, heroRow, image, page, textRow } from "./email-layout.ts";

export type CancelKind = "arrepentimiento" | "baja";
export type CancelRequest = {
  kind: CancelKind;
  code: string;
  name: string;
  email: string;
  phone: string;
  dni: string;
  plan: string;
  purchasedOn: string;
  message: string;
  deleteData: boolean;
  lang: "es" | "en";
  /** "17/11/2026 14:32": cuándo llegó, en hora argentina. */
  at: string;
};

export const CANCEL_IMAGES = [image("hero", "broadcast-hero.jpg")];

const PREFIX: Record<CancelKind, string> = { arrepentimiento: "ARR", baja: "BAJ" };
// Sin 0/O ni 1/I/L, para que se pueda dictar por teléfono.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** "ARR-20261117-7F3KQ": el tipo, el día y cinco letras al azar. */
export function cancelCode(kind: CancelKind, day: string, random: (n: number) => number = (n) => Math.floor(Math.random() * n)) {
  const tail = Array.from({ length: 5 }, () => ALPHABET[random(ALPHABET.length)]).join("");
  return `${PREFIX[kind]}-${day.replace(/-/g, "")}-${tail}`;
}

const TITLE = {
  arrepentimiento: { es: "Recibimos tu arrepentimiento", en: "We got your withdrawal request" },
  baja: { es: "Recibimos tu baja", en: "We got your cancellation" },
};

/** El correo a quien lo pidió: el código y qué pasa ahora. */
export function renderCancelReceipt(r: CancelRequest) {
  const en = r.lang === "en";
  const title = TITLE[r.kind][r.lang];
  const what =
    r.kind === "arrepentimiento"
      ? en
        ? "We'll refund everything you paid, through the same payment method, at no cost to you."
        : "Te devolvemos todo lo que pagaste, por el mismo medio de pago, sin costo para vos."
      : en
        ? "Your plan is cancelled as of this request: nothing else will be charged, with no notice period or fee."
        : "Tu plan queda dado de baja desde este pedido: no se te cobra nada más, sin preaviso ni cargo.";
  const rows =
    heroRow(`Zar del Fitness. ${esc(title)}`) +
    textRow(heading(esc(title)), 32) +
    textRow(en ? `Hi, ${esc(r.name)}.` : `Hola, ${esc(r.name)}.`) +
    textRow(
      en
        ? `Your request code is <strong style="color:#e7c152">${r.code}</strong>. Keep this email: it is your receipt (received on ${esc(r.at)}, Argentina time).`
        : `El código de tu pedido es <strong style="color:#e7c152">${r.code}</strong>. Guardá este correo: es tu constancia (recibido el ${esc(r.at)}, hora argentina).`,
      16
    ) +
    textRow(esc(what), 16) +
    (r.deleteData
      ? textRow(
          esc(
            en
              ? "You also asked us to delete your personal data: we'll do it within 5 business days, except what the law requires us to keep (such as invoices)."
              : "También pediste que borremos tus datos personales: lo hacemos dentro de los 5 días hábiles, salvo lo que la ley nos obliga a guardar (como las facturas)."
          ),
          16
        )
      : "") +
    textRow(
      esc(en ? "We'll message you within 24 hours to complete it. Any questions, reply to us on WhatsApp." : "Te escribimos dentro de las 24 horas para terminar el trámite. Ante cualquier duda, escribinos por WhatsApp."),
      16
    );
  return {
    subject: `${title} · ${r.code}`,
    html: page({ title: esc(title), preheader: esc(`${r.code}. ${what}`), rows, help: en ? "Questions? Message us on WhatsApp." : "¿Dudas? Escribinos por WhatsApp." }),
  };
}

/** El aviso al gimnasio: todos los datos, para responder dentro de las 24 horas. */
export function renderCancelNotice(r: CancelRequest) {
  const kind = r.kind === "arrepentimiento" ? "Botón de arrepentimiento" : "Botón de baja de servicio";
  const line = (label: string, value: string) => (value ? `<strong>${label}:</strong> ${esc(value)}<br>` : "");
  const rows =
    textRow(heading(esc(`${kind}: ${r.code}`)), 40) +
    textRow(
      line("Nombre", r.name) +
        line("Correo", r.email) +
        line("Teléfono", r.phone) +
        line("DNI", r.dni) +
        line("Plan", r.plan) +
        line("Contratado el", r.purchasedOn) +
        line("Comentario", r.message) +
        line("Borrar sus datos", r.deleteData ? "sí" : "") +
        line("Recibido", `${r.at} (hora argentina)`) +
        line("Idioma", r.lang === "en" ? "inglés" : "castellano"),
      16
    ) +
    textRow(
      esc(
        r.kind === "arrepentimiento"
          ? "Hay que devolverle todo lo que pagó, por el mismo medio de pago (Ley 24.240, art. 34; CCyC, arts. 1110 a 1116). Ya le llegó el código."
          : "La baja corre desde ahora: no se le cobra nada más (Ley 24.240, arts. 10 ter y 10 quater). Ya le llegó el código, que es su constancia."
      ),
      16
    );
  return { subject: `${kind} · ${r.code} · ${r.name}`, html: page({ title: esc(kind), preheader: esc(`${r.name}, ${r.plan || "sin plan"}`), rows }) };
}
