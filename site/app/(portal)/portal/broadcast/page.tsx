import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sendBroadcast } from "~/broadcast-actions";
import { AdminShell, PageHead } from "~/components/AdminShell";
import { ClientPicker } from "~/components/ClientPicker";
import { Form } from "~/components/Form";
import { requireViewer } from "~/lib/auth";
import { DEFAULT_TEMPLATE } from "~/lib/broadcast-email";
import { PLANS } from "~/lib/clients";
import { getBroadcastTemplate, listClients } from "~/lib/data";

export const metadata: Metadata = { title: "Broadcast" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Un correo a muchos clientes a la vez (sólo el admin): la plantilla, y a quiénes, por grupo o uno por uno. */
export default async function BroadcastPage() {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("admin")) notFound();
  const [all, saved] = await Promise.all([listClients(viewer, { active: true }), getBroadcastTemplate()]);
  const template = saved ?? DEFAULT_TEMPLATE;
  const clients = all.filter((c) => EMAIL.test(c.email ?? ""));
  const noEmail = all.length - clients.length;

  const count = (f: (c: (typeof clients)[number]) => boolean) => clients.filter(f).length;
  const coaches = [...new Map(clients.filter((c) => c.coach_id).map((c) => [c.coach_id!, c.coach_name ?? "Coach"])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  );
  const groups = [
    { value: "all", label: "Todos los clientes", n: clients.length },
    ...PLANS.map((p) => ({ value: `plan:${p.id}`, label: `Plan ${p.label}`, n: count((c) => c.plan === p.id) })),
    { value: "plan:-", label: "Sin plan", n: count((c) => !c.plan) },
    ...coaches.map(([id, name]) => ({ value: `coach:${id}`, label: `Clientes de ${name}`, n: count((c) => c.coach_id === id) })),
  ];

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

      <Form action={sendBroadcast} submit="Enviar correo" confirm={{
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
            <legend className="field__label">Grupos</legend>
            <div className="checks">
              {groups.map((g) => (
                <label key={g.value} className="check">
                  <input type="checkbox" name="group" value={g.value} disabled={!g.n} />
                  <span>
                    {g.label} <span className="muted">({g.n})</span>
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
