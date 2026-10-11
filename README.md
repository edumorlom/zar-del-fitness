# Zar del Fitness

| Carpeta | Qué es | Dónde se publica |
|---|---|---|
| [`assistant/`](assistant/) | Asistente telefónico (Twilio + OpenAI), en Python | Railway, en cada push a `main` que cambie `assistant/` o `db/` |
| [`site/`](site/) | Sitio web [zardelfitness.com.ar](https://zardelfitness.com.ar/), en Next.js | cPanel por FTP, con [GitHub Actions](.github/workflows/ftp-deploy.yml), en cada push a `main` que cambie `site/` o `db/` |
| [`db/`](db/) | Lo que puede cambiar (precios, planes, horarios, contacto, preguntas frecuentes, equipo), en JSON. Lo usan el sitio y el asistente | Con el sitio y con el asistente |

Cada carpeta tiene su propio README con la instalación.
