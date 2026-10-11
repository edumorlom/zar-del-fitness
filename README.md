# Zar del Fitness

| Carpeta | Qué es | Dónde se publica |
|---|---|---|
| [`assistant/`](assistant/) | Asistente telefónico (Twilio + OpenAI), en Python | Railway, en cada push a `main` que cambie `assistant/` |
| [`site/`](site/) | Sitio web [zardelfitness.com.ar](https://zardelfitness.com.ar/), en Next.js | cPanel por FTP, con [GitHub Actions](.github/workflows/ftp-deploy.yml), en cada push a `main` que cambie `site/` |

Cada carpeta tiene su propio README con la instalación.
