import { PLANS, STATUS_LABEL, type ControlStatus } from "~/lib/clients";
import type { Coach } from "~/lib/data";

// Los desplegables de los filtros (Filters.tsx) que se repiten entre el dashboard y la lista de clientes.

export function CoachSelect({ coaches, value }: { coaches: Coach[]; value?: string }) {
  return (
    <select name="coach" defaultValue={value ?? ""} aria-label="Coach">
      <option value="">Todos los coaches</option>
      {coaches.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

/** "-": sin plan (listClients lo entiende así). */
export function PlanSelect({ value }: { value?: string }) {
  return (
    <select name="plan" defaultValue={value ?? ""} aria-label="Plan">
      <option value="">Todos los planes</option>
      {PLANS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
      <option value="-">Sin plan</option>
    </select>
  );
}

export const STATUSES = Object.keys(STATUS_LABEL) as ControlStatus[];

export function StatusSelect({ value }: { value?: string }) {
  return (
    <select name="estado" defaultValue={value ?? ""} aria-label="Seguimiento">
      <option value="">Todo el seguimiento</option>
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
