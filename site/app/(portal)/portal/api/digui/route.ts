// Las instrucciones de la API para Digui (sin clave: no dicen nada secreto).
export const dynamic = "force-dynamic";

const DOCS = `API de turnos de Zar del Fitness, para Digui
Base: https://mi.zardelfitness.com.ar/api/digui

Clave: las rutas con clave piden el encabezado
  Authorization: Bearer <clave>
Sin la clave, o con otra, responden 401. Este texto es la única ruta sin clave.

Todas las respuestas (menos este texto) son JSON con "ok" (true o false) y "mensaje" (una frase en español lista para
decirle a la persona). Que algo no se pueda hacer (no hay ficha, el horario se ocupó) es 200 con "ok": false; 400 es un
pedido mal armado y 401 la clave.

Quién es la persona: "telefono" o "customer_id" dicen de quién son los turnos. Tienen que salir del servidor de Digui
(lo que la persona ya tiene registrado), nunca de lo que escribe en el chat. Con customer_id se usa ese cliente; si no,
se busca por el teléfono (sólo si un único cliente lo tiene). Si no hay ficha: ok false.

Horas: todas son de Argentina (sin zona horaria), en 24 h.

GET /horarios?dia=AAAA-MM-DD   (con clave)
  Los horarios libres de un día. Sólo sirven los días que se pueden pedir (desde mañana, hasta 30 días, cuando abre el
  gimnasio); otro día es ok false.
  Respuesta: {"ok": true, "mensaje": "...", "horarios": ["09:00", "09:30"]}

GET /turnos?telefono=...  o  ?customer_id=...   (con clave)
  Los turnos pedidos o confirmados de la persona.
  Respuesta: {"ok": true, "mensaje": "...", "turnos": [{"dia": "2026-11-10", "hora": "09:00", "estado": "pedido"}]}

POST /turnos   (con clave, cuerpo JSON)
  {"telefono": "...", "customer_id": 123, "inicio": "AAAA-MM-DDTHH:MM"}
  Pide un turno (queda "pedido" hasta que el Zar lo confirme). "inicio" tiene que ser un horario libre de /horarios.
  Respuesta: {"ok": true, "mensaje": "Pedido: ..."} o {"ok": false, "mensaje": "..."}
  Cancelar o mover un turno no se puede por la API: se hace desde el portal o escribiéndole al Zar.
`;

export function GET() {
  return new Response(DOCS, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
