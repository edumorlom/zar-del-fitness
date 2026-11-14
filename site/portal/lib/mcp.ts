import "server-only";
// El servidor MCP del portal, para agentes (Digui u otro con la clave): la única forma en que un agente consulta y pide
// turnos, con las mismas reglas que el portal (portal/lib/turnos.ts). Lo sirve app/(portal)/portal/api/digui/mcp/route.ts,
// y sus instrucciones están en app/(portal)/portal/api/digui/route.ts.
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
import { SITE } from "./email-layout";
import { dateOf, longDate, num, todayISO } from "./format";
import { mpConfigured } from "./mercadopago";
import { canPayOnline, METHOD_LABEL, money, MP_IN_PROCESS, PASS_LABEL, passStatus } from "./payments";
import { listPayments, planPrice } from "./payments-data";
import { bookableDays } from "./slots";
import { cancelSlot, clientById, clientByPhone, freeTimes, HOURS, liveAppointments, moveSlot, requestSlot } from "./turnos";

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
  // También como número: el servidor del agente puede tenerlo guardado así.
  telefono: z.union([z.string(), z.number()]).optional()
    .describe("El teléfono de la persona, del servidor del agente. Se usa si no viene customer_id."),
};

/** El cliente de customer_id o, si no viene, del teléfono. Un mensaje si falta o no hay ficha. */
async function who(args: { customer_id?: number | string; telefono?: string | number }): Promise<number | string> {
  const id = customerId(args.customer_id);
  if (id !== null) return (await clientById(id)) ?? NO_FILE_ID;
  const tel = args.telefono === undefined ? "" : String(args.telefono).trim();
  if (tel) return (await clientByPhone(tel)) ?? NO_FILE_PHONE;
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
        "Los horarios libres para un turno los viernes (desde mañana, hasta 30 días), con un máximo de 5 turnos pedidos o confirmados por día. Horas de Argentina.",
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
        "Pide un turno para la persona (queda pedido hasta que el Zar lo confirme). El inicio tiene que ser uno de ver_horarios_libres. Si ya tiene uno, para cambiarlo es mover_turno.",
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

  server.registerTool(
    "mover_turno",
    {
      title: "Mover el turno",
      description:
        "Mueve el turno pedido o confirmado de la persona a otro horario, que tiene que ser uno de ver_horarios_libres. Vuelve a quedar pedido hasta que el Zar lo confirme. Antes, confirmá con la persona el horario nuevo.",
      inputSchema: { ...persona, inicio: z.string().describe("El horario nuevo: AAAA-MM-DDTHH:MM, hora argentina") },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const id = await who(args);
      if (typeof id === "string") return fail(id);
      const start = parseStart(args.inicio);
      if (!start) return fail("El inicio va como AAAA-MM-DDTHH:MM.");
      if (!bookableDays(todayISO(), HOURS).includes(dateOf(start))) return fail(BAD_DAY);
      return reply(await moveSlot(id, start));
    }
  );

  server.registerTool(
    "cancelar_turno",
    {
      title: "Cancelar el turno",
      description:
        "Cancela el turno pedido o confirmado de la persona (tiene uno solo: el de ver_turnos). Antes, confirmá con la persona que quiere cancelarlo. No se puede deshacer: después tendría que pedir otro.",
      inputSchema: persona,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async (args) => {
      const id = await who(args);
      if (typeof id === "string") return fail(id);
      return reply(await cancelSlot(id));
    }
  );

  server.registerTool(
    "ver_pagos",
    {
      title: "Pagos del cliente",
      description:
        "El pase de la persona (vencimiento y si está al día), el precio de su plan, si puede pagarlo online con Mercado Pago (y dónde) y sus últimos pagos, el más nuevo primero.",
      inputSchema: { ...persona, cantidad: z.number().int().min(1).max(20).default(5).describe("Cuántos pagos (1 a 20).") },
      annotations: readOnly,
    },
    async (args) => {
      const id = await who(args);
      if (typeof id === "string") return fail(id);
      const c = await getClient(id);
      if (!c) return fail(NO_FILE_ID);
      const vence = fecha(c.pass_expires);
      const estado = PASS_LABEL[passStatus(vence, todayISO())];
      const precio = planPrice(c.plan);
      const online = canPayOnline(c) && mpConfigured();
      // Sin la nota interna ni quién lo cargó: son del equipo.
      const pagos = (await listPayments(args.cantidad, id)).map((p) => ({
        fecha: dateOf(p.at),
        monto: money(p.amount, p.currency),
        medio: METHOD_LABEL[p.method].es,
        estado: p.status === "approved" ? "aprobado" : p.status === "cancelled" ? "anulado" : MP_IN_PROCESS.includes(p.mp_status ?? "") ? "en proceso" : "para revisar",
        pase_hasta: p.status === "approved" ? fecha(p.pass_after) : null,
      }));
      return reply({
        ok: true,
        mensaje:
          `${vence ? `Tu pase vence el ${longDate(vence)} (${estado.toLowerCase()}).` : "Tu pase no tiene vencimiento cargado."}` +
          (precio ? ` El plan ${precio.name} cuesta ${money(precio.amount, precio.currency)} por mes.` : "") +
          (online ? ` Podés pagarlo con Mercado Pago desde Mi Portal: ${SITE}/portal/mi-progreso.` : "") +
          (pagos.length ? ` Último pago: ${pagos[0].monto} el ${longDate(pagos[0].fecha)} (${pagos[0].estado}).` : " Todavía no hay pagos registrados."),
        plan: c.plan,
        vence_pase: vence,
        estado_pase: estado,
        precio: precio ? money(precio.amount, precio.currency) : null,
        pagar_online: online ? `${SITE}/portal/mi-progreso` : null,
        pagos,
      });
    }
  );

  return server;
}
