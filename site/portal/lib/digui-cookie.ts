// Quién chatea en el sitio: el cliente que entró al portal en este navegador. El sitio es estático: Clerk dice en el
// navegador si hay sesión (components/Session.tsx), pero no quién es en la base (users.id), así que el portal deja su
// customer_id firmado (lo mismo que ya va en la página del portal) en una cookie, y el chat del sitio lo pasa a Digui.
// Digui verifica la firma: cambiar el id la rompe. La escribe y la lee portal/components/DiguiIdentify.tsx.
const NAME = "digui_visitor";

/** La cookie con lo firmado, hasta que vence la firma. */
export const visitorCookie = (customerId: string, exp: number, signature: string, now = Math.floor(Date.now() / 1000)) =>
  `${NAME}=${customerId}.${exp}.${signature}; path=/; max-age=${Math.max(0, exp - now)}; samesite=lax`;

/**
 * Lo que se agrega a visitorCookie para que el sitio (en el dominio principal) vea la cookie que deja el portal en mi.
 * shortcut: así también la reciben los otros subdominios; sacarlo cuando mi. lleve a portalUrl (proxy.ts).
 */
export const sharedDomain = (host: string) => (host === "mi.zardelfitness.com.ar" ? "; domain=zardelfitness.com.ar" : "");

/** Para borrarla: al ingreso (adonde lleva cerrar la sesión) y en sin-acceso. Son dos: la de este dominio y la que dejó mi. */
export const FORGET_VISITOR = [`${NAME}=; path=/; max-age=0`, `${NAME}=; path=/; max-age=0; domain=zardelfitness.com.ar`];

/** Si Clerk dice que hay una sesión iniciada: su __client_uat (o el de nombre con sufijo) es 0 o no está sin ella. */
export const signedIn = (cookies: string) => /(?:^|;\s*)__client_uat(?:_[\w-]+)?=[1-9]/.test(cookies);

/** Lo firmado de document.cookie, o null si no hay (o no tiene la forma de visitorCookie). */
export function readVisitor(cookies: string) {
  const m = cookies.match(/(?:^|;\s*)digui_visitor=(\d+)\.(\d+)\.([0-9a-f]+)(?:;|$)/);
  return m && { params: { customer_id: m[1] }, exp: Number(m[2]), signature: m[3] };
}
