# Zar del Fitness

| Carpeta | Qué es | Dónde se publica |
|---|---|---|
| [`site/`](site/) | Un solo proyecto de Next.js con dos builds: el sitio [zardelfitness.com.ar](https://zardelfitness.com.ar/) (estático) y el portal de los clientes [mi.zardelfitness.com.ar](https://mi.zardelfitness.com.ar/) (con servidor: Clerk y Postgres) | Los dos con [GitHub Actions](.github/workflows/ftp-deploy.yml), en cada push a `main` que cambie `site/` o `db/`: el sitio a cPanel por FTP y a Railway, el portal a Railway |
| [`db/`](db/) | Lo que puede cambiar (precios, planes, horarios, contacto, preguntas frecuentes, equipo, textos, blog y podcasts) | Con el sitio y el portal |

Cada carpeta tiene su propio README.
