// El dominio que pidió el navegador. Railway (detrás de Cloudflare) lo pasa en x-forwarded-host; req.nextUrl y Host
// pueden traer el del servidor. Sin servidor: también lo usan proxy.ts (en el edge) y los tests.

/** "ZARdelfitness.com.ar, proxy.internal" → "zardelfitness.com.ar" (el primero, en minúsculas, con su puerto). */
export const hostOf = (forwarded: string | null | undefined, host: string | null | undefined) =>
  (forwarded ?? host ?? "").split(",")[0].trim().toLowerCase();

/** El dominio del pedido, de sus encabezados. */
export const requestHost = (headers: { get(name: string): string | null }) => hostOf(headers.get("x-forwarded-host"), headers.get("host"));

/** En desarrollo: localhost, con o sin puerto. Ahí las direcciones son http y se quedan en localhost. */
export const isLocalhost = (host: string) => /^localhost(:\d+)?$/.test(host);
