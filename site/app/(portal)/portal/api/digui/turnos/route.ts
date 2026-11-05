import { BAD_DAY, customerId, keyOk, NO_FILE_ID, NO_FILE_PHONE, parseStart } from "~/lib/digui-api";
import { dateOf, longDate, todayISO } from "~/lib/format";
import { bookableDays } from "~/lib/slots";
import { clientById, clientByPhone, HOURS, liveAppointments, requestSlot } from "~/lib/turnos";

export const dynamic = "force-dynamic";

const fail = (mensaje: string, status = 200) => Response.json({ ok: false, mensaje }, { status });
const unauthorized = () => fail("Clave equivocada.", 401);

type Who = { id: number } | Response;

/** El cliente de customer_id o, si no viene, del teléfono; una Response si falta o no hay ficha. */
async function who(customer_id: unknown, telefono: unknown): Promise<Who> {
  const id = customerId(customer_id);
  if (id !== null) {
    const c = await clientById(id);
    return c ? { id: c } : fail(NO_FILE_ID);
  }
  const tel = typeof telefono === "number" && Number.isFinite(telefono) ? String(telefono) : telefono;
  if (typeof tel === "string" && tel.trim()) {
    const c = await clientByPhone(tel);
    return c ? { id: c } : fail(NO_FILE_PHONE);
  }
  return fail("Falta el teléfono o el customer_id.", 400);
}

export async function GET(req: Request) {
  if (!keyOk(req.headers.get("authorization"), process.env.DIGUI_API_KEY)) return unauthorized();
  const q = new URL(req.url).searchParams;
  const w = await who(q.get("customer_id"), q.get("telefono"));
  if (w instanceof Response) return w;
  const turnos = await liveAppointments(w.id);
  const mensaje = turnos.length
    ? turnos.map((t) => `${longDate(t.dia)} a las ${t.hora} h (${t.estado}).`).join(" ")
    : "No tenés turnos pedidos ni confirmados.";
  return Response.json({ ok: true, mensaje, turnos });
}

export async function POST(req: Request) {
  if (!keyOk(req.headers.get("authorization"), process.env.DIGUI_API_KEY)) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return fail("El cuerpo va en JSON.", 400);
  const w = await who(body.customer_id, body.telefono);
  if (w instanceof Response) return w;
  const start = parseStart(body.inicio);
  if (!start) return fail("El inicio va como AAAA-MM-DDTHH:MM.", 400);
  if (!bookableDays(todayISO(), HOURS).includes(dateOf(start))) return fail(BAD_DAY);
  return Response.json(await requestSlot(w.id, start));
}
