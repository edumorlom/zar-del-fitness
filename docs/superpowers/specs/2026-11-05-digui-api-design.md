# API del portal para Digui: diseño

Fecha: 2026-11-05. Estado: borrador, para revisar antes de planear.

## Por qué
La recepcionista del Zar en Digui (por teléfono y en el chat del portal) tiene que poder **ver horarios libres, ver los turnos de quien llama y pedir un turno**. Hoy el portal no tiene API: los turnos se piden con acciones del servidor, detrás del login de Clerk (`portal/agenda-actions.ts`). Digui va a llamar a esta API con su nuevo conector de API (diseño en el repo de Digui: `docs/superpowers/specs/2026-11-05-api-connector-design.md`). Esta API es su primer caso real.

## Objetivos
Tres rutas en `mi.zardelfitness.com.ar`, bajo `/api/digui/` (en `app/(portal)/portal/api/digui/`), en JSON:

1. **`GET` horarios libres** de un día (`?dia=AAAA-MM-DD`): las horas de inicio libres, con las mismas reglas que la agenda del portal (`portal/lib/slots.ts`: `freeSlots` con los turnos tomados y lo ocupado en Google; `SLOT_MINUTES`, `MIN_HOURS_AHEAD`, `DAYS_AHEAD`). No pide saber quién es.
2. **`GET` mis turnos**: los turnos vivos y futuros (pedido o confirmado) del cliente, con día, hora y estado.
3. **`POST` pedir turno** (`{"inicio": "<ISO>"}`): el mismo pedido que hace el cliente desde el portal (`requestAppointment`). Queda **pedido** (`requested`) y el Zar o su coach lo confirma como hoy. Valen las mismas reglas: un solo turno vivo por cliente, el horario tiene que estar libre, y el índice único resuelve dos pedidos al mismo tiempo. Devuelve los mismos mensajes.

Las respuestas traen un `mensaje` en español, listo para que la recepcionista lo diga ("Pedido: jueves 6 de noviembre a las 16:30 h. Te avisamos cuando esté confirmado.").

### El contrato *(lo decidimos nosotros: el conector de Digui lee esta documentación y se adapta, así que la forma la pone el Zar)*
| Ruta | Entrada | Respuesta `200` |
|---|---|---|
| `GET /api/digui/horarios` | `?dia=AAAA-MM-DD` | `{"ok": true, "horarios": ["16:00", "16:30", …], "mensaje": "…"}` |
| `GET /api/digui/turnos` | `?telefono=…` o `?customer_id=…` | `{"ok": true, "turnos": [{"dia": "AAAA-MM-DD", "hora": "16:30", "estado": "pedido" \| "confirmado"}], "mensaje": "…"}` |
| `POST /api/digui/turnos` | cuerpo JSON `{"inicio": "AAAA-MM-DDTHH:MM", "telefono": "…"}` o con `customer_id` | `{"ok": true, "mensaje": "Pedido: …"}` |

- Los resultados del negocio (horario tomado, ya tiene turno, no encontramos tu ficha, día fuera de rango, sin horarios) son **`200` con `"ok": false` y el `mensaje`**, para que la recepcionista lo diga tal cual. Solo son errores HTTP: `401` (clave), `400` (entrada que no se puede leer: fecha mal escrita, ni teléfono ni `customer_id` donde hacen falta).
- **`GET /api/digui`** (sin clave) devuelve esta misma documentación en texto, para que el Zar pegue ese link en el conector de Digui. No lleva ningún secreto.
- Las horas son de Argentina (`-03:00`), como en el portal.
- **Fechas:** pedir turno exige que el día esté entre hoy y `DAYS_AHEAD`, y no en el pasado, igual que horarios libres. El portal no lo controla al pedir (solo `bookableDays` al mostrar); en la API sí. *(Lo decidimos nosotros. El portal no se toca.)*
- **Google sin conectar:** igual que el portal (`busy()` en `null` cuenta como nada ocupado). Total, el turno queda pedido y el Zar lo confirma mirando su calendario. *(Lo decidimos nosotros.)*

## Quién es la persona
Lo dice Digui, nunca la IA: Digui pone el valor desde su servidor.
- **Por teléfono:** `telefono`, el número desde el que llamó. Alcanza con que coincida con el de un cliente del portal. *(Decisión del dueño, 2026-11-05: sin código por SMS.)* Se comparan los **últimos 7 dígitos** con `users.phone` de los clientes (`role = 'user'`). Así son el mismo número "+54 9 11 5555-1234", "11 5555-1234", "011 15 5555-1234" y "0351 15 555-1234" contra "+54 9 351 555-1234": el 9, el 0 y el 15 de los celulares argentinos quedan antes de esos 7 dígitos. *(Lo decidimos nosotros.)* Si no coincide ninguno, o coinciden dos o más, la respuesta es "No encontramos tu ficha con este número: pedí el turno desde el portal o escribile al Zar". Los teléfonos con menos de 7 dígitos no coinciden con nadie.
- **En el chat del portal:** `customer_id` (`users.id`), el que el portal ya firma para el chat de Digui (`portal/lib/digui.ts`) y que Digui verifica. Solo vale si es de un cliente (`role = 'user'`). El portal también firma el id de coaches y admins, pero esos piden turnos desde el portal: con ellos la respuesta es "No encontramos tu ficha…". *(Lo decidimos nosotros.)*
- Igual que en el portal, `active` y `pass_expires` no impiden pedir: el Zar decide al confirmar. *(Lo decidimos nosotros.)*

Mis turnos y pedir turno necesitan uno de los dos. Horarios libres no necesita ninguno.

## Autenticación
- Una clave secreta en la variable de Railway `DIGUI_API_KEY`, que el Zar pega en el conector de Digui. Se manda en un header (`Authorization: Bearer …`) y se compara en tiempo constante. Sin clave, o con una equivocada, la respuesta es 401. Sin la variable, la API no responde a nadie.
- Estas rutas quedan fuera del login de Clerk (`proxy.ts`), porque las llama el servidor de Digui y no una persona.

## No objetivos (primera versión)
- Cancelar o mover turnos por la API.
- Acciones de coach o admin (confirmar, rechazar).
- Crear el evento en Google: la confirmación sigue siendo manual en el portal.
- Datos del cliente más allá de sus turnos (el conector SQL de Digui ya lee lo demás).

## Anti-objetivos: un fracaso aunque todo lo demás funcione
- Alguien sin la clave pide turnos o ve turnos.
- Una respuesta muestra datos de otro cliente.
- Un pedido por la API se salta una regla que el portal sí aplica (un turno vivo, horario libre).

## Forma (el detalle lo decide quien lo construye)
- La lógica de pedir turno se comparte entre la acción del portal y la API, para que las reglas no se separen. Hoy está en `requestAppointment`, pegada a `requireViewer`.
- Tests como los `*.test.ts` del portal. Tienen que cubrir: sin clave o clave equivocada (401); el teléfono en varios formatos; teléfono sin coincidencia o con dos; un cliente que ya tiene turno vivo; un horario tomado; y que mis turnos devuelve solo los suyos.

## Sin revisar todavía
En qué formato están guardados hoy los teléfonos en `users.phone`, y cuántos clientes comparten los últimos 7 dígitos o no tienen teléfono. Antes de lanzar hay que contarlos en la base (solo leer). Si hay muchos, se arreglan las fichas a mano. No se migra nada en esta versión.
