import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "./access";

export type Viewer = { id: number; role: Role; name: string; email: string };
const COLS = "id, role, name, email";

/**
 * Quién entró: su cuenta de Clerk (Google o código por correo) con su fila en users. La primera vez se enlazan por
 * correo, sólo si Clerk lo verificó. "unregistered": entró, pero el admin no cargó su correo.
 */
export const getViewer = cache(async (): Promise<Viewer | "unregistered" | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const found = await db.query<Viewer>(`select ${COLS} from users where clerk_id = $1`, [userId]);
  if (found.rows[0]) return found.rows[0];

  const user = await currentUser();
  const emails = (user?.emailAddresses ?? [])
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress.toLowerCase());
  if (!emails.length) return "unregistered";
  const linked = await db.query<Viewer>(
    `update users set clerk_id = $1
     where id = (select id from users where clerk_id is null and email = any($2) order by id limit 1)
     returning ${COLS}`,
    [userId, emails]
  );
  return linked.rows[0] ?? "unregistered";
});

/** El usuario logueado. Sin sesión, a /ingresar; con sesión pero sin cuenta en el portal, a /sin-acceso. */
export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/ingresar");
  if (viewer === "unregistered") redirect("/portal/sin-acceso");
  return viewer;
}
