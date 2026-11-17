import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { portalUrl } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { legalVersion } from "@/lib/legal";
import { db } from "./db";
import type { Viewer } from "./auth";

// Los consentimientos de cada cliente (Ley 25.326): qué aceptó, cuándo, de qué versión de los términos y la privacidad
// (db/legal/) y si lo marcó él en el portal o lo cargó el equipo (firmado en papel en el gimnasio). Nunca se borra ni se
// cambia una fila: cada cambio es una fila nueva, y vale la última de cada tipo. Así queda la prueba de cuándo dio o
// retiró cada uno.

/**
 * - terminos: aceptó los términos y condiciones y leyó la política de privacidad.
 * - transferencia: que sus datos se guarden en proveedores de fuera de Argentina (Estados Unidos, que para la AAIP no
 *   tiene protección "adecuada"): consentimiento expreso y aparte (art. 12 de la Ley 25.326 y su Decreto 1558/2001).
 * - salud: consentimiento expreso para sus datos de salud (art. 7 de la Ley 25.326): ficha médica, medidas, fotos.
 * - huella: usar su huella dactilar para entrar al gimnasio (dato biométrico). Si no, se le da otra forma de entrar.
 * - imagen: usar sus fotos (antes y después) en el sitio y las redes (art. 53 del Código Civil y Comercial).
 * - marketing: recibir novedades y promociones por correo. Se puede dar de baja con el link de cada correo.
 */
export const CONSENT_KINDS = ["terminos", "transferencia", "salud", "huella", "imagen", "marketing"] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

/** Los que hacen falta para usar el portal: sin ellos, el cliente va a /portal/mis-datos antes que a cualquier otra página. */
export const REQUIRED_CONSENTS: ConsentKind[] = ["terminos", "transferencia", "salud"];

/** Qué dice cada casilla, en el idioma del cliente. El equipo ve los títulos en castellano (la ficha del cliente). */
export const CONSENT_TEXT: Record<ConsentKind, Record<Lang, { title: string; text: string }>> = {
  terminos: {
    es: {
      title: "Términos y privacidad",
      text: "Leí y acepto los Términos y condiciones y la Política de privacidad de Zar del Fitness.",
    },
    en: {
      title: "Terms and privacy",
      text: "I have read and accept the Zar del Fitness Terms and Conditions and Privacy Policy.",
    },
  },
  transferencia: {
    es: {
      title: "Mis datos en proveedores del exterior",
      text:
        "Consiento que mis datos, incluidos los de salud, se guarden en los proveedores que nombra la Política de privacidad, varios en Estados Unidos, un país que para la Argentina no tiene un nivel de protección adecuado.",
    },
    en: {
      title: "My data with providers abroad",
      text:
        "I consent to my data, including health data, being stored with the providers listed in the Privacy Policy, several of them in the United States, a country Argentina doesn't consider to have an adequate level of protection.",
    },
  },
  salud: {
    es: {
      title: "Mis datos de salud",
      text:
        "Doy mi consentimiento expreso para que Zar del Fitness guarde y use mis datos de salud (declaración de aptitud física o certificado médico, patologías, medicación, medidas, peso, composición corporal y fotos de progreso) sólo para planificar y seguir mi entrenamiento. Los ven mi coach y el equipo a cargo. Puedo retirarlo cuando quiera.",
    },
    en: {
      title: "My health data",
      text:
        "I expressly consent to Zar del Fitness storing and using my health data (fitness declaration or medical certificate, conditions, medication, measurements, weight, body composition and progress photos) only to plan and track my training. Only my coach and the team in charge see it. I can withdraw this at any time.",
    },
  },
  huella: {
    es: {
      title: "Huella para entrar (opcional)",
      text: "Acepto usar mi huella dactilar para entrar al gimnasio. Si no, me dan otra forma de entrar. Se borra del lector cuando dejo de ser cliente.",
    },
    en: {
      title: "Fingerprint entry (optional)",
      text: "I agree to use my fingerprint to enter the gym. If I don't, I'll be given another way in. It is deleted from the reader when I stop being a client.",
    },
  },
  imagen: {
    es: {
      title: "Mis fotos en el sitio y las redes (opcional)",
      text:
        "Autorizo a Zar del Fitness a publicar mis fotos de antes y después, con mi cara y sin mi nombre completo, en su sitio, sus redes y sus publicidades, mientras no retire este permiso. Puedo retirarlo cuando quiera: dentro de los 7 días las sacan del sitio y de sus redes, y no las vuelven a usar.",
    },
    en: {
      title: "My photos on the website and social media (optional)",
      text:
        "I authorize Zar del Fitness to publish my before and after photos, showing my face but not my full name, on its website, social media and ads, until I withdraw this permission. I can withdraw it at any time: within 7 days they will be removed from the website and social media and not used again.",
    },
  },
  marketing: {
    es: { title: "Novedades por correo (opcional)", text: "Quiero recibir novedades, promociones y contenidos por correo. Me puedo dar de baja desde cualquier correo." },
    en: { title: "News by email (optional)", text: "I want to receive news, offers and content by email. I can unsubscribe from any email." },
  },
};

export type ConsentSource = "portal" | "equipo";
export type Consent = { granted: boolean; version: string; source: ConsentSource; at: string; recorded_by_name: string | null };
export type Consents = Record<ConsentKind, Consent | null>;

/** Lo último que dijo el cliente de cada tipo (null: nunca dijo nada). */
export async function getConsents(userId: number): Promise<Consents> {
  const { rows } = await db.query<Consent & { kind: ConsentKind }>(
    `select distinct on (c.kind) c.kind, c.granted, c.version, c.source, c.created_at::text as at, u.name as recorded_by_name
     from consents c left join users u on u.id = c.recorded_by
     where c.user_id = $1
     order by c.kind, c.created_at desc, c.id desc`,
    [userId]
  );
  const state = Object.fromEntries(CONSENT_KINDS.map((k) => [k, null])) as Consents;
  for (const { kind, ...rest } of rows) state[kind] = rest;
  return state;
}

/** Si le falta aceptar algo para usar el portal: los obligatorios, o los términos de la versión vigente. */
export const needsConsent = (state: Consents) =>
  REQUIRED_CONSENTS.some((k) => !state[k]?.granted) || state.terminos?.version !== legalVersion;

/**
 * Las páginas del cliente lo llaman primero: si le falta aceptar los términos vigentes o el consentimiento de salud, va a
 * /portal/mis-datos. Al equipo no le pide nada.
 */
export async function requireConsent(viewer: Viewer) {
  if (!viewer.scopes.includes("user")) return;
  if (needsConsent(await getConsents(viewer.id))) redirect("/portal/mis-datos");
}

/**
 * Guarda lo que cambió (una fila por tipo que cambió). Los términos, también si cambió la versión. Devuelve cuántos
 * tipos cambiaron.
 */
export async function recordConsents(
  userId: number,
  answers: Partial<Record<ConsentKind, boolean>>,
  source: ConsentSource,
  recordedBy: number
) {
  const current = await getConsents(userId);
  const changed = CONSENT_KINDS.filter((k) => {
    const v = answers[k];
    if (v === undefined) return false;
    const now = current[k];
    return !now || now.granted !== v || (k === "terminos" && v && now.version !== legalVersion);
  });
  if (!changed.length) return 0;
  await db.query(
    `insert into consents (user_id, kind, granted, version, source, recorded_by)
     select $1, k, g, $4, $5, $6 from unnest($2::text[], $3::boolean[]) as t(k, g)`,
    [userId, changed, changed.map((k) => answers[k]!), legalVersion, source, recordedBy]
  );
  return changed.length;
}

/**
 * Para los correos masivos: true si el cliente no quiere promociones (lo último que dijo de "marketing" es que no). Sin
 * respuesta, se le mandan (es cliente y cada correo trae cómo darse de baja: art. 27 de la Ley 25.326).
 */
export const NO_MARKETING_SQL = `coalesce((select c.granted from consents c where c.user_id = users.id and c.kind = 'marketing'
  order by c.created_at desc, c.id desc limit 1), true) = false`;

/** Cuántos clientes activos con correo se dieron de baja de las promociones (para el Broadcast). */
export async function countMarketingOptOuts() {
  const { rows } = await db.query<{ n: number }>(
    `select count(*)::int as n from users where 'user' = any(scopes) and active and email is not null and ${NO_MARKETING_SQL}`
  );
  return rows[0]?.n ?? 0;
}

// ---------- La baja de los correos de promociones, sin iniciar sesión ----------

// La clave de la firma del link: UNSUBSCRIBE_SECRET, o la de Clerk si no está (con otro prefijo, para que una firma de
// acá no sirva para otra cosa). Sin ninguna de las dos (desarrollo), los links no se firman y la página no da de baja.
const secret = () => process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "";

const sign = (userId: number) => createHmac("sha256", secret()).update(`baja-correos:${userId}`).digest("hex").slice(0, 32);

/** El link para darse de baja de las promociones, para el pie de cada correo masivo. */
export const unsubscribeUrl = (userId: number) => `${portalUrl}/correos?c=${userId}&t=${sign(userId)}`;

/** Si el link de baja es de verdad de ese cliente. */
export function verifyUnsubscribe(userId: number, token: string) {
  if (!secret() || !Number.isInteger(userId) || !/^[0-9a-f]{32}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(sign(userId)), Buffer.from(token));
}
