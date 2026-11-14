import { portalUrl } from "@/lib/content";
import { apiBase } from "@/portal/lib/digui-api";

// Las instrucciones del servidor MCP para Digui (sin clave: no dicen nada secreto).
export const dynamic = "force-dynamic";

const docs = (base: string) => `Servidor MCP de Zar del Fitness, para Digui u otro agente
MCP: ${base}/mcp   (Streamable HTTP, sin sesión)

Clave: el servidor pide el encabezado
  Authorization: Bearer <clave>
Sin la clave, o con otra, responde 401. Este texto es la única ruta sin clave.

Herramientas:
  info_gimnasio         Dirección, días y horarios, contacto y planes con sus precios. No pide persona.
  ver_cliente           La ficha de la persona (sin datos de salud ni DNI).
  ver_evaluaciones      Sus últimas evaluaciones, la más nueva primero.
  ver_pagos             Su pase, el precio de su plan, si puede pagarlo online y sus últimos pagos.
  ver_horarios_libres   Los horarios libres de un viernes: {"dia": "AAAA-MM-DD"}.
  ver_turnos            Sus turnos pedidos o confirmados.
  pedir_turno           Pide un turno: {"inicio": "AAAA-MM-DDTHH:MM"}, uno de ver_horarios_libres. Queda pedido hasta
                        que el Zar lo confirme.
  mover_turno           Mueve su turno a otro horario libre: {"inicio": "AAAA-MM-DDTHH:MM"}. Vuelve a quedar pedido.
  cancelar_turno        Cancela su turno. No se puede deshacer.

Todas responden JSON con "ok" (true o false) y "mensaje" (una frase en español lista para decirle a la persona). Que
algo no se pueda hacer (no hay ficha, el horario se ocupó) es "ok": false.

Quién es la persona: "customer_id" o "telefono" dicen de quién son la ficha y los turnos. Tienen que salir del servidor
del agente (lo que la persona ya tiene registrado), nunca de lo que escribe en el chat. Con customer_id se usa ese
cliente; si no, se busca por el teléfono (sólo si un único cliente lo tiene). Si no hay ficha: ok false. No hay
herramienta para buscar o listar clientes.

Turnos: sólo los viernes, desde mañana hasta 30 días, en el horario del gimnasio. Hay un máximo de 5 turnos pedidos o
confirmados por día; al completar el cupo no se ofrecen horarios. Cada persona tiene un solo turno a la vez: para
cambiarlo, mover_turno.

Horas: todas son de Argentina (sin zona horaria), en 24 h.
`;

export function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return new Response(docs(host ? apiBase(host) : `${portalUrl}/api/digui`), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
