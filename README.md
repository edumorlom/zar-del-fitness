# Zar del Fitness

| Carpeta | Qué es | Dónde se publica |
|---|---|---|
| [`site/`](site/) | Sitio web [zardelfitness.com.ar](https://zardelfitness.com.ar/), en Next.js | cPanel por FTP, con [GitHub Actions](.github/workflows/ftp-deploy.yml), en cada push a `main` que cambie `site/` o `db/` |
| [`db/`](db/) | Lo que puede cambiar (precios, planes, horarios, contacto, preguntas frecuentes, equipo, textos, blog y podcasts) | Con el sitio |

Cada carpeta tiene su propio README.
