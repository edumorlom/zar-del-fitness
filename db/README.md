# Datos de Zar del Fitness

Lo que puede cambiar, en un solo lugar: lo usan el sitio (`site/lib/content.ts`) y el asistente telefónico (`assistant/assistant/db.py`). Un cambio acá, al hacer push a `main`, vuelve a publicar los dos.

## Castellano e inglés

El sitio está en castellano (`zardelfitness.com.ar/`) y en inglés (`zardelfitness.com.ar/en/`). Todo texto que se ve en el sitio va en los dos idiomas, uno al lado del otro:

```json
"boton": { "es": "Inscribirme", "en": "Sign me up" }
```

- Una lista va igual: `{ "es": ["…", "…"], "en": ["…", "…"] }`. Las dos listas no tienen que tener el mismo largo.
- Si a un texto del sitio le falta un idioma, el sitio no se construye y dice cuál es (archivo y campo).
- Lo que sólo usa el asistente (por ejemplo `periodo`, `formasDePago` o `detalles` de los planes, o el plan Lipo, que el sitio no muestra) va sólo en castellano, como un texto común.
- El asistente telefónico habla sólo castellano: usa el `"es"` de cada texto.
- Los ids, precios, links, nombres de personas y de medios no se traducen: van una sola vez.

| Archivo | Qué tiene |
|---|---|
| `planes.json` | Los planes: nombre, precios, formas de pago, descripción y qué incluyen. |
| `horarios.json` | Días y turnos del gimnasio, último ingreso y duración de la clase. |
| `gimnasio.json` | Dirección (con código postal), coordenadas del gimnasio para Google Maps, WhatsApp, redes y la cantidad de personas evaluadas. |
| `preguntas.json` | Las preguntas frecuentes. |
| `equipo.json` | Los entrenadores. |
| `textos.json` | Todos los textos del sitio, por sección, en castellano y en inglés: botones, menú, títulos, párrafos, textos alternativos de las fotos, los mensajes que se arman para WhatsApp, y el título y la descripción de cada página para Google (`seo`). |
| `trayectoria.json` | La prensa (medio, título, tipo, link e imagen) y los premios (fecha, título y texto). |
| `blog/` | Las notas del blog, una por archivo Markdown (ver abajo). Las traducciones al inglés, en `blog/en/`. Sólo las usa el sitio. |
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

Los campos que se ven en el sitio van en castellano y en inglés: `nombre`, `etiqueta`, `resumen` y `destacados` de los cuatro planes que muestra, y del Sistema Premium también `descripcion` e `incluye`.

El sitio muestra los planes `reto-online`, `premium`, `general` y `reto-internacional`. Para mostrar uno nuevo, agregarlo en `site/lib/content.ts` (con su ilustración y su botón).

## Textos (`textos.json`) y trayectoria (`trayectoria.json`)

- Los párrafos pueden tener `*cursiva*` y `**negrita**`, como en Markdown.
- Los títulos de las secciones son una lista de líneas: `["Soy Ronald Medina,", "*el Zar del Fitness.*"]`. La línea entre asteriscos es la destacada, en dorado.
- Algunos textos tienen marcadores entre llaves, como `"Último ingreso {horas}."`: el sitio los reemplaza por el dato. Hay que dejarlos tal cual, en los dos idiomas.
- `seo.palabrasClave` son las búsquedas a las que apunta el inicio ("mejor entrenador personal", …). No se ven en el sitio: van en los datos para Google y otros buscadores. La frase que más pesa es la de la descripción del inicio (`seo.inicio.descripcion`), que Google muestra debajo del título.
- `general.leerEn` es el botón para cambiar de idioma: cada uno está en su idioma ("Leer en español", "Read in English") y se muestra en la página del otro.
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
- Si el autor es `Ronald Medina`, la nota muestra su recuadro y enlaza a su sección del inicio.
- Una nota nueva aparece sola en el blog, en "Más notas" y en el mapa del sitio para Google (`sitemap.xml`).

### En inglés (`blog/en/`)

La traducción de una nota es otro archivo, en `blog/en/`, con un nombre en inglés (que es el final de su URL): `blog/en/steel-glutes.md` se publica en `zardelfitness.com.ar/en/2020/12/15/steel-glutes/`. El encabezado tiene los mismos datos (en castellano los nombres, en inglés los valores) más `original`, el nombre del archivo de la nota en castellano, sin `.md`:

```
---
titulo: Steel Glutes
fecha: 2020-12-15
autor: Ronald Medina
categoria: Training
descripcion: In English, 140 to 160 characters.
imagen: /img/blog/gluteos-de-acero.webp
original: gluteos-de-acero
---
```

- `fecha`, `autor` e `imagen` son los de la nota original. Las categorías en inglés son `Training`, `Nutrition` y `Myths`.
- Con `original`, las dos notas se enlazan entre sí: el botón "EN"/"ES" lleva de una a la otra, y Google sabe que son la misma nota.
- Una nota en castellano sin traducir no aparece en el blog en inglés, y su botón "EN" lleva al blog en inglés.

## Cosas a tener en cuenta

- Los horarios van en formato de 24 horas, con dos dígitos: `"08:00"`, `"14:30"`.
- Los días van en minúscula y con tilde: `"miércoles"`, `"sábado"`.
- Una persona nueva en `equipo.json` necesita su foto en `db/img/` y en `site/lib/content.ts`; si falta, el sitio no se construye y avisa.
- Una red nueva en `gimnasio.json` necesita su ícono en `site/lib/content.ts`; si falta, el sitio no se construye y avisa.
- Hay textos que repiten un dato a mano: revisarlos si cambia ese dato.
  - El destacado "Lunes a viernes, clases de 1 h 20 min" del Sistema General Dirigido (`planes.json`) repite el horario.
  - El destacado "Presencial: Colegiales, CABA" del inicio (`textos.json`) repite el barrio, en los dos idiomas.
  - El párrafo de Ronald dice "casi dos mil personas", y el contador del sitio usa `personasEvaluadas` (`gimnasio.json`).
  - La descripción para Google del inicio (`seo.inicio` en `textos.json`) y la del negocio (`seo.negocio`) repiten el
    barrio y el gimnasio, y la de Ronald (`certificaciones` en `equipo.json`) repite sus certificaciones.
  - Los mensajes de WhatsApp (`whatsapp` en `textos.json`) nombran los planes.
