import { canManage, isTeam, type Scope } from "~/lib/access";
import { getViewer } from "~/lib/auth";
import { db } from "~/lib/db";
import { bucketFromEnv, FILE_KEY, signedUrl } from "~/lib/storage";

// Un archivo del bucket (/archivos/alumnos/<id del portal anterior>/foto.jpg): si quien pide puede verlo, lo manda al
// enlace firmado. La foto de un cliente la ve él y todo el equipo; la de alguien del equipo, cualquiera con cuenta (el
// cliente ve la de su coach); la última foto de progreso de un cliente es su foto. El certificado y las fotos de progreso, el cliente y quien lo maneja (su coach o el admin).
// Cloudflare guarda un 404 de un .jpg unos minutos si no se le dice nada: el que no puede verlo no tiene que tapárselo
// al que sí.
const notFound = () => new Response("No encontrado", { status: 404, headers: { "Cache-Control": "private, no-store" } });

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const match = FILE_KEY.exec(key);
  const viewer = await getViewer();
  if (!match || !viewer || viewer === "unregistered") return notFound();

  // La última foto de progreso es la de perfil del cliente: se ve como la foto.
  const { rows } = await db.query<{ id: number; scopes: Scope[]; coach_id: number | null; latest: string | null }>(
    `select id, scopes, coach_id, (select key from progress_photos where client_id = users.id
       order by taken_on desc, id desc limit 1) as latest
     from users where external_id = $1`,
    [match[1]]
  );
  const owner = rows[0];
  const profile = match[2] === "foto" || key === owner?.latest;
  const allowed =
    owner && (viewer.id === owner.id || (profile ? isTeam(viewer) || isTeam(owner) : canManage(viewer, owner)));
  // Lo que no puede ver es, para él, un archivo que no existe.
  if (!allowed) return notFound();

  const bucket = bucketFromEnv();
  if (!bucket) return new Response("Faltan las variables del bucket", { status: 503 });
  return new Response(null, {
    status: 302,
    headers: { Location: signedUrl(bucket, key), "Cache-Control": "private, max-age=240" },
  });
}
