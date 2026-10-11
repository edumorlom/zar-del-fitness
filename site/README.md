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
| Textos, links, fotos, qué planes se muestran, prensa | `lib/content.ts` |
| Colores, tipografía, botones | `app/globals.css` (tokens en `:root`) |
| Secciones | `components/*.tsx` + su `*.module.css` |
| Imágenes | `../db/img/` (WebP). Se copian a `public/img/` antes de `dev` y `build`. |
| Notas del blog | `../db/blog/` (ver `../db/README.md`) |
| SEO: título y descripción | `export const metadata` en `app/page.tsx` (inicio) y `app/blog/page.tsx` |
| SEO: datos estructurados (Google), sitemap, robots | `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts` |
| Imágenes para compartir (WhatsApp, redes) | `opengraph-image.tsx` de cada página, con el diseño de `lib/og.tsx` |
| Redirecciones de las URLs del sitio anterior | `public/.htaccess` |

## Páginas

El sitio es una sola página (`/`, todas las secciones) más el blog: `/blog/` y cada nota en `/año/mes/día/nota/`
(`../db/blog/`), las mismas URLs que tenían en el sitio anterior en WordPress, para no perder lo que Google ya
había indexado. Las páginas viejas cuyo contenido hoy es una sección del inicio redirigen ahí (301: por ejemplo
`/entrenamiento-online/` → `/#programas`, `/sobre-ronald/` → `/#zar`); las que ya no existen (tienda, carrito,
mi cuenta, guías, categorías) responden 410, para que Google las saque. Todo en `public/.htaccess`.

Entre páginas se navega con `<a>` común y no con `<Link>`: cada página carga completa, así Lenis, GSAP y las
secciones fijadas arrancan de cero. Los links del menú son `/#seccion`: desde otra página abren el inicio sin el
preloader y bajan a la sección (ver `app/layout.tsx` y `components/motion/MotionProvider.tsx`).

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
