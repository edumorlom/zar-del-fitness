// Una cuenta tiene uno o varios scopes, y cada uno sólo suma lo suyo.
export const SCOPES = ["admin", "coach", "user", "receptionist"] as const;
export type Scope = (typeof SCOPES)[number];
export const SCOPE_LABEL: Record<Scope, string> = { admin: "Admin", coach: "Coach", user: "Cliente", receptionist: "Recepción" };

type Scoped = { scopes: Scope[] };

/** Quienes trabajan con clientes. Recepción no: crea cuentas y maneja los pagos, nada más. */
export const isTeam = ({ scopes }: Scoped) => scopes.includes("admin") || scopes.includes("coach");

export const canCreate = ({ scopes }: Scoped) => scopes.includes("admin") || scopes.includes("receptionist");

/** Quién ve los pagos y carga los del local (efectivo o tarjeta): el admin y recepción. Anularlos, sólo el admin. */
export const canHandlePayments = ({ scopes }: Scoped) => scopes.includes("admin") || scopes.includes("receptionist");

/** Quién puede ver y cargar datos de un cliente: el admin, cualquiera; el coach, sólo los que tiene asignados. */
export const canManage = (viewer: Scoped & { id: number }, client: { coach_id: number | null }) =>
  viewer.scopes.includes("admin") || (viewer.scopes.includes("coach") && client.coach_id === viewer.id);

/** Adónde va cada uno al entrar. */
export const homeOf = (viewer: Scoped) =>
  isTeam(viewer) ? "/portal/dashboard" : viewer.scopes.includes("receptionist") ? "/portal/clientes/nuevo" : "/portal/mi-progreso";

/** Los scopes de una cuenta que se guarda; null si no son válidos. Sólo el admin elige: los demás crean clientes. */
export function scopesToSave(viewer: Scoped, asked: string[]): Scope[] | null {
  if (!viewer.scopes.includes("admin")) return ["user"];
  return asked.length && asked.every((s) => SCOPES.includes(s as Scope)) ? (asked as Scope[]) : null;
}
