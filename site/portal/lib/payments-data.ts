import "server-only";
import type { PoolClient } from "pg";
import planes from "@db/planes.json";
import { db } from "./db";
import { todayISO } from "./format";
import { getPayment } from "./mercadopago";
import { extendPass, isPayable, MP_IN_PROCESS, MP_REVERSED, mpMatches, PAYABLE_PLANS, type Method } from "./payments";

// Los pagos en la base: acreditarlos (extender el pase), anularlos y listarlos. Las reglas están en payments.ts.
// Cada cambio bloquea la fila del pago y después la del cliente, siempre en ese orden: dos avisos de Mercado Pago al
// mismo tiempo, o un aviso y la vuelta del cliente al portal, no extienden el pase dos veces.

type PlanJson = { id: string; nombre: { es: string }; precios: { monto: number; moneda: string }[] };

/** El precio del pase de un plan que se paga desde el portal, de db/planes.json (el mismo que muestra el sitio). */
export function planPrice(plan: string | null) {
  if (!isPayable(plan)) return null;
  const p = (planes as PlanJson[]).find((x) => x.id === PAYABLE_PLANS[plan]);
  const price = p?.precios[0];
  return p && price ? { amount: price.monto, currency: price.moneda, name: p.nombre.es } : null;
}

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await db.connect();
  try {
    await c.query("begin");
    const value = await fn(c);
    await c.query("commit");
    return value;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}

/** Aprueba el pago y le extiende el pase al cliente un mes. Devuelve el vencimiento nuevo. */
async function credit(c: PoolClient, paymentId: number, clientId: number, mp: { id: string; status: string } | null = null) {
  const { rows } = await c.query<{ pass_expires: string | null }>("select pass_expires from users where id = $1 for update", [clientId]);
  const before = rows[0]?.pass_expires ?? null;
  const after = extendPass(before, todayISO());
  await c.query("update users set pass_expires = $2 where id = $1", [clientId, after]);
  await c.query(
    `update payments set status = 'approved', approved_at = now(), pass_before = $2, pass_after = $3,
            mp_payment_id = coalesce($4, mp_payment_id), mp_status = coalesce($5, mp_status)
     where id = $1`,
    [paymentId, before, after, mp?.id ?? null, mp?.status ?? null]
  );
  return after;
}

type Locked = { id: number; client_id: number; status: "pending" | "approved" | "cancelled"; amount: number; currency: string; plan: string; mp_payment_id: string | null; pass_before: string | null; pass_after: string | null };
const LOCKED = "id, client_id, status, amount, currency, plan, mp_payment_id, pass_before, pass_after";

/**
 * Anula un pago aprobado. Si el pase sigue en lo que dejó este pago, vuelve a como estaba; si después hubo otro pago,
 * no se toca (devuelve false) y el vencimiento se corrige a mano en la ficha.
 */
async function revert(c: PoolClient, p: Locked, by: number | null, mpStatus: string | null = null) {
  await c.query("update payments set status = 'cancelled', cancelled_by = $2, mp_status = coalesce($3, mp_status) where id = $1", [p.id, by, mpStatus]);
  const { rowCount } = await c.query("update users set pass_expires = $2 where id = $1 and pass_expires is not distinct from $3", [
    p.client_id,
    p.pass_before,
    p.pass_after,
  ]);
  return Boolean(rowCount);
}

/** Un pago en efectivo o con tarjeta en el local: ya cobrado, extiende el pase al guardarlo. */
export async function recordInPerson(r: { clientId: number; plan: string; method: Method; amount: number; currency: string; note: string | null; by: number }) {
  return tx(async (c) => {
    const { rows } = await c.query<{ id: number }>(
      `insert into payments (client_id, method, plan, amount, currency, note, created_by) values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [r.clientId, r.method, r.plan, r.amount, r.currency, r.note, r.by]
    );
    return credit(c, rows[0].id, r.clientId);
  });
}

/** El admin anula un pago aprobado (un error de carga, o un pago que se devolvió). */
export async function cancelPayment(id: number, by: number) {
  return tx(async (c) => {
    const { rows } = await c.query<Locked & { method: Method }>(`select ${LOCKED}, method from payments where id = $1 for update`, [id]);
    const p = rows[0];
    if (!p || p.status !== "approved") return null;
    return { method: p.method, reverted: await revert(c, p, by) };
  });
}

export type Settled =
  | { state: "error" | "unknown" }
  | { state: "approved"; clientId: number; passAfter: string | null }
  | { state: "pending" | "rejected" | "review" | "reversed"; clientId: number };

/**
 * Lo que dice Mercado Pago de un pago, aplicado a su fila (la de su external_reference). Lo llaman el aviso de Mercado
 * Pago y la vuelta del cliente al portal, en cualquier orden y cuantas veces sea: un pago aprobado se acredita una sola
 * vez; uno devuelto (refunded, charged_back) se anula. "error": no se pudo preguntar a Mercado Pago (que vuelva a avisar).
 */
export async function settleMercadoPago(mpId: string): Promise<Settled> {
  const p = await getPayment(mpId);
  if (!p) return { state: "error" };
  const ref = Number(p.external_reference);
  if (!Number.isSafeInteger(ref) || ref <= 0) return { state: "unknown" };
  const id = String(p.id);

  return tx(async (c): Promise<Settled> => {
    const { rows } = await c.query<Locked & { method: string }>(`select ${LOCKED}, method from payments where id = $1 for update`, [ref]);
    const row = rows[0];
    if (!row || row.method !== "mercadopago") return { state: "unknown" };
    const clientId = row.client_id;

    // ¿Este pago de Mercado Pago ya se acreditó? En su fila o, si pagó dos veces con el mismo link, en otra.
    const credited =
      row.mp_payment_id === id ? row : (await c.query<Locked>(`select ${LOCKED} from payments where mp_payment_id = $1 for update`, [id])).rows[0];
    if (credited) {
      if (credited.status === "approved" && MP_REVERSED.includes(p.status)) {
        await revert(c, credited, null, p.status);
        return { state: "reversed", clientId };
      }
      return credited.status === "approved" ? { state: "approved", clientId, passAfter: credited.pass_after } : { state: "reversed", clientId };
    }

    if (p.status !== "approved") {
      await c.query("update payments set mp_status = $2 where id = $1 and status = 'pending'", [row.id, p.status]);
      return { state: MP_IN_PROCESS.includes(p.status) ? "pending" : "rejected", clientId };
    }
    if (!mpMatches(p, row)) {
      console.error(`Mercado Pago: el pago ${id} no coincide con la fila ${row.id} (${p.transaction_amount} ${p.currency_id}): no se acredita.`);
      await c.query("update payments set mp_status = 'approved' where id = $1 and status = 'pending'", [row.id]);
      return { state: "review", clientId };
    }
    // Un segundo pago aprobado con el mismo link (la fila ya se usó): se cobró, así que va en una fila nueva.
    let target = row.id;
    if (row.status !== "pending") {
      const { rows: added } = await c.query<{ id: number }>(
        `insert into payments (client_id, method, plan, amount, currency, created_by) values ($1, 'mercadopago', $2, $3, $4, $1) returning id`,
        [clientId, row.plan, p.transaction_amount, p.currency_id]
      );
      target = added[0].id;
    }
    return { state: "approved", clientId, passAfter: await credit(c, target, clientId, { id, status: p.status }) };
  });
}

/** Una fila nueva para pagar con Mercado Pago: queda 'pending' hasta que Mercado Pago avisa que se aprobó. */
export async function startMercadoPago(clientId: number, plan: string, amount: number, currency: string) {
  const { rows } = await db.query<{ id: number }>(
    "insert into payments (client_id, method, plan, amount, currency, created_by) values ($1, 'mercadopago', $2, $3, $4, $1) returning id",
    [clientId, plan, amount, currency]
  );
  return rows[0].id;
}

export async function setPreference(id: number, preferenceId: string | null) {
  // Sin preferencia (Mercado Pago no respondió), la fila no sirve: se borra para que no quede un pago fantasma.
  if (preferenceId) await db.query("update payments set mp_preference_id = $2 where id = $1", [id, preferenceId]);
  else await db.query("delete from payments where id = $1 and status = 'pending'", [id]);
}

/** ¿Tiene un pago de Mercado Pago en proceso (un ticket sin pagar, una tarjeta en revisión)? */
export async function mpInProcess(clientId: number) {
  const { rowCount } = await db.query(
    "select 1 from payments where client_id = $1 and status = 'pending' and mp_status = any($2) and created_at > now() - interval '30 days'",
    [clientId, MP_IN_PROCESS]
  );
  return Boolean(rowCount);
}

export type PaymentRow = {
  id: number;
  client_id: number;
  client_name: string;
  method: Method;
  status: "pending" | "approved" | "cancelled";
  amount: number;
  currency: string;
  pass_before: string | null;
  pass_after: string | null;
  note: string | null;
  mp_status: string | null;
  at: Date;
  created_by_name: string | null;
  by_client: boolean;
};

/**
 * Los pagos, el último primero: los aprobados, los anulados y los de Mercado Pago que siguen en proceso o hay que
 * revisar. Los checkouts que el cliente abrió y no pagó no aparecen.
 */
export async function listPayments(limit = 100) {
  const { rows } = await db.query<PaymentRow>(
    `select p.id, p.client_id, u.name as client_name, p.method, p.status, p.amount, p.currency, p.pass_before, p.pass_after,
            p.note, p.mp_status, coalesce(p.approved_at, p.created_at) as at, b.name as created_by_name,
            p.created_by = p.client_id as by_client
     from payments p join users u on u.id = p.client_id left join users b on b.id = p.created_by
     where p.status <> 'pending' or p.mp_status = any($2) or p.mp_status = 'approved'
     order by coalesce(p.approved_at, p.created_at) desc, p.id desc limit $1`,
    [limit, MP_IN_PROCESS]
  );
  return rows;
}

export type PassRow = {
  id: number;
  name: string;
  email: string | null;
  photo_url: string | null;
  plan: string;
  pass_expires: string | null;
  last_paid_at: Date | null;
  last_method: Method | null;
};

/** Los clientes activos de los planes que se pagan desde el portal, con su último pago: los más urgentes primero. */
export async function payablePasses() {
  const { rows } = await db.query<PassRow>(
    `select u.id, u.name, u.email, u.photo_url, u.plan, u.pass_expires, lp.approved_at as last_paid_at, lp.method as last_method
     from users u
     left join lateral (select approved_at, method from payments where client_id = u.id and status = 'approved'
                        order by approved_at desc limit 1) lp on true
     where 'user' = any(u.scopes) and u.active and u.plan = any($1)
     order by u.pass_expires nulls first, u.name`,
    [Object.keys(PAYABLE_PLANS)]
  );
  return rows;
}

/** Lo cobrado desde un día ("AAAA-MM-DD", en hora argentina), por medio de pago. */
export async function totalsSince(day: string) {
  const { rows } = await db.query<{ method: Method; currency: string; total: number; n: number }>(
    `select method, currency, sum(amount)::numeric as total, count(*)::int as n from payments
     where status = 'approved' and (approved_at at time zone 'America/Argentina/Buenos_Aires')::date >= $1
     group by method, currency`,
    [day]
  );
  return rows;
}
