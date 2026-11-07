import "server-only";
// El servidor MCP del portal, para agentes (Digui u otro con la clave): las mismas consultas y reglas que la API de
// Digui (app/(portal)/portal/api/digui/), como herramientas MCP. Lo sirve app/(portal)/portal/api/digui/mcp/route.ts.
//
// Quién es la persona: customer_id o telefono, que tienen que salir del servidor del agente (lo que la persona ya tiene
// registrado), nunca de lo que escribe en el chat. Por eso no hay herramienta para buscar o listar clientes, y la ficha
// no trae datos de salud (condiciones, medicación, notas del coach) ni el DNI.
import gimnasio from "@db/gimnasio.json";
import horarios from "@db/horarios.json";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { content } from "@/lib/content";
import { getCheckins, getClient } from "./data";
import { BAD_DAY, customerId, NO_FILE_ID, NO_FILE_PHONE, parseDay, parseStart } from "./digui-api";
import { dateOf, longDate, num, todayISO } from "./format";
import { bookableDays } from "./slots";
import { clientById, clientByPhone, freeTimes, HOURS, liveAppointments, requestSlot } from "./turnos";

type Reply = { ok: boolean; mensaje: string; [k: string]: unknown };

/** La respuesta de una herramienta: el JSON como texto (lo que lee el modelo) y como structuredContent. */
const reply = (r: Reply) => ({
  content: [{ type: "text" as const, text: JSON.stringify(r) }],
  structuredContent: r,
  isError: false,
});
const fail = (mensaje: string) => reply({ ok: false, mensaje });

const persona = {
  customer_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional()
    .describe("El id del cliente en el portal, del servidor del agente (no de lo que escribe la persona)."),
  telefono: z.string().optional()
    .describe("El teléfono de la persona, del servidor del agente. Se usa si no viene customer_id."),
};

/** El cliente de customer_id o, si no viene, del teléfono. Un mensaje si falta o no hay ficha. */
async function who(args: { customer_id?: number | string; telefono?: string }): Promise<number | string> {
  const id = customerId(args.customer_id);
  if (id !== null) return (await clientById(id)) ?? NO_FILE_ID;
  if (args.telefono?.trim()) return (await clientByPhone(args.telefono)) ?? NO_FILE_PHONE;
  return "Falta el teléfono o el customer_id.";
}

const fecha = (d: Date | string | null) => (d === null ? null : typeof d === "string" ? d.slice(0, 10) : dateOf(d));

export function portalMcp() {
  const server = new McpServer({ name: "zar-del-fitness", version: "1.0.0" });
  const readOnly = { readOnlyHint: true, openWorldHint: false };

  server.registerTool(
    "info_gimnasio",
    {
      title: "Información del gimnasio",
      description: "Dirección, días y horarios, contacto y planes con sus precios de Zar del Fitness. Público: no pide persona.",
      inputSchema: {},
      annotations: readOnly,
    },
    async () => {
      const { programs, contact } = content("es");
      const { direccion } = gimnasio;
      return reply({
        ok: true,
        mensaje: `${gimnasio.gimnasio}, ${contact.address}. Abre ${horarios.dias.join(", ")}: ${horarios.turnos
          .map((t) => `${t.abre} a ${t.cierra}`)
          .join(" y ")} (hora argentina).`,
        gimnasio: gimnasio.gimnasio,
        direccion: `${direccion.calle}, ${direccion.barrio}, ${direccion.ciudad}`,
        mapa: gimnasio.googleMaps,
        whatsapp: gimnasio.whatsapp,
        sitio: `https://${gimnasio.sitioWeb}`,
        dias: horarios.dias,
        turnos: horarios.turnos,
        minutos_por_clase: horarios.minutosPorClase,
        planes: programs.map((p) => ({
          nombre: p.title,
          precio: `${p.currency === "$" ? "$" : `${p.currency} `}${p.price}${p.suffix ? ` ${p.suffix}` : ""}`,
          descripcion: p.desc,
        })),
      });
    }
  );

  server.registerTool(
    "ver_cliente",
    {
      title: "Ficha del cliente",
      description:
        "La ficha de la persona: nombre, plan, coach, desde cuándo es cliente, vencimiento del pase, próximo control y objetivo. Sin datos de salud.",
      inputSchema: persona,
      annotations: readOnly,
    },
    async (args) => {
      const id = await who(args);
      if (typeof id === "string") return fail(id);
      const c = await getClient(id);
      if (!c) return fail(NO_FILE_ID);
      const nombre = c.name.split(" ")[0];
      return reply({
        ok: true,
        mensaje: `${c.name}${c.plan ? `, plan ${c.plan}` : ""}${c.coach_name ? `, con ${c.coach_name}` : ""}.`,
        cliente: {
          customer_id: c.id,
          nombre: c.name,
          nombre_de_pila: nombre,
          activo: c.active,
          plan: c.plan,
          cliente_desde: fecha(c.client_since),
          vence_pase: fecha(c.pass_expires),
          proximo_control: fecha(c.next_control_at),
          objetivo: c.goal,
          coach: c.coach_name ? { nombre: c.coach_name, telefono: c.coach_phone } : null,
        },
      });
    }
  );

  server.registerTool(
    "ver_evaluaciones",
    {
      title: "Evaluaciones del cliente",
      description:
        "Las últimas evaluaciones de la persona (peso, % graso, perímetros y lo que da la balanza), la más nueva primero.",
      inputSchema: { ...persona, cantidad: z.number().int().min(1).max(20).default(5).describe("Cuántas (1 a 20).") },
      annotations: readOnly,
    },
    async (args) => {
      const id = await who(args);
      if (typeof id === "string") return fail(id);
      const all = await getCheckins(id);
      // Sin el id de la fila: no le sirve al agente.
      const ultimas = all
        .slice(-args.cantidad)
        .reverse()
        .map(({ id: row, ...e }) => (void row, { ...e, date: fecha(e.date) }));
      if (!ultimas.length) return reply({ ok: true, mensaje: "Todavía no hay evaluaciones cargadas.", evaluaciones: [] });
      const [u] = ultimas;
      return reply({
        ok: true,
        mensaje: `${all.length} evaluaciones. La última, el ${longDate(u.date!)}: ${num(u.weight_kg)} kg y ${num(u.body_fat_pct)} % graso.`,
        total: all.length,
        evaluaciones: ultimas,
      });
    }
  );

  server.registerTool(
    "ver_horarios_libres",
    {
      title: "Horarios libres",
      description:
        "Los horarios libres para un turno un día (desde mañana, hasta 30 días, cuando abre el gimnasio). Horas de Argentina.",
      inputSchema: { dia: z.string().describe("AAAA-MM-DD") },
      annotations: readOnly,
    },
    async ({ dia }) => {
      const day = parseDay(dia);
      if (!day) return fail("La fecha va como AAAA-MM-DD.");
      if (!bookableDays(todayISO(), HOURS).includes(day)) return fail(BAD_DAY);
      const horas = await freeTimes(day);
      return reply({
        ok: true,
        mensaje: horas.length ? `Horarios libres el ${longDate(day)}: ${horas.join(", ")}.` : `No quedan horarios libres el ${longDate(day)}.`,
        dia: day,
        horarios: horas,
      });
    }
  );

  server.registerTool(
    "ver_turnos",
    {
      title: "Turnos del cliente",
      description: "Los turnos pedidos o confirmados de la persona que todavía no pasaron.",
      inputSchema: persona,
      annotations: readOnly,
    },
    async (args) => {
      const id = await who(args);
      if (typeof id === "string") return fail(id);
      const turnos = await liveAppointments(id);
      return reply({
        ok: true,
        mensaje: turnos.length
          ? turnos.map((t) => `${longDate(t.dia)} a las ${t.hora} h (${t.estado}).`).join(" ")
          : "No tenés turnos pedidos ni confirmados.",
        turnos,
      });
    }
  );

  server.registerTool(
    "pedir_turno",
    {
      title: "Pedir un turno",
      description:
        "Pide un turno para la persona (queda pedido hasta que el Zar lo confirme). El inicio tiene que ser uno de ver_horarios_libres. Cancelar o mover un turno no se puede: se hace desde el portal o escribiéndole al Zar.",
      inputSchema: { ...persona, inicio: z.string().describe("AAAA-MM-DDTHH:MM, hora argentina") },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (args) => {
      const id = await who(args);
      if (typeof id === "string") return fail(id);
      const start = parseStart(args.inicio);
      if (!start) return fail("El inicio va como AAAA-MM-DDTHH:MM.");
      if (!bookableDays(todayISO(), HOURS).includes(dateOf(start))) return fail(BAD_DAY);
      return reply(await requestSlot(id, start));
    }
  );

  return server;
}
