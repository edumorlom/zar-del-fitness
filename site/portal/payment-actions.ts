"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { portalUrl } from "@/lib/content";
import { pick } from "@/lib/i18n";
import { canHandlePayments } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getClient } from "~/lib/data";
import { db } from "~/lib/db";
import { shortDate, todayISO } from "~/lib/format";
import { getLang } from "~/lib/lang";
import { createPreference, mpConfigured } from "~/lib/mercadopago";
import { canPayOnline, IN_PERSON, isPayable, METHOD_LABEL, type Method } from "~/lib/payments";
import { cancelPayment, planPrice, recordInPerson, setPreference, startMercadoPago } from "~/lib/payments-data";
import type { FormState } from "./actions";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** El portal en el dominio en que se está: Mercado Pago vuelve ahí. En desarrollo, localhost (sin https). */
async function portalBase() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  return /^(mi\.)?localhost(:\d+)?$/.test(host) ? `http://${host}/portal` : portalUrl;
}

// ---------- El cliente ----------

/** El cliente paga su pase con Mercado Pago: se lo manda a Checkout Pro y, al aprobarse, el pase se extiende solo. */
export async function payWithMercadoPago(): Promise<FormState> {
  const viewer = await requireViewer();
  const tr = pick(await getLang());
  const client = viewer.scopes.includes("user") ? await getClient(viewer.id) : null;
  if (!client || !canPayOnline(client, todayISO()))
    return { error: tr("Todavía no podés pagar desde el portal: se habilita cuando tu pase está por vencer.", "You can't pay from the portal yet: it opens when your pass is about to expire.") };
  const price = planPrice(client.plan);
  if (!price || !mpConfigured())
    return { error: tr("El pago con Mercado Pago no está disponible ahora. Podés pagar en el gimnasio.", "Paying with Mercado Pago isn't available right now. You can pay at the gym.") };

  const id = await startMercadoPago(client.id, client.plan!, price.amount, price.currency);
  const pref = await createPreference({
    reference: id,
    title: `${price.name} · 1 mes`,
    amount: price.amount,
    currency: price.currency,
    email: client.email,
    base: await portalBase(),
  });
  await setPreference(id, pref?.id ?? null);
  if (!pref) return { error: tr("Mercado Pago no respondió. Probá de nuevo en un rato.", "Mercado Pago didn't respond. Try again in a while.") };
  redirect(pref.init_point);
}

// ---------- El admin y recepción ----------

/** Un pago en el local, en efectivo o con tarjeta: extiende el pase un mes al guardarlo. */
export async function recordPayment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!canHandlePayments(viewer)) return { error: "No podés cargar pagos." };
  const clientId = Number(text(form, "client_id"));
  const method = text(form, "method") as Method;
  // <input type="number">: viene "450000" o "450000.5" (con coma, si alguien lo escribe a mano en otro campo).
  const raw = text(form, "amount").replace(",", ".");
  const amount = Number(raw);
  const note = text(form, "note").slice(0, 300) || null;

  if (!Number.isInteger(clientId) || clientId <= 0) return { error: "Elegí el cliente." };
  if (!(IN_PERSON as readonly string[]).includes(method)) return { error: "Elegí cómo pagó: efectivo o tarjeta." };
  if (!raw || !(amount > 0 && amount <= 100_000_000)) return { error: "Revisá el monto." };
  const { rows } = await db.query<{ name: string; plan: string | null; scopes: string[] }>("select name, plan, scopes from users where id = $1", [clientId]);
  const client = rows[0];
  if (!client || !client.scopes.includes("user")) return { error: "Ese cliente no existe." };
  if (!isPayable(client.plan)) return { error: "Por ahora los pagos son sólo del plan Premium." };

  const after = await recordInPerson({
    clientId,
    plan: client.plan,
    method,
    amount: Math.round(amount * 100) / 100,
    currency: planPrice(client.plan)?.currency ?? "ARS",
    note,
    by: viewer.id,
  });
  refresh();
  return { ok: `Pago de ${client.name} (${METHOD_LABEL[method].es.toLowerCase()}) cargado: el pase vence el ${shortDate(after)}.` };
}

/** Sólo el admin: un error de carga o un pago devuelto. El pase vuelve a como estaba, si no hubo otro pago después. */
export async function voidPayment(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("admin")) return { error: "Sólo el admin puede anular pagos." };
  const r = await cancelPayment(Number(form.get("id")), viewer.id);
  if (!r) return { error: "Ese pago ya no está aprobado." };
  refresh();
  const refund = r.method === "mercadopago" ? " Si hay que devolver el dinero, hacelo desde Mercado Pago." : "";
  return {
    ok: r.reverted
      ? `Pago anulado: el pase volvió a como estaba.${refund}`
      : `Pago anulado. El pase no se tocó porque después hubo otro pago: corregí el vencimiento en la ficha.${refund}`,
  };
}
