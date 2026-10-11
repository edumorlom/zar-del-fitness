# Datos de Zar del Fitness

Lo que puede cambiar, en un solo lugar: lo usan el sitio (`site/lib/content.ts`) y el asistente telefónico (`assistant/assistant/db.py`). Un cambio acá, al hacer push a `main`, vuelve a publicar los dos.

| Archivo | Qué tiene |
|---|---|
| `planes.json` | Los planes: nombre, precios, formas de pago, descripción y qué incluyen. |
| `horarios.json` | Días y turnos del gimnasio, último ingreso y duración de la clase. |
| `gimnasio.json` | Dirección, WhatsApp, email, redes y la cantidad de personas evaluadas. |
| `preguntas.json` | Las preguntas frecuentes. |
| `equipo.json` | Los entrenadores. |

## Planes (`planes.json`)

| Campo | Qué es | Dónde se ve |
|---|---|---|
| `id` | Identificador del plan. No cambiarlo: el sitio lo usa para elegir qué planes muestra. | — |
| `nombre`, `nombreCompleto` | Nombre corto, y el oficial (opcional). | Sitio: el corto. Asistente: el oficial, si hay. |
| `etiqueta` | Por ejemplo "Presencial · The VIP". | Sitio y asistente. |
| `precios` | Lista de `{ "monto": 450000, "moneda": "ARS" }`. El primero es el principal. | Sitio: el primero. Asistente: todos. |
| `periodo` | Por ejemplo "por mes". | Asistente. |
| `formasDePago` | Opcional. | Asistente. |
| `resumen` | Una o dos frases. | Sitio (tarjeta) y asistente. |
| `descripcion` | Opcional. Del Sistema Premium, es el texto de la sección The VIP. | Sitio (The VIP) y asistente. |
| `destacados` | Lista corta de lo que incluye. | Sitio (tarjeta), y el asistente si no hay `incluye`. |
| `incluye` | Opcional: la lista completa, de `{ "titulo": …, "texto": … }` (`texto` es opcional). | Asistente, y del Sistema Premium, la sección The VIP del sitio. |
| `detalles` | Opcional: más información, de `{ "titulo": …, "puntos": [ … ] }`. | Asistente. |

El sitio muestra los planes `reto-online`, `premium`, `general` y `reto-internacional`. Para mostrar uno nuevo, agregarlo en `site/lib/content.ts` (con su ilustración y su botón).

## Cosas a tener en cuenta

- Los horarios van en formato de 24 horas, con dos dígitos: `"08:00"`, `"14:30"`.
- Los días van en minúscula y con tilde: `"miércoles"`, `"sábado"`.
- Una persona nueva en `equipo.json` necesita su foto en `site/public/img/` y en `site/lib/content.ts`; si falta, el sitio no se construye y avisa.
- Una red nueva en `gimnasio.json` necesita su ícono en `site/lib/content.ts`; si falta, el sitio no se construye y avisa.
- Hay textos que repiten un dato a mano, como el destacado "Lunes a viernes, clases de 1 h 20 min" del Sistema General Dirigido: revisarlos si cambia el horario.
