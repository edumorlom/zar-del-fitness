export const ROLES = ["admin", "coach", "user"] as const;
export type Role = (typeof ROLES)[number];

/** Quién puede ver y cargar datos de un socio: el admin, cualquiera; el coach, sólo los que tiene asignados. */
export const canManage = (viewer: { id: number; role: Role }, member: { coach_id: number | null }) =>
  viewer.role === "admin" || (viewer.role === "coach" && member.coach_id === viewer.id);
