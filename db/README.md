# Datos de Zar del Fitness

Lo que puede cambiar, en un solo lugar: lo usan el sitio (`site/lib/content.ts`) y el asistente telefónico (`assistant/assistant/db.py`). Un cambio acá, al hacer push a `main`, vuelve a publicar los dos.

| Archivo | Qué tiene |
|---|---|
| `planes.json` | Los planes: nombre, precios, formas de pago, descripción y qué incluyen. |
| `horarios.json` | Días y turnos del gimnasio, último ingreso y duración de la clase. |
| `gimnasio.json` | Dirección (con código postal), coordenadas del gimnasio para Google Maps, WhatsApp, redes y la cantidad de personas evaluadas. |
| `preguntas.json` | Las preguntas frecuentes. |
| `equipo.json` | Los entrenadores. |
| `textos.json` | Los párrafos del sitio: la descripción y los destacados del inicio, el lema, la historia y la cita de Ronald, los pasos del método y las introducciones de Programas, Equipo y Preguntas. |
| `trayectoria.json` | La prensa (medio, título, tipo, link e imagen) y los premios (fecha, título y texto). |
| `blog/` | Las notas del blog, una por archivo Markdown (ver abajo). Sólo las usa el sitio. |
| `img/` | Las imágenes del sitio. En los JSON se nombran como `/img/archivo.webp`. Las del blog van en `img/blog/`. |

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

## Textos (`textos.json`) y trayectoria (`trayectoria.json`)

- Los párrafos pueden tener `*cursiva*` y `**negrita**`, como en Markdown.
- Cada destacado del inicio (`inicio.destacados`, como "Online $100.000") tiene un `titulo` y, o bien `precioDelPlan` con el `id` de un plan (muestra su precio), o bien un `texto`.
- En la prensa, `link` es opcional. La `imagen` es la que aparece al pasar el mouse, y va en `db/img/`.
- La nota con `destacadoEnInicio` aparece también en el inicio, con ese texto ("Emmy Winner 2024"). Si ninguna lo tiene, no se muestra.
- El asistente usa todo menos los pasos del método, las introducciones de Programas y Preguntas, los destacados del inicio, los links y las imágenes.

## Blog (`blog/`)

Cada nota es un archivo `.md` (Markdown). El nombre del archivo es el final de su URL: `blog/gluteos-de-acero.md`
con fecha `2020-12-15` se publica en `zardelfitness.com.ar/2020/12/15/gluteos-de-acero/` (la misma URL que tenía en
el sitio anterior). Arriba de todo lleva este encabezado, un dato por línea:

```
---
titulo: Glúteos de acero
fecha: 2020-12-15
autor: Ronald Medina
categoria: Entrenamiento
descripcion: Lo que muestra Google debajo del título: una o dos frases, de 140 a 160 caracteres.
imagen: /img/blog/gluteos-de-acero.webp
---
```

- Debajo va el texto. Los subtítulos van con `##` (nunca `#`: el título ya es el de arriba), y las imágenes con
  `![qué se ve](/img/blog/archivo.webp)`.
- Todas las imágenes del blog van en `img/blog/` y en WebP.
- Si el autor es `Ronald Medina`, la nota muestra su recuadro y enlaza a su página.
- Una nota nueva aparece sola en el blog, en "Más notas" y en el mapa del sitio para Google (`sitemap.xml`).

## Cosas a tener en cuenta

- Los horarios van en formato de 24 horas, con dos dígitos: `"08:00"`, `"14:30"`.
- Los días van en minúscula y con tilde: `"miércoles"`, `"sábado"`.
- Una persona nueva en `equipo.json` necesita su foto en `db/img/` y en `site/lib/content.ts`; si falta, el sitio no se construye y avisa.
- Una red nueva en `gimnasio.json` necesita su ícono en `site/lib/content.ts`; si falta, el sitio no se construye y avisa.
- Hay textos que repiten un dato a mano: revisarlos si cambia ese dato.
  - El destacado "Lunes a viernes, clases de 1 h 20 min" del Sistema General Dirigido (`planes.json`) repite el horario.
  - El destacado "Presencial: Colegiales, CABA" del inicio (`textos.json`) repite el barrio.
  - El párrafo de Ronald dice "casi dos mil personas", y el contador del sitio usa `personasEvaluadas` (`gimnasio.json`).
  - Las descripciones para Google de cada página están en su `site/app/…/page.tsx` y nombran lo que incluye cada
    programa y el "Emmy Winner 2024" (la de Ronald).
