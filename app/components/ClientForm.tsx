import { saveClient } from "~/app/actions";
import type { Viewer } from "~/lib/auth";
import type { Client } from "~/lib/data";
import { todayISO, toLocalInput } from "~/lib/format";
import { Form } from "./Form";

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

/** Los datos de un cliente. El admin edita todo (y crea clientes, sin `client`); el coach, el objetivo y el próximo control. */
export function ClientForm({ viewer, client, coaches }: { viewer: Viewer; client?: Client; coaches: { id: number; name: string }[] }) {
  const admin = viewer.role === "admin";
  return (
    <Form action={saveClient} submit={client ? "Guardar cambios" : "Crear cliente"} className="card form">
      {client && <input type="hidden" name="id" value={client.id} />}
      <div className="fields">
        {admin && (
          <>
            <Field label="Nombre y apellido">
              <input name="name" required defaultValue={client?.name} autoComplete="off" />
            </Field>
            <Field label="Correo" hint="Con este correo entra: con Google o con un código que le llega ahí.">
              <input name="email" type="email" required defaultValue={client?.email} autoComplete="off" autoCapitalize="none" />
            </Field>
            <Field label="Rol">
              <select name="role" defaultValue={client?.role ?? "user"}>
                <option value="user">Cliente</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Coach">
              <select name="coach_id" defaultValue={client?.coach_id ?? ""}>
                <option value="">Sin coach</option>
                {coaches
                  .filter((c) => c.id !== client?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Plan" hint="Por ejemplo: Premium, Online.">
              <input name="plan" defaultValue={client?.plan ?? ""} />
            </Field>
            <Field label="Cliente desde">
              <input name="client_since" type="date" required defaultValue={client?.client_since ?? todayISO()} />
            </Field>
            <Field label="El pase vence">
              <input name="pass_expires" type="date" defaultValue={client?.pass_expires ?? ""} />
            </Field>
            <Field label="WhatsApp" hint="Para los coaches: sus clientes le escriben acá.">
              <input name="phone" type="tel" defaultValue={client?.phone ?? ""} placeholder="+54 9 11 …" />
            </Field>
            <Field label="Foto (URL)" hint="Para los coaches: se ve en el progreso de sus clientes.">
              <input name="photo_url" type="url" defaultValue={client?.photo_url ?? ""} placeholder="https://…" />
            </Field>
          </>
        )}
        <Field label="Objetivo" wide>
          <input name="goal" defaultValue={client?.goal ?? ""} placeholder="Bajar grasa sin perder músculo" />
        </Field>
        <Field label="Próximo control">
          <input name="next_control_at" type="datetime-local" defaultValue={client?.next_control_at ? toLocalInput(client.next_control_at) : ""} />
        </Field>
      </div>
    </Form>
  );
}
