import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sendBroadcast } from "~/broadcast-actions";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { ClientPicker } from "~/components/ClientPicker";
import { Form } from "~/components/Form";
import { requireViewer } from "~/lib/auth";
import { DEFAULT_TEMPLATE } from "~/lib/broadcast-email";
import { PLANS } from "~/lib/clients";
import { marketingOptOuts } from "~/lib/consent";
import { getBroadcastTemplate, listClients } from "~/lib/data";
import { isEmail } from "~/lib/form";

export const metadata: Metadata = { title: "Broadcast" };

/** Un correo a muchos clientes a la vez (sólo el admin): la plantilla, y a quiénes, por grupo o uno por uno. */
export default async function BroadcastPage() {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("admin")) notFound();
  const [all, saved, optedOut] = await Promise.all([listClients(viewer, { active: true }), getBroadcastTemplate(), marketingOptOuts()]);
  const template = saved ?? DEFAULT_TEMPLATE;
  const clients = all.filter((c) => isEmail(c.email));
  const noEmail = all.length - clients.length;

  // Cuántos hay en cada grupo y, de ellos, cuántos no reciben promociones (un aviso sí les llega).
  const group = (value: string, label: string, f: (c: (typeof clients)[number]) => boolean) => {
    const members = clients.filter(f);
    return { value, label, n: members.length, out: members.filter((c) => optedOut.has(c.id)).length };
  };
  const coaches = [...new Map(clients.filter((c) => c.coach_id).map((c) => [c.coach_id!, c.coach_name ?? "Coach"])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  );
  const groups = [
    group("all", "Todos los clientes", () => true),
    ...PLANS.map((p) => group(`plan:${p.id}`, `Plan ${p.label}`, (c) => c.plan === p.id)),
    group("plan:-", "Sin plan", (c) => !c.plan),
    ...coaches.map(([id, name]) => group(`coach:${id}`, `Clientes de ${name}`, (c) => c.coach_id === id)),
  ];
  const outAll = groups[0].out;

  return (
    <AdminShell viewer={viewer}>
      <PageHead
        title="Broadcast"
        sub={
          <>
            Un correo a muchos clientes a la vez. Sólo a los activos con correo
            {noEmail > 0 && ` (${noEmail} ${noEmail === 1 ? "no tiene" : "no tienen"} correo cargado y no ${noEmail === 1 ? "lo recibe" : "lo reciben"})`}.
          </>
        }
      />

      <Form action={sendBroadcast} submit="Enviar correo" event="broadcast_sent" confirm={{
          title: "¿Enviar",
          accent: "el correo?",
          text: "Les llega a todos los clientes elegidos, en los grupos y uno por uno. No se puede deshacer.",
          yes: "Enviar",
        }} className="card form">
        <div className="fields">
          <label className="field field--wide">
            <span className="field__label">Asunto</span>
            <input name="subject" defaultValue={template.subject} maxLength={200} required />
          </label>
          <label className="field field--wide">
            <span className="field__label">Mensaje</span>
            <textarea name="body" defaultValue={template.body} rows={12} maxLength={10_000} required />
            <span className="field__hint">
              {"{nombre}"} se cambia por el nombre de cada cliente. Una línea en blanco separa párrafos. Al enviar, la plantilla queda guardada para la
              próxima.
            </span>
          </label>
          <fieldset className="choice field--wide">
            <legend className="field__label">Tipo de correo</legend>
            <div className="choice__grid">
              <label className="choice__card">
                <input type="radio" name="kind" value="promo" defaultChecked />
                <span className="strong">Novedades o promociones</span>
                <span className="field__hint">
                  Lleva el link para darse de baja y no les llega a quienes se dieron de baja
                  {outAll > 0 && ` (${outAll} ${outAll === 1 ? "cliente" : "clientes"})`}.
                </span>
              </label>
              <label className="choice__card">
                <input type="radio" name="kind" value="aviso" />
                <span className="strong">Aviso del servicio</span>
                <span className="field__hint">Un cierre, un cambio de horario: les llega a todos. Nunca para publicidad (Ley 25.326, art. 27).</span>
              </label>
            </div>
          </fieldset>
          <fieldset className="choice field--wide">
            <legend className="field__label">Grupos</legend>
            <div className="checks">
              {groups.map((g) => (
                <label key={g.value} className="check">
                  <input type="checkbox" name="group" value={g.value} disabled={!g.n} />
                  <span>
                    {g.label} <span className="muted">({g.out ? `${g.n}, ${g.out} sin promociones` : g.n})</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field field--wide">
            <label className="field__label" htmlFor="broadcast-client">
              Clientes uno por uno
            </label>
            <ClientPicker id="broadcast-client" name="client" multiple options={clients.map((c) => ({ id: c.id, label: c.name }))} />
            <span className="field__hint">Se suman a los grupos. A quien esté en más de uno le llega una sola vez.</span>
          </div>
        </div>
      </Form>
    </AdminShell>
  );
}
