import { BAD_DAY, keyOk, parseDay } from "~/lib/digui-api";
import { todayISO, longDate } from "~/lib/format";
import { bookableDays } from "~/lib/slots";
import { freeTimes, HOURS } from "~/lib/turnos";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!keyOk(req.headers.get("authorization"), process.env.DIGUI_API_KEY))
    return Response.json({ ok: false, mensaje: "Clave equivocada." }, { status: 401 });
  const dia = parseDay(new URL(req.url).searchParams.get("dia"));
  if (!dia) return Response.json({ ok: false, mensaje: "La fecha va como AAAA-MM-DD." }, { status: 400 });
  if (!bookableDays(todayISO(), HOURS).includes(dia)) return Response.json({ ok: false, mensaje: BAD_DAY });
  const horarios = await freeTimes(dia);
  const mensaje = horarios.length
    ? `Horarios libres el ${longDate(dia)}: ${horarios.join(", ")}.`
    : `No quedan horarios libres el ${longDate(dia)}.`;
  return Response.json({ ok: true, mensaje, horarios });
}
