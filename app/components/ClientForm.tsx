import { saveClient } from "~/app/actions";
import type { Viewer } from "~/lib/auth";
import { age, BODY_TYPES, CONDITIONS, PLANS } from "~/lib/clients";
import type { Client, Coach } from "~/lib/data";
import { todayISO, toLocalInput } from "~/lib/format";
import { PHOTO_MAX_MB } from "~/lib/storage";
import { Form } from "./Form";
import { initials } from "./Shell";
import { Steps } from "./Steps";

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

/** Lo que el coach también puede cambiar de sus clientes. */
function Plan({ client }: { client?: Client }) {
  return (
    <>
      <Field label="Objetivo" wide>
        <input name="goal" defaultValue={client?.goal ?? ""} placeholder="Bajar grasa sin perder músculo" />
      </Field>
      <Field label="Próximo control">
        <input name="next_control_at" type="datetime-local" defaultValue={client?.next_control_at ? toLocalInput(client.next_control_at) : ""} />
      </Field>
    </>
  );
}

/**
 * La ficha de un cliente (o de un coach o un admin: son la misma cuenta). El admin edita todo, en pasos, y crea cuentas
 * (sin `client`); el coach, el objetivo y el próximo control de sus clientes.
 */
export function ClientForm({ viewer, client, coaches }: { viewer: Viewer; client?: Client; coaches: Coach[] }) {
  if (viewer.role !== "admin")
    return (
      <Form action={saveClient} submit="Guardar cambios" className="card form">
        {client && <input type="hidden" name="id" value={client.id} />}
        <div className="fields">
          <Plan client={client} />
        </div>
      </Form>
    );

  const today = todayISO();
  const years = client ? age(client.birth_year, today) : null;

  const personal = (
    <div className="fields">
      <Field label="Nombre y apellido" wide>
        <input name="name" defaultValue={client?.name} autoComplete="off" />
      </Field>
      <Field label="Documento">
        <input name="dni" defaultValue={client?.dni ?? ""} inputMode="numeric" autoComplete="off" />
      </Field>
      <Field label="Sexo">
        <select name="sex" defaultValue={client?.sex ?? ""}>
          <option value="">Sin cargar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </Field>
      <Field label="Edad">
        <input name="age" type="number" min={5} max={110} defaultValue={years ?? ""} />
      </Field>
      <Field label="Teléfono">
        <input name="phone" type="tel" defaultValue={client?.phone ?? ""} placeholder="11 2345 6789" />
      </Field>
      <Field label="Correo" hint="Con este correo entra al portal: con Google o con un código que le llega ahí." wide>
        <input name="email" type="email" defaultValue={client?.email ?? ""} autoComplete="off" autoCapitalize="none" />
      </Field>
      <Field label="Rol">
        <select name="role" defaultValue={client?.role ?? "user"}>
          <option value="user">Cliente</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      <label className="check check--field">
        <input type="checkbox" name="active" defaultChecked={client?.active ?? true} />
        <span>
          <span className="strong">Activo</span>
          <span className="field__hint">Sin tildar: dado de baja (no cuenta en el dashboard).</span>
        </span>
      </label>
      <Field label="Título" hint="Para coaches: se ve en el progreso de sus clientes.">
        <input name="title" defaultValue={client?.title ?? ""} placeholder="Personal trainer PREMIUM" />
      </Field>
      <Field
        label="Foto"
        hint={`JPG o PNG, hasta ${PHOTO_MAX_MB} MB.${client?.photo_url ? " Ya tiene una: elegí otra sólo para cambiarla." : ""}`}
      >
        <input name="photo" type="file" accept="image/jpeg,image/png" />
      </Field>
    </div>
  );

  const program = (
    <div className="fields">
      <fieldset className="choice field--wide">
        <legend className="field__label">Plan (opcional)</legend>
        <div className="choice__grid">
          <label className="choice__card">
            <input type="radio" name="plan" value="" defaultChecked={!client?.plan} />
            <span className="strong">Sin plan</span>
          </label>
          {PLANS.map((p) => (
            <label key={p.id} className="choice__card">
              <input type="radio" name="plan" value={p.id} defaultChecked={client?.plan === p.id} />
              <span className="strong">
                {p.id === "Premium" && "★ "}
                {p.label}
              </span>
              <span className="muted">{p.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="choice field--wide">
        <legend className="field__label">Coach a cargo (opcional)</legend>
        <div className="choice__grid">
          <label className="choice__card">
            <input type="radio" name="coach_id" value="" defaultChecked={!client?.coach_id} />
            <span className="strong">Sin coach</span>
          </label>
          {coaches
            .filter((c) => c.id !== client?.id)
            .map((c) => (
              <label key={c.id} className="choice__card choice__card--person">
                <input type="radio" name="coach_id" value={c.id} defaultChecked={client?.coach_id === c.id} />
                {c.photo_url ? <img className="person__img" src={c.photo_url} alt="" /> : <span className="avatar avatar--sm">{initials(c.name)}</span>}
                <span>
                  <span className="strong">{c.name}</span>
                  <span className="person__sub">{c.title ?? (c.role === "admin" ? "Coach master" : "Coach")}</span>
                </span>
              </label>
            ))}
        </div>
      </fieldset>
      <Field label="Cliente desde">
        <input name="client_since" type="date" defaultValue={client?.client_since ?? today} />
      </Field>
      <Field label="El pase vence">
        <input name="pass_expires" type="date" defaultValue={client?.pass_expires ?? ""} />
      </Field>
      <Plan client={client} />
    </div>
  );

  const body = (
    <div className="fields">
      <Field label="Estatura" hint="En centímetros.">
        <input name="height_cm" type="number" min={80} max={250} defaultValue={client?.height_cm ?? ""} />
      </Field>
      <Field label="Estado físico">
        <select name="body_type" defaultValue={client?.body_type ?? ""}>
          <option value="">Sin cargar</option>
          {BODY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );

  const health = (
    <div className="fields">
      <fieldset className="choice field--wide">
        <legend className="field__label">Patologías</legend>
        <div className="checks">
          {CONDITIONS.map((c) => (
            <label key={c} className="check">
              <input type="checkbox" name="conditions" value={c} defaultChecked={client?.conditions.includes(c)} />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Medicación" wide>
        <textarea name="medications" rows={2} defaultValue={client?.medications ?? ""} placeholder="Medicación prescripta, si corresponde" />
      </Field>
      <Field label="Observaciones" hint="Notas internas del equipo: el cliente no las ve." wide>
        <textarea name="notes" rows={3} defaultValue={client?.notes ?? ""} />
      </Field>
    </div>
  );

  return (
    <Form action={saveClient} submit={client ? "Guardar cambios" : "Crear cliente"} className="card form form--steps">
      {client && <input type="hidden" name="id" value={client.id} />}
      <Steps
        steps={[
          { id: "personales", label: "Personales", content: personal },
          { id: "programa", label: "Programa", content: program },
          { id: "fisico", label: "Físico", content: body },
          { id: "salud", label: "Salud", content: health },
        ]}
      />
    </Form>
  );
}
