# Zar del Fitness — sitio y portal

Rediseño de [zardelfitness.com.ar](https://zardelfitness.com.ar/) con Next.js 16 (App Router), GSAP + ScrollTrigger y Lenis.
Mantiene la paleta original: negro `#000 / #131313 / #1B1B1B`, dorado `#988858 / #A7892F / #D6A61D`, plata `#DCDCDC`.

En el mismo proyecto está el portal de los clientes, [mi.zardelfitness.com.ar](https://mi.zardelfitness.com.ar/) (ver
[Portal](#portal)): una sola instalación de Next.js (`package.json`, `node_modules`, `next.config.ts`) con dos builds.

```bash
npm install
npm run dev            # el sitio, en http://localhost:3000
npm run dev:portal     # el portal, en http://localhost:3001 (con .env.local: ver Portal)
npm run build          # build del sitio (página 100% estática, en out/)
npm run build:portal   # build del portal (servidor, en .next-portal/standalone/)
npm run lint
npm test               # pruebas del portal
npm run check          # todo lo anterior, como en el despliegue
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
| Redirecciones de las URLs del sitio anterior | `public/.htaccess` |

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
mi cuenta, guías, categorías, archivos por fecha) responden 410, para que Google las saque. Todo en `public/.htaccess`.

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

El portal de los clientes y del equipo (progreso, evaluaciones, turnos, fichas), en
[mi.zardelfitness.com.ar](https://mi.zardelfitness.com.ar/). Necesita servidor (Clerk para el ingreso, Postgres, un
bucket para las fotos), así que no se puede exportar como el sitio: es otro build del mismo proyecto.

- `next.config.ts` elige el build con `PORTAL=1` (`npm run build:portal`). Cada uno toma sus archivos de Next.js por
  la extensión (`pageExtensions`): los del sitio son `page.tsx`, `layout.tsx`, `route.ts`…; los del portal,
  `page.portal.tsx`, `layout.portal.tsx`, `route.portal.ts`, `proxy.portal.ts` (Clerk) e `instrumentation.portal.ts`
  (crea las tablas al arrancar). Un archivo nuevo del portal tiene que terminar en `.portal.tsx` o `.portal.ts`: si no,
  es del sitio.
- Las páginas del portal están en `app/(portal)/`, con su layout raíz; sus componentes, `lib/`, los formularios
  (`actions.ts`, `agenda-actions.ts`) y los scripts de importación, en `portal/`, importados con `~/`. Usa los estilos,
  el menú, las animaciones y los datos del sitio (`@/`, `@db/`).
- Las variables (`.env.local` para `npm run dev:portal`; en producción, las del servicio del portal en Railway):
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `ADMIN_EMAIL` (el primer admin) y las del
  bucket (`BUCKET_ENDPOINT`, `BUCKET_NAME`, `BUCKET_ACCESS_KEY_ID`, `BUCKET_SECRET_ACCESS_KEY`).
- Sólo `/ingresar` se indexa, y está en el `sitemap.xml` del sitio (`app/sitemap.ts`); el `robots.txt` del portal
  (`app/robots.portal.ts`) nombra ese sitemap, que es lo que le permite nombrar una página de otro dominio.

## Despliegue

`.github/workflows/ftp-deploy.yml`, en cada push a `main` que cambie `site/` o `db/`: `npm run check` (lint, pruebas y
los dos builds; si uno falla, no se sube nada), y después:

1. el sitio (`out/`) a cPanel por FTP y a Railway (servicio `site`, Caddy: `deploy/Dockerfile` y `deploy/Caddyfile`);
2. el aviso a Bing de las páginas que cambiaron (`scripts/indexnow.mjs`);
3. el portal a Railway (servicio `portal`, o el de la variable `RAILWAY_PORTAL_SERVICE`): `scripts/portal-bundle.sh`
   arma el servidor con `deploy/portal.Dockerfile` y se sube con `railway up`, como el sitio. Railway no construye:
   la clave pública de Clerk tiene que estar en GitHub (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, variable o secret).

## Pendientes

- **Newsletter**: el formulario sólo valida y muestra un mensaje; conectarlo a un proveedor
  (`components/Newsletter.tsx`).
- **Inscripción**: los botones de inscripción abren WhatsApp con un mensaje prearmado (no hay checkout online).
- Revisar que los precios en `db/planes.json` sigan vigentes.
