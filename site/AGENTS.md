<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Mantené `llms.txt` actualizado

Cuando termines de cambiar algo que se ve en el sitio o en `db/`, actualizá también `llms.txt` en el mismo cambio. `/llms.txt` (`app/llms.txt/route.ts`) es el resumen en Markdown que leen ChatGPT, Claude, Perplexity y otros asistentes: si cambian precios, planes, horarios, dirección, formas de pago, preguntas frecuentes, blog o podcasts, tiene que reflejarlo.

- Los datos no se copian a mano en el route: salen de `db/` (`content(lang)`), en castellano y en inglés. Si corregís un precio o un plan, va en `db/planes.json`; el resto, en su archivo de `db/` (los textos de esta sección están en `db/textos.json`, `seo.llms`).
- Si agregás un dato o una sección nueva (por ejemplo, una forma de pago o una condición del servicio), agregalo a `db/textos.json` (`seo.llms`) en los dos idiomas y hacelo salir en `app/llms.txt/route.ts`. Lo que va en `seo.llms` no se ve en el sitio: sólo sale en `/llms.txt`.
- Antes de terminar, corré `npm run build` y revisá `site/.next/server/app/llms.txt.body` (o `/llms.txt` con `npm run dev`) para confirmar que el cambio aparece.
