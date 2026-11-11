import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCheckin, deleteCheckin, deleteClient, saveDiet } from "~/actions";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { ClientForm } from "~/components/ClientForm";
import { Evolution } from "~/components/Evolution";
import { Form } from "~/components/Form";
import { ProgressPhotos } from "~/components/ProgressPhotos";
import { initials } from "~/components/Shell";
import { canManage } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { CheckinFields } from "~/components/CheckinFields";
import { DietFields } from "~/components/Diet";
import { age, bmi, controlStatus, daysBetween, STATUS_LABEL } from "~/lib/clients";
import { getCheckins, getClient, getCoaches, getDiet, getProgressPhotos } from "~/lib/data";
import { days, num, shortDate, todayISO } from "~/lib/format";

export const metadata: Metadata = { title: "Cliente" };

const lean = (w: number, f: number) => w * (1 - f / 100);

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fact-item">
      <dt className="label">{label}</dt>
      <dd>{children ?? <span className="muted">—</span>}</dd>
    </div>
  );
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const client = await getClient(id);
  // Un cliente que no es suyo es, para el coach, un cliente que no existe.
  if (!client || !canManage(viewer, client)) notFound();
  const admin = viewer.scopes.includes("admin");
  const [checkins, coaches, photos, diet] = await Promise.all([getCheckins(id), admin ? getCoaches() : [], getProgressPhotos(id), getDiet(id)]);

  const today = todayISO();
  const last = checkins[checkins.length - 1];
  const lastDate = last?.date ?? client.legacy_last_checkin;
  const lastWeight = last?.weight_kg ?? client.legacy_last_weight;
  const st = controlStatus(lastDate, today);
  const passLeft = client.pass_expires ? daysBetween(today, client.pass_expires) : null;
  const years = age(client.birth_year, today);
  const index = bmi(lastWeight, client.height_cm);

  return (
    <AdminShell viewer={viewer}>
      <Link className="back" href="/portal/clientes">
        ← Clientes
      </Link>
      <PageHead
        title={client.name}
        sub={
          <span className="chips">
            {!client.active && <span className="chip chip--warn">Dado de baja</span>}
            {passLeft !== null && (
              <span className={passLeft < 0 ? "chip chip--warn" : passLeft <= 7 ? "chip chip--due" : "chip"}>
                {passLeft < 0 ? `Pase vencido · hace ${days(-passLeft)}` : `Pase vence en ${days(passLeft)}`}
              </span>
            )}
            <span className="chip">
              <span className={`st-dot st--${st}`} aria-hidden="true" /> {STATUS_LABEL[st]}
              {lastDate && ` · último control hace ${days(daysBetween(lastDate, today))}`}
            </span>
            <span className="chip chip--quiet">{client.coach_name ? `Coach: ${client.coach_name}` : "Sin coach asignado"}</span>
            {client.plan && <span className="chip chip--gold">{client.plan === "Premium" ? "★ " : ""}{client.plan}</span>}
          </span>
        }
      >
        <a className="btn btn--ghost btn--sm" href="#fotos">
          Fotos{photos.length > 0 && ` (${photos.length})`}
        </a>
        <a className="btn btn--ghost btn--sm" href="#editar">
          Editar
        </a>
        <a className="btn btn--gold btn--sm" href="#evaluar">
          Nueva evaluación
        </a>
      </PageHead>

      <section className="card profile" data-reveal>
        <h2 className="card-title">Datos del cliente</h2>
        <div className="profile__body">
          {client.photo_url ? (
            <img className="profile__photo" src={client.photo_url} alt="" />
          ) : (
            <span className="profile__mono" aria-hidden="true">
              {initials(client.name)}
            </span>
          )}
          <dl className="facts-grid">
            <Fact label="DNI">{client.dni && <span className="mono">{client.dni}</span>}</Fact>
            <Fact label="Teléfono">
              {client.phone && (
                <a className="mono" href={`tel:${client.phone.replace(/[^\d+]/g, "")}`}>
                  {client.phone}
                </a>
              )}
            </Fact>
            <Fact label="Correo">{client.email ?? <span className="warn">Sin correo: no puede entrar</span>}</Fact>
            <Fact label="Sexo">{client.sex && <span className={`chip chip--sex-${client.sex}`}>{client.sex === "M" ? "♂ Masculino" : "♀ Femenino"}</span>}</Fact>
            <Fact label="Edad">{years !== null && `${years} años`}</Fact>
            <Fact label="Estado físico">{client.body_type && <span className="chip chip--type">{client.body_type}</span>}</Fact>
            <Fact label="Estatura">{client.height_cm && <span className="mono">{num(client.height_cm / 100, 2)} m</span>}</Fact>
            <Fact label="IMC">{index && <span className="mono">{num(index)}</span>}</Fact>
            <Fact label="Certificado médico">
              {client.certificate_url && (
                <a href={client.certificate_url} target="_blank" rel="noreferrer">
                  Ver certificado
                </a>
              )}
            </Fact>
            <Fact label="Patologías">
              {client.conditions.length > 0 && (
                <span className="chips">
                  {client.conditions.map((c) => (
                    <span key={c} className="chip chip--warn">
                      {c}
                    </span>
                  ))}
                </span>
              )}
            </Fact>
          </dl>
        </div>
        {(client.medications || client.notes) && (
          <div className="profile__notes">
            {client.medications && (
              <p>
                <span className="label">Medicación</span> {client.medications}
              </p>
            )}
            {client.notes && (
              <p>
                <span className="label">Observaciones · sólo el equipo</span> <span className="pre">{client.notes}</span>
              </p>
            )}
          </div>
        )}
      </section>

      <div className="dash-row dash-row--even">
        {checkins.length >= 2 ? (
          <Evolution
            you={false}
            points={checkins.map((c) => ({ date: c.date, weight: c.weight_kg, fatPct: c.body_fat_pct, lean: lean(c.weight_kg, c.body_fat_pct), fatKg: (c.weight_kg * c.body_fat_pct) / 100 }))}
          />
        ) : (
          <section className="card panel-card">
            <h2 className="card-title">Evolución</h2>
            <div className="empty empty--inline">
              <p className="strong">Todavía no hay evolución para mostrar</p>
              <p className="muted">
                {checkins.length ? "Con una sola evaluación no hay tendencia: cargá la próxima y aparece el gráfico." : "Cargá la primera evaluación abajo."}
              </p>
            </div>
          </section>
        )}
        <section id="historico" className="card panel-card anchor">
          <h2 className="card-title">Histórico</h2>
          <p className="kpi__sub">
            {checkins.length} {checkins.length === 1 ? "evaluación cargada" : "evaluaciones cargadas"}
            {!checkins.length && client.legacy_last_checkin && ` · en el portal anterior, la última fue el ${shortDate(client.legacy_last_checkin)}${client.legacy_last_weight ? ` (${num(client.legacy_last_weight)} kg)` : ""}`}
          </p>
          {checkins.length > 0 && (
            <>
              <div className="table-wrap">
                <table className="table table--compact">
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col" className="right">Peso</th>
                      <th scope="col" className="right">% Graso</th>
                      <th scope="col" className="right">Masa magra</th>
                      <th scope="col">
                        <span className="sr-only">Editar o borrar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...checkins].reverse().map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{shortDate(c.date)}</td>
                        <td className="right mono">{num(c.weight_kg)} kg</td>
                        <td className="right mono">{num(c.body_fat_pct)} %</td>
                        <td className="right mono">{num(lean(c.weight_kg, c.body_fat_pct))} kg</td>
                        <td className="right">
                          <span className="row-actions">
                          <Link className="icon-btn icon-btn--sm" href={`/portal/clientes/${client.id}/evaluaciones/${c.id}`} aria-label={`Editar la evaluación del ${shortDate(c.date)}`} title={`Editar la evaluación del ${shortDate(c.date)}`}>
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </Link>
                          <Form
                            action={deleteCheckin}
                            submit={
                              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                              </svg>
                            }
                            button="icon-btn icon-btn--sm icon-btn--danger"
                            label={`Borrar la evaluación del ${shortDate(c.date)}`}
                            className="inline-form"
                            confirm={`¿Borrar la evaluación del ${shortDate(c.date)}?`}
                          >
                            <input type="hidden" name="id" value={c.id} />
                          </Form>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link className="btn btn--ghost btn--sm btn--block" href={`/portal/clientes/${client.id}/evaluaciones`}>
                Ver detalle completo
              </Link>
            </>
          )}
        </section>
      </div>

      {last && (
        <section id="alimentacion" className="anchor">
          <h2 className="section-title">Plan de alimentación</h2>
          <Form action={saveDiet} submit="Guardar plan" className="card form">
            <input type="hidden" name="client_id" value={client.id} />
            <p className="field__hint">
              {diet ? `Vigente desde la evaluación del ${shortDate(diet.date)}. ` : ""}
              Se guarda en la última evaluación (del {shortDate(last.date)}) y lo ve el cliente en Mi progreso.
            </p>
            <DietFields diet={diet} />
          </Form>
        </section>
      )}

      <section id="evaluar" className="anchor">
        <h2 className="section-title">Nueva evaluación</h2>
        <Form action={addCheckin} submit="Guardar evaluación" reset className="card form" key={checkins.length}>
          <input type="hidden" name="client_id" value={client.id} />
          <CheckinFields diet={diet} today={today} />
          <p className="field__hint">La masa magra y la grasa en kg se calculan solas.</p>
        </Form>
      </section>

      <section id="fotos" className="anchor">
        <h2 className="section-title">Fotos de progreso</h2>
        <ProgressPhotos clientId={client.id} photos={photos} you={false} />
      </section>

      <section id="editar" className="anchor">
        <h2 className="section-title">{admin ? "Editar ficha" : "Objetivo y próximo control"}</h2>
        <ClientForm viewer={viewer} client={client} coaches={coaches} />
        {admin && viewer.id !== client.id && (
          <Form
            action={deleteClient}
            submit="Borrar cliente"
            button="btn btn--sm btn--danger"
            className="card danger"
            confirm={`¿Borrar a ${client.name}? Se borran su cuenta, sus ${checkins.length} evaluaciones y sus fotos${client.scopes.includes("coach") ?", y sus clientes quedan sin coach" : ""}. No se puede deshacer.`}
          >
            <input type="hidden" name="id" value={client.id} />
            <div>
              <p className="label">Borrar cuenta</p>
              <p className="muted">Si sólo dejó de venir, mejor destildá “Activo” en la ficha: queda en Dados de baja.</p>
            </div>
          </Form>
        )}
      </section>
    </AdminShell>
  );
}
