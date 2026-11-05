import { canManage, type Role } from "~/lib/access";
import { getViewer } from "~/lib/auth";
import { db } from "~/lib/db";
import { bucketFromEnv, FILE_KEY, signedUrl } from "~/lib/storage";

// Un archivo del bucket (/archivos/alumnos/<id del portal anterior>/foto.jpg): si quien pide puede verlo, lo manda al
// enlace firmado. La foto de un cliente la ve él y todo el equipo; la de alguien del equipo, cualquiera con cuenta (el
// cliente ve la de su coach). El certificado, el cliente y quien lo maneja.
// Cloudflare guarda un 404 de un .jpg unos minutos si no se le dice nada: el que no puede verlo no tiene que tapárselo
// al que sí.
const notFound = () => new Response("No encontrado", { status: 404, headers: { "Cache-Control": "private, no-store" } });

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const match = FILE_KEY.exec(key);
  const viewer = await getViewer();
  if (!match || !viewer || viewer === "unregistered") return notFound();

  const { rows } = await db.query<{ id: number; role: Role; coach_id: number | null }>(
    "select id, role, coach_id from users where external_id = $1",
    [match[1]]
  );
  const owner = rows[0];
  const allowed =
    owner && (viewer.id === owner.id || (match[2] === "foto" ? viewer.role !== "user" || owner.role !== "user" : canManage(viewer, owner)));
  // Lo que no puede ver es, para él, un archivo que no existe.
  if (!allowed) return notFound();

  const bucket = bucketFromEnv();
  if (!bucket) return new Response("Faltan las variables del bucket", { status: 503 });
  return new Response(null, {
    status: 302,
    headers: { Location: signedUrl(bucket, key), "Cache-Control": "private, max-age=240" },
  });
}
