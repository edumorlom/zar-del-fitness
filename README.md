# Zar del Fitness

| Carpeta | Qué es | Dónde se publica |
|---|---|---|
| [`site/`](site/) | Un solo proyecto y un solo build de Next.js para el sitio [zardelfitness.com.ar](https://zardelfitness.com.ar/) y el portal de los clientes [mi.zardelfitness.com.ar](https://mi.zardelfitness.com.ar/) | Railway, con [GitHub Actions](.github/workflows/deploy.yml), en cada push a `main` que cambie `site/` o `db/` |
| [`db/`](db/) | Lo que puede cambiar (precios, planes, horarios, contacto, preguntas frecuentes, equipo, textos, blog y podcasts) | Con el sitio y el portal |

La base de datos (Postgres) y el bucket de las fotos del portal son servicios aparte en Railway.

Cada carpeta tiene su propio README.
