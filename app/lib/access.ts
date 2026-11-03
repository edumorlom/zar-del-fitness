export const ROLES = ["admin", "coach", "user"] as const;
export type Role = (typeof ROLES)[number];

/** Quién puede ver y cargar datos de un cliente: el admin, cualquiera; el coach, sólo los que tiene asignados. */
export const canManage = (viewer: { id: number; role: Role }, client: { coach_id: number | null }) =>
  viewer.role === "admin" || (viewer.role === "coach" && client.coach_id === viewer.id);
