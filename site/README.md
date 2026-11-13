# Zar del Fitness — sitio y portal

Rediseño de [zardelfitness.com.ar](https://zardelfitness.com.ar/) con Next.js 16 (App Router), GSAP + ScrollTrigger y Lenis.
Mantiene la paleta original: negro `#000 / #131313 / #1B1B1B`, dorado `#988858 / #A7892F / #D6A61D`, plata `#DCDCDC`.

En el mismo proyecto y el mismo build está el portal de los clientes,
en `/portal/` (ver [Portal](#portal)): un solo servidor de Next.js en Railway sirve los dos.

```bash
npm install
npm run dev      # el sitio en http://localhost:3000 y el portal en http://localhost:3000/portal (con .env.local: ver Portal)
npm run build    # el build de producción (servidor en .next/standalone/; las páginas del sitio, estáticas)
npm start        # ese build, en http://localhost:3000
npm run lint
npm test         # pruebas del portal
npm run check    # lint, pruebas y build, como en el despliegue
```

## Dónde editar

| Qué | Dónde |
| --- | --- |
| Precios, planes, horarios, contacto, redes, preguntas frecuentes, equipo | `../db/` |
| Todos los textos del sitio, en castellano y en inglés: botones, menú, títulos, SEO | `../db/textos.json` (ver `../db/README.md`) |
| Links, fotos, qué planes se muestran | `lib/content.ts` |
| Colores, tipografía, botones | `app/globals.css` (tokens en `:root`) |
| Secciones | `components/*.tsx` + su `*.module.css` |
| Imágenes | `../db/img/` (WebP). Se copian a `public/img/` antes de `dev` y `build`, con copias más chicas en WebP para cada ancho de pantalla (`scripts/copy-images.mjs`; `next/image` las elige con `lib/image-loader.ts`). |
| Notas del blog | `../db/blog/`, y en inglés `../db/blog/en/` (ver `../db/README.md`) |
| Episodios del podcast | `../db/podcasts.json` (ver `../db/README.md`) |
| SEO: título y descripción | `../db/textos.json` (`seo`) |
| SEO: datos estructurados (Google), hreflang, sitemap, robots | `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts` |
| Buscadores con IA (ChatGPT, Claude, Perplexity): el sitio resumido en Markdown | `app/llms.txt/route.ts` (sale de `../db/`) |
| Aviso a Bing de las páginas que cambiaron, en cada despliegue (IndexNow) | `scripts/indexnow.mjs`; la clave es `public/<clave>.txt` |
| Ícono del sitio (pestaña, Google) | `app/icon.svg`; `app/favicon.ico` y `app/icon1.png` salen de ahí con `node scripts/favicons.mjs` |
| Imágenes para compartir (WhatsApp, redes) | `opengraph-image.tsx` de cada página, con el diseño de `lib/og.tsx` |
| Redirecciones de las URLs del sitio anterior | `proxy.ts` |

## Idiomas

El sitio está en castellano en la raíz (`/`) y en inglés en `/en/`, con las mismas páginas: `/en/`,
`/en/blog/`, cada nota traducida en `/en/año/mes/día/nota-en-ingles/`, `/en/podcasts/` y cada episodio en
`/en/podcasts/<id>/`. `/es/` redirige a `/`.

- Cada idioma tiene su layout raíz, con su `<html lang>`: `app/(es)/layout.tsx` y `app/(en)/layout.tsx` (los dos
  usan `components/RootShell.tsx`). Las páginas de cada idioma son archivos cortos que llaman al mismo componente
  con `lang` (`components/HomePage.tsx`, `BlogIndex.tsx`, `BlogPost.tsx`, `PodcastIndex.tsx`, `PodcastEpisode.tsx`).
- La 404 es una sola, en castellano con una línea en inglés: `app/global-not-found.tsx`.
- `content(lang)` (`lib/content.ts`) devuelve todo resuelto en un idioma. Los textos de `db/` vienen en los dos
  (`{ "es": …, "en": … }`); si falta uno, el sitio no se construye y dice cuál (`lib/i18n.ts`).
- Los componentes de cliente (`"use client"`) reciben sus textos por props, para no mandar `db/` entero al
  navegador.
- Cada página dice cuál es su versión en el otro idioma (`<link rel="alternate" hreflang>`, también en
  `sitemap.xml`), y el botón "EN"/"ES" del menú lleva ahí.

## Páginas

El sitio es una sola página (`/`, todas las secciones) más el blog y los podcasts.

El blog es `/blog/` y cada nota en `/año/mes/día/nota/` (`../db/blog/`), las mismas URLs que tenían en el sitio
anterior en WordPress, para no perder lo que Google ya había indexado. Se sacó el 2026-10-13 y volvió el 2026-10-20.

Los podcasts son `/podcasts/` y cada episodio en `/podcasts/<id>/` (`../db/podcasts.json`). Desde la lista, un click en un episodio abre el video en el modal y
cambia la URL a la de su página sin recargar (`components/motion/VideoLink.tsx`); entrando directo a esa URL (desde
Google o un link compartido) se ve la página del episodio, con el video embebido.

Las páginas viejas cuyo contenido hoy es una sección del inicio redirigen ahí (301: por ejemplo
`/entrenamiento-online/` → `/#programas`, `/sobre-ronald/` → `/#zar`); las que ya no existen (tienda, carrito,
mi cuenta, guías, categorías, archivos por fecha) responden 410, para que Google las saque. Todo en `proxy.ts`.

Entre páginas se navega con `<a>` común y no con `<Link>`: cada página carga completa, así Lenis, GSAP y las
secciones fijadas arrancan de cero. Los links del menú son `/#seccion` (`/en/#seccion`): desde otra página abren el inicio
y bajan a la sección (ver `components/RootShell.tsx` y `components/motion/MotionProvider.tsx`).

## Animaciones

- `components/motion/Reveals.tsx`: controlador global. Las secciones son Server Components y declaran su
  animación con atributos: `data-lines`, `data-reveal` (`="left"`, `="scale"`), `data-reveal-stagger`,
  `data-reveal-img`, `data-speed`, `data-words`, `data-count`, `data-magnetic`.
- Intro del hero, cursor dorado, scroll suave (Lenis), cintas infinitas que
  reaccionan a la velocidad del scroll, sección "Cómo funciona" fijada con scroll horizontal y contador de días,
  galería de transformaciones con lightbox, lista de prensa con preview que sigue al cursor.
- Respeta `prefers-reduced-motion`: sin scroll suave, contenido visible de inmediato.

## Portal

El portal de los clientes y del equipo (progreso, evaluaciones, turnos, fichas), en `/portal/`. Es parte del mismo
build que el sitio; lo que lo separa es la ruta: [zardelfitness.com.ar/portal](https://zardelfitness.com.ar/portal)
(`portalUrl` en `lib/content.ts`). El DNS de `zardelfitness.com.ar` está en Cloudflare, con el proxy (nube naranja) y
SSL "Full", delante de Railway:

- `proxy.ts`: `/portal/…` y `/archivos/…` (las fotos y certificados, así guardados en la base) van al portal, con
  Clerk, en cualquier dominio. `mi.` (o `mi.localhost` en desarrollo), el dominio de antes, sin `/portal` en las URLs,
  lleva a `/portal/…` en `mi.` (`/clientes` → `/portal/clientes`), salvo `/api/digui/…`. El resto, las reglas del sitio (las
  URLs viejas de WordPress, la `/` final, el `.com` y los `www`).
- Las páginas del portal están en `app/(portal)/portal/`, con su layout raíz en `app/(portal)/layout.tsx`. Adentro,
  los links y las redirecciones llevan `/portal` (`/portal/clientes`). Sus componentes, `lib/`, los
  formularios (`actions.ts`, `agenda-actions.ts`) y los scripts de importación están en `portal/`, importados con `~/`.
  Usa los estilos, el menú, las animaciones y los datos del sitio (`@/`, `@db/`).
- El sitio también sabe si hay sesión: el botón del menú dice "Mi Portal" o "Iniciar sesión" según Clerk, que se
  pregunta en el navegador al terminar la página (`components/Session.tsx`; el sitio es estático), lo mismo que vería
  el portal. Mientras Clerk no responde (o si falla), vale lo que dice su cookie `__client_uat`.
- Los turnos de control se piden y se mueven sólo a viernes, con un máximo de 5 pedidos o confirmados por día para
  todo el gimnasio. Cancelados y rechazados liberan cupo. Portal, API y MCP comparten la disponibilidad; un bloqueo
  transaccional por fecha impide superar el cupo con reservas simultáneas. Los horarios de apertura del gimnasio siguen en `db/horarios.json`.
- **Pagos** (`/portal/pagos`; las reglas en `portal/lib/payments.ts`): por ahora, sólo del plan Premium (`PAYABLE_PLANS`), al
  precio de `db/planes.json`. Cada pago aprobado extiende el pase (`pass_expires`) un mes: desde el vencimiento si todavía
  no pasó, o desde hoy si ya venció. El cliente Premium activo ve siempre en Mi progreso (su perfil) el botón para
  pagar con Mercado Pago, aunque no tenga vencimiento cargado (arranca hoy); 7 días antes de vencer (`PASS_DUE_DAYS`)
  el pase figura "por vencer". El pago va por Checkout Pro (`portal/lib/mercadopago.ts`); al aprobarse, el pase se extiende solo,
  con el aviso de Mercado Pago (`/portal/api/mercadopago`, sin Clerk: ver `proxy.ts`) o cuando el cliente vuelve al
  portal (`/portal/pago`), lo que llegue primero, y una sola vez. De los avisos no se cree nada: el pago se le pide a
  Mercado Pago con el access token. Si se devuelve, el pase vuelve a como estaba. El admin y recepción ven los pases y
  los pagos, y cargan los del local (efectivo o tarjeta); sólo el admin los anula.
- **Recordatorio de evaluación** (`portal/lib/reminders.ts`; las reglas y el correo en `portal/lib/reminder-email.ts`): al
  cliente Premium activo al que se le cumple un mes de su última evaluación le llega un correo para que pida el turno de
  la próxima, con su peso y % graso (contra la anterior) y el botón a `/portal/turno`. Es automático: el servidor se fija
  al arrancar y una vez por hora, de 9 a 21 h, sólo en producción. Uno por evaluación (`users.evaluation_reminder_on`):
  con una evaluación nueva, otro al mes de esa. No le llega si ya tiene un turno pedido o confirmado, o el próximo control
  puesto. Si Resend no lo acepta, se reintenta a la hora siguiente.
- `instrumentation.ts` crea las tablas que falten al arrancar el servidor. Si la base no responde, el servidor arranca
  igual: el sitio no depende de ella.
- Las variables (`.env.local` para `npm run dev`; en producción, las del servicio en Railway):
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ADMIN_EMAIL` (el primer admin) y las del
  bucket (`BUCKET_ENDPOINT`, `BUCKET_NAME`, `BUCKET_ACCESS_KEY_ID`, `BUCKET_SECRET_ACCESS_KEY`). `DIGUI_SIGNING_SECRET`
  (el secreto de firma de la cuenta de Digui): con ella, el chat de Digui sabe quién entró (cliente, coach o admin)
  (`portal/components/DiguiChat.tsx`), en el portal y también en el sitio, con una cookie que deja el portal
  (`portal/lib/digui-cookie.ts`; se borra al cerrar la sesión); sin ella, el chat es anónimo.
  `MP_ACCESS_TOKEN`: el access token de producción de la cuenta de Mercado Pago del Zar (Tus integraciones → la
  aplicación → Credenciales de producción); sin él, el botón de pagar no aparece y los pagos se cargan en el local. Los
  avisos no se configuran en el panel de Mercado Pago: cada pago lleva su `notification_url`.
  `DIGUI_API_KEY`: la clave que Digui manda como `Authorization: Bearer …` a la API de turnos (`/portal/api/digui/…`,
  y `/api/digui/…` en `mi.`, sin Clerk: ver `proxy.ts`); sin ella, esas rutas responden 401. Sirve para que Digui consulte horarios libres,
  vea los turnos de quien chatea y los pida. Las instrucciones para Digui están en `<portalUrl>/api/digui`. Con la misma clave, `<portalUrl>/api/digui/mcp` es un servidor MCP (Streamable HTTP, sin sesión; `portal/lib/mcp.ts`) con lo mismo como herramientas, más la ficha (sin datos de salud ni DNI) y las evaluaciones de la persona y la información del gimnasio, para conectarle a Digui u otro agente.
- Sólo `/portal/ingresar` se indexa, y está en el `sitemap.xml` del sitio (`app/sitemap.ts`); el `robots.txt` del portal
  (`app/(portal)/portal/robots.txt/route.ts`) nombra ese sitemap, que es lo que le permite nombrar una página de otro
  dominio.

## Despliegue

`.github/workflows/deploy.yml`, en cada push a `main` que cambie `site/` o `db/`: `npm run check` (lint, pruebas y
build), `scripts/deploy-bundle.sh` arma el servidor con `deploy/Dockerfile` y `railway up` lo sube al servicio de
Railway (`portal`, o el de la variable `RAILWAY_SERVICE`), que tiene los dos dominios. Railway no construye: arma la
imagen con lo que ya se construyó en GitHub (con la historia de git, para las fechas del sitemap). Después, el aviso a
Bing de las páginas que cambiaron (`scripts/indexnow.mjs`).

En GitHub hacen falta `RAILWAY_TOKEN` (secret) y `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (variable o secret).

## Pendientes

- **Newsletter**: el formulario sólo valida y muestra un mensaje; conectarlo a un proveedor
  (`components/Newsletter.tsx`).
- **Inscripción**: los botones de inscripción abren WhatsApp con un mensaje prearmado (no hay checkout online).
- Revisar que los precios en `db/planes.json` sigan vigentes.
