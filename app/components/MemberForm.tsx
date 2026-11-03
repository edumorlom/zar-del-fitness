import { saveMember } from "~/app/actions";
import type { Viewer } from "~/lib/auth";
import type { Member } from "~/lib/data";
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

/** Los datos de un socio. El admin edita todo (y crea socios, sin `member`); el coach, el objetivo y el próximo control. */
export function MemberForm({ viewer, member, coaches }: { viewer: Viewer; member?: Member; coaches: { id: number; name: string }[] }) {
  const admin = viewer.role === "admin";
  return (
    <Form action={saveMember} submit={member ? "Guardar cambios" : "Crear socio"} className="card form">
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="fields">
        {admin && (
          <>
            <Field label="Nombre y apellido">
              <input name="name" required defaultValue={member?.name} autoComplete="off" />
            </Field>
            <Field label="Correo" hint="Con este correo entra: con Google o con un código que le llega ahí.">
              <input name="email" type="email" required defaultValue={member?.email} autoComplete="off" autoCapitalize="none" />
            </Field>
            <Field label="Rol">
              <select name="role" defaultValue={member?.role ?? "user"}>
                <option value="user">Socio</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Coach">
              <select name="coach_id" defaultValue={member?.coach_id ?? ""}>
                <option value="">Sin coach</option>
                {coaches
                  .filter((c) => c.id !== member?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Plan" hint="Por ejemplo: Premium, Online.">
              <input name="plan" defaultValue={member?.plan ?? ""} />
            </Field>
            <Field label="Socio desde">
              <input name="member_since" type="date" required defaultValue={member?.member_since ?? todayISO()} />
            </Field>
            <Field label="El pase vence">
              <input name="pass_expires" type="date" defaultValue={member?.pass_expires ?? ""} />
            </Field>
            <Field label="WhatsApp" hint="Para los coaches: sus socios le escriben acá.">
              <input name="phone" type="tel" defaultValue={member?.phone ?? ""} placeholder="+54 9 11 …" />
            </Field>
            <Field label="Foto (URL)" hint="Para los coaches: se ve en el progreso de sus socios.">
              <input name="photo_url" type="url" defaultValue={member?.photo_url ?? ""} placeholder="https://…" />
            </Field>
          </>
        )}
        <Field label="Objetivo" wide>
          <input name="goal" defaultValue={member?.goal ?? ""} placeholder="Bajar grasa sin perder músculo" />
        </Field>
        <Field label="Próximo control">
          <input name="next_control_at" type="datetime-local" defaultValue={member?.next_control_at ? toLocalInput(member.next_control_at) : ""} />
        </Field>
      </div>
    </Form>
  );
}
