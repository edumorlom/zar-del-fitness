// Lo común a los correos del portal, con el diseño de portal/scripts/email-cuenta-lista/correo.html: fondo negro, el
// encabezado y los botones como imágenes (public/correo/) porque Gmail y Outlook recolorean el HTML en modo oscuro, y
// las clases gl/gs/gd/nc, que mantienen el negro en Gmail para iPhone (sólo sirven para texto blanco o gris).

export const SITE = "https://zardelfitness.com.ar";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** "Melanie" aunque en la base esté "MELANIE WOLMAN". */
export function firstName(name: string) {
  const first = name.trim().split(/\s+/)[0];
  return first === first.toUpperCase() ? first.slice(0, 1) + first.slice(1).toLowerCase() : first;
}

/** "Hola, Melanie." aunque en la base esté "MELANIE WOLMAN". */
export function greeting(name: string) {
  const nice = firstName(name);
  return nice ? `Hola, ${esc(nice)}.` : "Hola.";
}

/** Una imagen de public/correo/ que Resend baja y adjunta: en el HTML va como cid:<id>. */
export const image = (id: string, file: string) => ({ filename: file.replace(/^.*-/, ""), path: `${SITE}/correo/${file}`, content_id: id });

export const F = "font-family:Manrope,'Helvetica Neue',Helvetica,Arial,sans-serif";
export const ANTON = "font-family:Anton,Impact,'Arial Narrow',Arial,sans-serif";
export const box = (inner: string) => `<div class="gs"><div class="gd">${inner}</div></div>`;

/** El encabezado (cid:hero) a todo el ancho. */
export const heroRow = (alt: string) =>
  `<tr><td><img src="cid:hero" width="600" alt="${alt}" style="display:block;border:0;width:100%;height:auto;font-family:Arial,sans-serif;font-size:26px;line-height:34px;color:#ffffff"></td></tr>\n`;

/** Un párrafo de texto. */
export const textRow = (html: string, top = 24) =>
  `<tr><td class="p" style="padding:${top}px 40px 0;${F};font-size:17px;line-height:28px;color:#dcdcdc;">${box(html)}</td></tr>\n`;

/** El botón (cid:boton), que mide la mitad de la imagen: las imágenes están al doble para pantallas retina. */
export const buttonRow = (href: string, alt: string, width: number) =>
  `<tr><td class="p" style="padding:30px 40px 0"><a href="${href}" style="display:inline-block;text-decoration:none"><img src="cid:boton" width="${width}" height="56" alt="${alt}" style="display:block;border:0;width:${width}px;height:56px;font-family:Arial,sans-serif;font-size:17px;font-weight:700;line-height:24px;color:#e7c152"></a></td></tr>\n`;

/** Un título de sección, como "Cómo ingresar". */
export const heading = (text: string) =>
  `<h2 style="margin:0;font-weight:400;${ANTON};font-size:30px;line-height:38px;color:#ffffff;text-transform:uppercase;">${text}</h2>`;

/** El correo entero: `rows` son las filas de la tabla de 600 px; `help`, el enlace a WhatsApp del pie (si va). */
export const page = ({ title, preheader, rows, help }: { title: string; preheader: string; rows: string; help?: string }) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${title}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;600;700;800&display=swap');</style>
<style>body{margin:0;padding:0;background:#000000}
u + .body .gl{background-image:linear-gradient(#000,#000)!important}
u + .body .gs{background:#000000;mix-blend-mode:screen}
u + .body .gd{background:#000000;mix-blend-mode:difference}
u + .body .nc{color:#ffffff!important;border-color:#ffffff!important}
@media (max-width:480px){.p{padding-left:24px!important;padding-right:24px!important}}
</style></head>
<body class="body" style="margin:0;padding:0;background-color:#000000">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#000000" class="gl" style="background-color:#000000"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px">
${rows}<tr><td class="p" align="left" style="padding:56px 40px 40px;${F};font-size:13px;line-height:21px;color:#8a8a8a;">${box(`<div style="border-top:1px solid #2a2a2a;padding-top:28px">
${help ? `<a class="nc" href="https://wa.me/5491127336258" style="color:#e7c152;font-weight:700;text-decoration:underline">${help}</a><br>\n` : ""}The VIP by Zar del Fitness, Av. Álvarez Thomas 847, Colegiales, CABA.<br>Este correo es automático y no recibe respuestas.</div>`)}</td></tr></table>
</td></tr></table></body></html>`;

/**
 * Manda un correo por Resend y dice si Resend lo aceptó. Sin RESEND_API_KEY no manda y lo deja en los logs; si Resend lo
 * rechaza o no responde, también.
 */
export async function sendMail(mail: { to: string; subject: string; html: string; attachments: ReturnType<typeof image>[] }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`Falta RESEND_API_KEY: no se mandó "${mail.subject}".`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Zar del Fitness <no-reply@zardelfitness.com.ar>", ...mail, to: [mail.to] }),
    });
    if (res.ok) return true;
    console.error(`Resend no mandó "${mail.subject}": ${res.status} ${await res.text()}`);
  } catch (e) {
    console.error(`Resend no mandó "${mail.subject}":`, e);
  }
  return false;
}
