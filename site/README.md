# Zar del Fitness — sitio

Rediseño de [zardelfitness.com.ar](https://zardelfitness.com.ar/) con Next.js 16 (App Router), GSAP + ScrollTrigger y Lenis.
Mantiene la paleta original: negro `#000 / #131313 / #1B1B1B`, dorado `#988858 / #A7892F / #D6A61D`, plata `#DCDCDC`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción (página 100% estática)
npm run lint
```

## Dónde editar

| Qué | Dónde |
| --- | --- |
| Precios, planes, horarios, contacto, redes, preguntas frecuentes, equipo | `../db/` (compartido con el asistente) |
| Todos los textos del sitio, en castellano y en inglés: botones, menú, títulos, SEO | `../db/textos.json` (ver `../db/README.md`) |
| Links, fotos, qué planes se muestran | `lib/content.ts` |
| Colores, tipografía, botones | `app/globals.css` (tokens en `:root`) |
| Secciones | `components/*.tsx` + su `*.module.css` |
| Imágenes | `../db/img/` (WebP). Se copian a `public/img/` antes de `dev` y `build`, con copias más chicas en WebP para cada ancho de pantalla (`scripts/copy-images.mjs`; `next/image` las elige con `lib/image-loader.ts`). |
| Notas del blog | `../db/blog/`, y en inglés `../db/blog/en/` (ver `../db/README.md`) |
| SEO: título y descripción | `../db/textos.json` (`seo`) |
| SEO: datos estructurados (Google), hreflang, sitemap, robots | `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts` |
| Imágenes para compartir (WhatsApp, redes) | `opengraph-image.tsx` de cada página, con el diseño de `lib/og.tsx` |
| Redirecciones de las URLs del sitio anterior | `public/.htaccess` |

## Idiomas

El sitio está en castellano en la raíz (`/`) y en inglés en `/en/`, con las mismas páginas: `/en/`,
`/en/blog/` y cada nota traducida en `/en/año/mes/día/nota-en-ingles/`. `/es/` redirige a `/`.

- Cada idioma tiene su layout raíz, con su `<html lang>`: `app/(es)/layout.tsx` y `app/(en)/layout.tsx` (los dos
  usan `components/RootShell.tsx`). Las páginas de cada idioma son archivos cortos que llaman al mismo componente
  con `lang` (`components/HomePage.tsx`, `BlogIndex.tsx`, `BlogPost.tsx`).
- La 404 es una sola, en castellano con una línea en inglés: `app/global-not-found.tsx`.
- `content(lang)` (`lib/content.ts`) devuelve todo resuelto en un idioma. Los textos de `db/` vienen en los dos
  (`{ "es": …, "en": … }`); si falta uno, el sitio no se construye y dice cuál (`lib/i18n.ts`).
- Los componentes de cliente (`"use client"`) reciben sus textos por props, para no mandar `db/` entero al
  navegador.
- Cada página dice cuál es su versión en el otro idioma (`<link rel="alternate" hreflang>`, también en
  `sitemap.xml`), y el botón "EN"/"ES" del menú lleva ahí.

## Páginas

El sitio es una sola página (`/`, todas las secciones) más el blog: `/blog/` y cada nota en `/año/mes/día/nota/`
(`../db/blog/`), las mismas URLs que tenían en el sitio anterior en WordPress, para no perder lo que Google ya
había indexado. Las páginas viejas cuyo contenido hoy es una sección del inicio redirigen ahí (301: por ejemplo
`/entrenamiento-online/` → `/#programas`, `/sobre-ronald/` → `/#zar`); las que ya no existen (tienda, carrito,
mi cuenta, guías, categorías) responden 410, para que Google las saque. Todo en `public/.htaccess`.

Entre páginas se navega con `<a>` común y no con `<Link>`: cada página carga completa, así Lenis, GSAP y las
secciones fijadas arrancan de cero. Los links del menú son `/#seccion` (`/en/#seccion`): desde otra página abren el inicio
sin el preloader y bajan a la sección (ver `components/RootShell.tsx` y `components/motion/MotionProvider.tsx`).

## Animaciones

- `components/motion/Reveals.tsx`: controlador global. Las secciones son Server Components y declaran su
  animación con atributos: `data-lines`, `data-reveal` (`="left"`, `="scale"`), `data-reveal-stagger`,
  `data-reveal-img`, `data-speed`, `data-words`, `data-count`, `data-magnetic`.
- Preloader (contador 00→25, sólo en el inicio), intro del hero, cursor dorado, scroll suave (Lenis), cintas infinitas que
  reaccionan a la velocidad del scroll, sección "Cómo funciona" fijada con scroll horizontal y contador de días,
  galería de transformaciones con lightbox, lista de prensa con preview que sigue al cursor.
- Respeta `prefers-reduced-motion`: sin preloader ni scroll suave, contenido visible de inmediato.

## Pendientes

- **Newsletter**: el formulario sólo valida y muestra un mensaje; conectarlo a un proveedor
  (`components/Newsletter.tsx`).
- **Inscripción**: los botones de inscripción abren WhatsApp con un mensaje prearmado (no hay checkout online).
- Revisar que los precios en `db/planes.json` sigan vigentes.
