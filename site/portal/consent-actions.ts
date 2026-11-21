"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { canManage, homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { CONSENT_KINDS, getConsents, needsConsent, recordConsents, verifyUnsubscribe, type ConsentKind } from "~/lib/consent";
import { getClient } from "~/lib/data";
import type { FormState } from "~/lib/form";
import { getLang } from "~/lib/lang";
import { pick } from "@/lib/i18n";

const answersOf = (form: FormData) =>
  Object.fromEntries(CONSENT_KINDS.map((k) => [k, form.get(k) === "on"])) as Record<ConsentKind, boolean>;

/**
 * Lo que marca el cliente en /portal/mis-datos. Para usar el portal hacen falta los términos y el consentimiento de
 * salud; los demás son opcionales y se pueden cambiar cuando quiera. Si retira el de salud, queda guardado y el portal
 * le vuelve a pedir el consentimiento: sin él no se le pueden mostrar sus evaluaciones.
 */
export async function saveMyConsents(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const tr = pick(await getLang());
  if (!viewer.scopes.includes("user")) return { error: tr("Esta página es para los clientes.", "This page is for clients.") };
  const before = await getConsents(viewer.id);
  const answers = answersOf(form);
  const first = needsConsent(before);

  if (first && !answers.terminos)
    return { error: tr("Para usar el portal tenés que aceptar los términos y la privacidad.", "To use the portal you need to accept the terms and privacy policy.") };
  if (first && !answers.transferencia)
    return {
      error: tr(
        "Para usar el portal necesitamos tu consentimiento para guardar tus datos en nuestros proveedores del exterior.",
        "To use the portal we need your consent to store your data with our providers abroad."
      ),
    };
  if (first && !answers.salud && !before.salud)
    return {
      error: tr(
        "Sin el consentimiento de salud no podemos guardar tus evaluaciones. Si no querés darlo, escribinos y borramos tus datos de salud.",
        "Without health consent we can't store your evaluations. If you don't want to give it, write to us and we'll delete your health data."
      ),
    };

  // Los términos no se "desaceptan": una vez aceptada la versión vigente, la casilla no se manda.
  if (!first && !form.has("terminos")) delete (answers as Partial<typeof answers>).terminos;
  await recordConsents(viewer.id, answers, "portal", viewer.id);
  refresh();
  if (first && answers.terminos && answers.transferencia && answers.salud) redirect(homeOf(viewer));
  if (!answers.salud)
    return {
      ok: tr(
        "Guardado. Retiraste el consentimiento de salud: tu coach ya no va a cargar evaluaciones. Si querés que borremos las que hay, escribinos.",
        "Saved. You withdrew your health consent: your coach won't record new evaluations. If you want us to delete the existing ones, write to us."
      ),
    };
  return { ok: tr("Guardado.", "Saved.") };
}

/**
 * El equipo carga lo que el cliente firmó en papel en el gimnasio (o lo que dijo que retira). Queda con el nombre de
 * quien lo cargó. El admin, de cualquier cliente; el coach, de los suyos.
 */
export async function saveClientConsents(clientId: number, _: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const client = await getClient(clientId);
  if (!client || !canManage(viewer, client)) return { error: "No podés cargar los permisos de este cliente." };
  const answers: Partial<Record<ConsentKind, boolean>> = answersOf(form);
  // Una casilla sin tildar es un "no" sólo si antes había dicho que sí (lo retira): si nunca respondió, no se carga nada.
  // Si no, guardar el de salud dejaría a todos sin promociones, por ejemplo.
  const current = await getConsents(clientId);
  for (const k of CONSENT_KINDS) if (!answers[k] && !current[k]) delete answers[k];
  const n = await recordConsents(clientId, answers, "equipo", viewer.id);
  refresh();
  return { ok: n ? `Guardado: ${n} ${n === 1 ? "cambio" : "cambios"}.` : "No había nada que cambiar." };
}

/** El link de baja de los correos de promociones (/portal/correos), sin iniciar sesión: con la firma del link. */
export async function unsubscribe(userId: number, token: string): Promise<FormState> {
  if (!verifyUnsubscribe(userId, token)) return { error: "Este link no es válido. / This link is not valid." };
  await recordConsents(userId, { marketing: false }, "portal", userId);
  return { ok: "Listo: no te vamos a mandar más promociones. / Done: we won't send you any more offers." };
}
