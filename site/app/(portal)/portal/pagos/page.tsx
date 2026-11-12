import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { Form } from "~/components/Form";
import { initials } from "~/components/Shell";
import { recordPayment, voidPayment } from "~/payment-actions";
import { canHandlePayments, homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { daysBetween } from "~/lib/clients";
import { dateOf, days, monthYear, shortDate, timeOf, todayISO } from "~/lib/format";
import { lastMpError, mpStatus } from "~/lib/mercadopago";
import { IN_PERSON, METHOD_LABEL, METHODS, money, MP_IN_PROCESS, PASS_DUE_DAYS, PASS_LABEL, passStatus, type PassStatus } from "~/lib/payments";
import { listPayments, payablePasses, planPrice, totalsSince, type PaymentRow } from "~/lib/payments-data";

export const metadata: Metadata = { title: "Pagos" };

const PASS_CHIP: Record<PassStatus, string> = {
  "al-dia": "chip",
  "por-vencer": "chip chip--due",
  vencido: "chip chip--warn",
  "sin-fecha": "chip chip--quiet",
};

function left(expires: string, today: string) {
  const n = daysBetween(today, expires);
  return n > 0 ? `En ${days(n)}` : n === 0 ? "Vence hoy" : `Hace ${days(-n)}`;
}

/** Un pago que no está aprobado: anulado, o de Mercado Pago en proceso o para revisar. */
function pendingLabel(p: PaymentRow) {
  if (p.status === "cancelled") return { text: "Anulado", chip: "chip chip--quiet" };
  if (p.status === "pending") return MP_IN_PROCESS.includes(p.mp_status ?? "") ? { text: "En proceso", chip: "chip chip--due" } : { text: "Revisar en Mercado Pago", chip: "chip chip--warn" };
  return null;
}

/** Los pagos del pase Premium: el admin y recepción los ven y cargan los del local; Mercado Pago lo paga el cliente. */
export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const viewer = await requireViewer();
  if (!canHandlePayments(viewer)) redirect(homeOf(viewer));
  const admin = viewer.scopes.includes("admin");
  const sp = await searchParams;
  const today = todayISO();
  const [passes, payments, totals] = await Promise.all([payablePasses(), listPayments(), totalsSince(`${today.slice(0, 7)}-01`)]);
  const price = planPrice("Premium");
  const preselect = passes.some((p) => String(p.id) === sp.cliente) ? sp.cliente : "";
  // Al admin, si Mercado Pago acepta el token (le pregunta de quién es la cuenta) y el último error, si hubo.
  const mp = admin ? await mpStatus() : null;
  const lastError = mp?.state === "ok" ? lastMpError() : null;

  const by: Record<PassStatus, number> = { "al-dia": 0, "por-vencer": 0, vencido: 0, "sin-fecha": 0 };
  for (const p of passes) by[passStatus(p.pass_expires, today)]++;
  // Lo cobrado este mes, en pesos (el precio de Premium es en pesos), por medio de pago.
  const ars = totals.filter((t) => t.currency === "ARS");
  const total = ars.reduce((s, t) => s + t.total, 0);
  const perMethod = METHODS.map((m) => ({ m, total: ars.find((t) => t.method === m)?.total ?? 0 })).filter((x) => x.total);

  return (
    <AdminShell viewer={viewer}>
      <PageHead
        title="Pagos"
        accent="Premium"
        sub="El pase de los clientes Premium. Lo pagan con Mercado Pago desde su perfil, cuando quieran, o acá, en efectivo o con tarjeta. Cada pago lo extiende un mes."
      >
        <a className="btn btn--gold btn--sm" href="#registrar">
          Registrar pago
        </a>
      </PageHead>

      {admin && mp?.state === "error" && (
        <div className="card notice" data-reveal>
          <p className="strong">
            <span className="chip chip--warn">{mp.status === 401 || mp.status === 403 ? "Token rechazado" : "Sin conexión"}</span>{" "}
            {mp.status === 401 || mp.status === 403 ? "Mercado Pago no acepta el access token" : "Mercado Pago no respondió"}
          </p>
          <p className="muted">
            Respuesta: {mp.status ? `${mp.status} · ` : ""}
            {mp.message}. El token cargado en Railway (MP_ACCESS_TOKEN) es <span className="mono">{mp.hint}</span>. Un access token
            completo mide unos 70 caracteres: copialo con el botón de copiar en Mercado Pago → Tus integraciones → Credenciales de
            producción, pegalo en Railway y aplicá el cambio. Mientras tanto los clientes ven el botón, pero no pueden pagar.
          </p>
        </div>
      )}
      {admin && mp?.state === "ok" && (
        <div className="card notice" data-reveal>
          <p className="strong">
            <span className="st-dot st--al-dia" aria-hidden="true" /> Mercado Pago conectado: cuenta {mp.account.nickname}
            {mp.account.email ? ` (${mp.account.email})` : ""}
          </p>
          <p className="muted">
            Token <span className="mono">{mp.hint}</span>.
            {lastError && !lastError.what.includes("/users/me") && (
              <>
                {" "}
                Último error: {shortDate(dateOf(lastError.at))} {timeOf(lastError.at)} h, {lastError.what} →{" "}
                {lastError.status ? `${lastError.status} · ` : ""}
                {lastError.message}.
              </>
            )}
          </p>
        </div>
      )}
      {mp?.state === "missing" && (
        <div className="card notice" data-reveal>
          <p className="strong">Mercado Pago no está conectado</p>
          <p className="muted">
            Falta el access token de la cuenta de Mercado Pago (MP_ACCESS_TOKEN, en las variables de Railway). Mientras tanto los clientes no ven el
            botón de pagar: los pagos se cargan acá.
          </p>
        </div>
      )}

      <div className="kpis kpis--4" data-reveal-stagger>
        <section className="card kpi">
          <p className="label">Clientes Premium</p>
          <p className="kpi__sub">Activos</p>
          <p className="kpi__big">
            <span data-count={passes.length}>{passes.length}</span>
          </p>
          <p className="kpi__foot">{by["al-dia"]} con el pase al día</p>
        </section>
        <section className="card kpi">
          <p className="label">Por vencer</p>
          <p className="kpi__sub">En {PASS_DUE_DAYS} días o menos</p>
          <p className="kpi__big">
            <span data-count={by["por-vencer"]}>{by["por-vencer"]}</span>
          </p>
          <p className="kpi__foot">Lo ven en su perfil, con el botón de pagar</p>
        </section>
        <section className="card kpi">
          <p className="label">Vencidos</p>
          <p className="kpi__sub">El pase ya pasó</p>
          <p className="kpi__big">
            <span data-count={by.vencido}>{by.vencido}</span>
          </p>
          <p className="kpi__foot">{by["sin-fecha"] ? `${by["sin-fecha"]} sin vencimiento cargado` : "Todos tienen vencimiento"}</p>
        </section>
        <section className="card kpi">
          <p className="label">Cobrado</p>
          <p className="kpi__sub">En {monthYear(today)}</p>
          <p className="kpi__big kpi__big--money">{money(total)}</p>
          <p className="kpi__foot">{perMethod.length ? perMethod.map((x) => `${METHOD_LABEL[x.m].es}: ${money(x.total)}`).join(" · ") : "Todavía nada este mes"}</p>
        </section>
      </div>

      <section id="registrar" className="anchor">
        <h2 className="section-title">Registrar un pago en el local</h2>
        {passes.length === 0 ? (
          <div className="card empty">
            <p className="fact">No hay clientes Premium activos</p>
            <p className="muted">El plan se elige en la ficha de cada cliente.</p>
          </div>
        ) : (
          <Form action={recordPayment} submit="Registrar pago" reset className="card form">
            <div className="fields">
              <label className="field field--wide">
                <span className="field__label">Cliente</span>
                <select name="client_id" defaultValue={preselect} required>
                  <option value="">Elegí un cliente</option>
                  {passes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.pass_expires ? `vence el ${shortDate(p.pass_expires)}` : "sin vencimiento"}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="choice field--wide">
                <legend className="field__label">Cómo pagó</legend>
                <div className="choice__grid">
                  {IN_PERSON.map((m) => (
                    <label key={m} className="choice__card">
                      <input type="radio" name="method" value={m} defaultChecked={m === "cash"} />
                      <span className="strong">{METHOD_LABEL[m].es}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="field">
                <span className="field__label">Monto</span>
                <input name="amount" type="number" min={1} step="0.01" inputMode="decimal" defaultValue={price?.amount} required />
                {price && <span className="field__hint">El mes de {price.name}: {money(price.amount, price.currency)}.</span>}
              </label>
              <label className="field">
                <span className="field__label">Nota (opcional)</span>
                <input name="note" maxLength={300} placeholder="Comprobante, descuento…" autoComplete="off" />
              </label>
            </div>
            <p className="field__hint">Extiende el pase un mes: desde el vencimiento si todavía no pasó, o desde hoy si ya venció.</p>
          </Form>
        )}
      </section>

      {passes.length > 0 && (
        <section className="anchor">
          <h2 className="section-title">Pases Premium</h2>
          <div className="card table-wrap" data-reveal>
            <table className="table table--cards">
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Vence</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Último pago</th>
                  <th scope="col" className="right">
                    <span className="sr-only">Cobrar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {passes.map((p) => {
                  const st = passStatus(p.pass_expires, today);
                  const person = (
                    <>
                      {p.photo_url ? (
                        <img className="person__img" src={p.photo_url} alt="" />
                      ) : (
                        <span className="avatar avatar--sm" aria-hidden="true">
                          {initials(p.name)}
                        </span>
                      )}
                      <span>
                        <span className="strong">{p.name}</span>
                        <span className="person__sub">{p.email ?? "sin correo"}</span>
                      </span>
                    </>
                  );
                  return (
                    <tr key={p.id}>
                      <td data-label="Cliente">
                        {/* Recepción no abre fichas: ve el nombre, nada más. */}
                        {admin ? (
                          <Link className="person" href={`/portal/clientes/${p.id}`}>
                            {person}
                          </Link>
                        ) : (
                          <span className="person">{person}</span>
                        )}
                      </td>
                      <td data-label="Vence">
                        {p.pass_expires ? (
                          <>
                            <span className="mono">{shortDate(p.pass_expires)}</span>
                            <span className="person__sub">{left(p.pass_expires, today)}</span>
                          </>
                        ) : (
                          <span className="muted">Sin cargar</span>
                        )}
                      </td>
                      <td data-label="Estado">
                        <span className={PASS_CHIP[st]}>{PASS_LABEL[st]}</span>
                      </td>
                      <td data-label="Último pago">
                        {p.last_paid_at && p.last_method ? (
                          <>
                            <span className="mono">{shortDate(dateOf(p.last_paid_at))}</span>
                            <span className="person__sub">{METHOD_LABEL[p.last_method].es}</span>
                          </>
                        ) : (
                          <span className="muted">Sin pagos en el portal</span>
                        )}
                      </td>
                      <td className="right actions">
                        <Link className="btn btn--ghost btn--sm" href={`/portal/pagos?cliente=${p.id}#registrar`}>
                          Cobrar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="anchor">
        <h2 className="section-title">Últimos pagos</h2>
        {payments.length === 0 ? (
          <div className="card empty">
            <p className="fact">Todavía no hay pagos</p>
            <p className="muted">Aparecen acá los de Mercado Pago y los que se carguen en el local.</p>
          </div>
        ) : (
          <div className="card table-wrap" data-reveal>
            <table className="table table--cards">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Medio</th>
                  <th scope="col" className="right">Monto</th>
                  <th scope="col">Pase</th>
                  <th scope="col">Cargó</th>
                  {admin && (
                    <th scope="col" className="right">
                      <span className="sr-only">Anular</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const tag = pendingLabel(p);
                  return (
                    <tr key={p.id} className={p.status === "cancelled" ? "is-off" : undefined}>
                      <td data-label="Fecha">
                        <span className="mono">{shortDate(dateOf(p.at))}</span>
                        <span className="person__sub mono">{timeOf(p.at)} h</span>
                      </td>
                      <td data-label="Cliente">
                        {admin ? <Link href={`/portal/clientes/${p.client_id}`}>{p.client_name}</Link> : p.client_name}
                      </td>
                      <td data-label="Medio">
                        <span>{METHOD_LABEL[p.method].es}</span>
                        {tag && (
                          <span className="person__sub">
                            <span className={tag.chip}>{tag.text}</span>
                          </span>
                        )}
                        {p.note && <span className="person__sub">{p.note}</span>}
                      </td>
                      <td data-label="Monto" className="right mono">
                        {money(p.amount, p.currency)}
                      </td>
                      <td data-label="Pase" className="mono">
                        {p.pass_after ? `${p.pass_before ? shortDate(p.pass_before) : "—"} → ${shortDate(p.pass_after)}` : "—"}
                      </td>
                      <td data-label="Cargó">{p.by_client ? <span className="muted">El cliente, desde el portal</span> : (p.created_by_name ?? "—")}</td>
                      {admin && (
                        <td className="right actions">
                          {p.status === "approved" && (
                            <Form
                              action={voidPayment}
                              submit="Anular"
                              button="link-sm"
                              className="inline-form"
                              confirm={`¿Anular el pago de ${p.client_name} del ${shortDate(dateOf(p.at))} (${money(p.amount, p.currency)})? El pase vuelve a como estaba.${p.method === "mercadopago" ? " La devolución del dinero se hace en Mercado Pago." : ""}`}
                            >
                              <input type="hidden" name="id" value={p.id} />
                            </Form>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
