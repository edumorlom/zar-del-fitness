# Asistente telefónico de Zar del Fitness

Atiende las llamadas con un asistente de voz con IA que conoce la información del gimnasio y habla el idioma de quien llama.

```
Quien llama ──► número de Twilio ──► este servidor (FastAPI) ◄──► OpenAI GPT-Live (escucha y habla)
                                                                       │ delega
                                                                       ▼
                                                     modelo backend (transfiere y agenda, con tools.py)
```

El modelo de voz, `gpt-live-1`, conversa con quien llama y responde con la información del gimnasio. Cuando hay que pasar la llamada o agendar una visita, le delega la tarea a un modelo backend (`gpt-6-luna`), que usa las funciones de `tools.py` y le devuelve el resultado para que se lo diga a la persona.

| Archivo | Qué es |
|---|---|
| `instructions.md` | Cómo se comporta el asistente: tono, idioma, reglas y cuándo delegar tareas al backend ("Delegation policy"). Se puede editar libremente. |
| `knowledge/` | La información del gimnasio (horarios, precios, clases…), en archivos Markdown o de texto. El asistente la recibe completa en sus instrucciones al empezar cada llamada, así que responde sin buscar nada. |
| `main.py` | El servidor que conecta las llamadas con OpenAI. |
| `tools.py` | Las instrucciones del modelo backend y sus funciones: agendar una visita (que se envía por email al gimnasio) y pasar la llamada a recepción. |
| `test_call.py` | Para hablar con el asistente desde el micrófono, sin llamar. |

## Instalación

1. **Instalar** (con [uv](https://docs.astral.sh/uv/), que también descarga Python 3.15 si hace falta)
   ```sh
   uv sync
   ```

2. **Configurar:** `cp .env.example .env` y completar `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`.

3. **Cargar la información del gimnasio:** completar `knowledge/gym-info.md` y agregar cualquier otro archivo `.md` o `.txt` a `knowledge/`. El servidor los lee al arrancar: después de un cambio hay que reiniciarlo (en Railway, hacer push). Conviene que tengan solo lo que sabría alguien de recepción, porque cada llamada le envía todo a OpenAI.

4. **Exponer la computadora a internet** (Twilio tiene que poder llegar a ella):
   ```sh
   ngrok http 8000
   ```
   Poner la URL `https://….ngrok-free.app` en `.env` como `PUBLIC_BASE_URL`.

5. **Arrancar el servidor**
   ```sh
   uv run main.py
   ```

6. **Conectar el número de teléfono:** en la consola de Twilio, abrir el número → *Voice Configuration* → *A call comes in* → Webhook `https://….ngrok-free.app/incoming-call`, método `HTTP POST`.

7. **Llamar al número.** La terminal muestra lo que dicen quien llama y el asistente.

## Publicar en Railway

1. En Railway, crear un proyecto a partir del repositorio de GitHub. El `Dockerfile` le indica a Railway cómo construirlo y arrancarlo.
2. En las **Variables** del servicio, agregar `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `RESEND_API_KEY` y, si hace falta, `FRONT_DESK_PHONE`, `BOOKINGS_EMAIL_TO`, `BOOKINGS_EMAIL_FROM`, `OPENAI_LIVE_MODEL`, `OPENAI_BACKEND_MODEL`, `OPENAI_VOICE`, `BUSINESS_NAME` y `GREETING`. `PUBLIC_BASE_URL` no hace falta.
3. En **Settings → Networking**, hacer clic en **Generate Domain**. Se obtiene una dirección como `https://zar-del-fitness-production.up.railway.app`.
4. En la consola de Twilio, poner como webhook del número esa dirección más `/incoming-call`.

Cada push a `main` vuelve a publicar el servidor.

## Probar sin llamar

1. Arrancar el servidor: `uv run main.py` (para esto no hace falta ngrok).
2. En otra terminal: `uv run test_call.py`, y hablar. Ctrl+C corta la llamada.

Se conecta al servidor igual que Twilio, así que prueba todo menos la red telefónica. La terminal del servidor muestra la conversación. Conviene usar auriculares; con los parlantes de la computadora, usar `uv run test_call.py --speakers`, que silencia el micrófono mientras habla el asistente. La primera vez, macOS pide permiso para que la terminal use el micrófono.

## Transferencias y emails de turnos

**Transferencias.** Cuando la persona pide hablar con alguien, con recepción o con Ronald, el asistente le delega la transferencia al backend, le dice que la pasa con uno de los asesores de recepción y, cuando termina de decirlo, la llamada se desvía a `FRONT_DESK_PHONE` (+54 9 11 2733-6258), que ve el número de quien llama. Twilio solo llama a los países habilitados en su consola, en *Voice → Settings → Geo permissions*: Argentina tiene que estar activada. Cada transferencia es además una llamada saliente que Twilio cobra.

**Emails de turnos.** Cuando el asistente agenda una visita, el servidor la envía por email, en español, a `BOOKINGS_EMAIL_TO` (zardelfitnessgym@gmail.com): nombre, día, hora, motivo, el idioma de la persona y el número de teléfono que confirmó durante la llamada (y el número desde el que llamó, si es otro). Se envía con [Resend](https://resend.com), porque Railway bloquea el email común (SMTP) en el plan Hobby.

1. En Resend, agregar un dominio en *Domains* y cargar los registros DNS que muestra. Sin un dominio verificado, Resend solo entrega emails a la dirección de la propia cuenta de Resend.
2. Poner en `BOOKINGS_EMAIL_FROM` una dirección de ese dominio. Por defecto es `asistente@edumorales.dev`.
3. En Resend, abrir *API Keys*, crear una y ponerla en `RESEND_API_KEY`.

El log del servidor indica cuándo se envió un email, o por qué falló.

## Idiomas

El asistente saluda en español (se cambia con `GREETING` en `.env`) y después responde en el idioma en que hable la persona, y cambia si ella cambia. La información del gimnasio puede estar en cualquier idioma: el asistente traduce.

## Notas

- Las URLs gratuitas de ngrok cambian cada vez que se reinicia ngrok: cuando pasa, hay que actualizar `PUBLIC_BASE_URL` y el webhook de Twilio.
- Las solicitudes se verifican con el auth token de Twilio, así que solo Twilio puede iniciar llamadas en este servidor.
- Para producción, hay que publicarlo en un hosting que soporte WebSockets y quede siempre encendido (Fly.io, Render, Railway); las funciones serverless no sirven.
