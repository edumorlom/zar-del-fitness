import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { siteUrl } from "@/lib/content";
import { isLocalhost, requestHost } from "~/lib/host";

// Un solo servidor para el sitio y el portal:
// - /portal/… (en cualquier dominio): el portal, en app/(portal)/portal/. Clerk lee la sesión en cada pedido; qué puede
//   ver cada uno se decide en las páginas y las acciones (portal/lib/auth.ts). /archivos/… también es del portal: así
//   guarda la base las fotos y los certificados.
// - el resto: el sitio, con las reglas que tenía el .htaccess de cPanel antes de Railway (las URLs del WordPress
//   anterior, la "/" final).

/** El dominio que pidió el navegador, sin el puerto (portal/lib/host.ts). */
const hostOf = (req: NextRequest) => requestHost(req.headers).replace(/:\d+$/, "");
/** El .com y los www: van al dominio principal (siteUrl), con la misma ruta. */
const isAlias = (req: NextRequest) => /^(www\.)?zardelfitness\.com$/.test(hostOf(req)) || hostOf(req).startsWith("www.");
/** En desarrollo (localhost) las redirecciones se quedan en localhost; en producción, a los dominios de verdad. */
const localOrigin = (req: NextRequest) => {
  const host = requestHost(req.headers);
  return isLocalhost(host) ? `http://${host}` : null;
};
const PORTAL = /^\/(portal|archivos)(\/|$)/;
// El servidor MCP de Digui (/portal/api/digui/mcp) lo llama el servidor de Digui con su clave, no una persona con sesión:
// va al portal sin Clerk, igual que sus instrucciones (/portal/api/digui). Los avisos de Mercado Pago
// (/portal/api/mercadopago), también: los manda su servidor.
const NO_SESSION = /^\/portal\/api\/(digui|mercadopago)(\/|$)/;

// Caracteres invisibles que a veces se pegan a un link al copiarlo o escribirlo en Instagram, Facebook o WhatsApp (el
// 2026-11-21, un U+2060 después de una nota del blog, que daba 404): espacios de ancho cero, unión de palabras, guion
// blando, marcas de dirección del texto y el BOM.
const INVISIBLE = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/**
 * La ruta sin los caracteres invisibles, o null si no tiene. Sin ellos pueden quedar dos barras seguidas (/nota/<invisible>/): van
 * juntas, así tampoco queda una ruta "//otro-dominio" a la que redirigir. encodeURI codifica la "\".
 */
function withoutInvisible(pathname: string): string | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const visible = path.replace(INVISIBLE, "");
  return visible === path ? null : encodeURI(visible.replace(/\/{2,}/g, "/"));
}

/** La ruta en app/(portal)/: /archivos/… lleva /portal adelante. */
function toPortal(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (!url.pathname.startsWith("/portal")) url.pathname = `/portal${url.pathname}`;
  return url;
}

const clerk = clerkMiddleware((_auth, req) => NextResponse.rewrite(toPortal(req)));

// Lo que el sitio anterior tenía y este no (la tienda, WordPress, los archivos por fecha, dos notas borradas): 410, para
// que Google lo saque rápido.
const GONE =
  /^\/((tienda|carrito|checkout|finalizar-compra|mi-cuenta|producto|product|categoria-producto|product-category|guia-de-entrenadores|guia-de-gimnasios|category|tag|author|feed|comments|wp-admin|wp-content|wp-includes|wp-json)(\/.*)?|(wp-login|xmlrpc|wp-cron)\.php|(en\/)?[0-9]{4}(\/[0-9]{2}(\/[0-9]{2})?)?\/?|(en\/)?[0-9]{4}\/[0-9]{2}\/[0-9]{2}\/[^/]+\/(feed|amp)\/?|2021\/01\/04\/que-son-los-quemadores-de-grasa\/?|en\/2021\/01\/04\/what-are-fat-burners\/?)$/;
const SITEMAPS = /^\/(sitemap\/?|sitemap\.xml\/|sitemap\.html|sitemap_index\.xml|wp-sitemap\.xml|(post|page|product|category)-sitemap\.xml)$/;
// Archivos sin extensión que genera Next.js: no llevan "/" al final.
const FILE = /(\.[a-z0-9]+|\/(opengraph-image|twitter-image)(-[a-z0-9]+)?|\/apple-icon)$/i;

/**
 * La página 404 del sitio con el código 410. Un rewrite no puede cambiar el código, así que se pide la 404 al mismo
 * servidor (por adentro, sin salir a internet) y se devuelve con 410.
 */
async function gone(req: NextRequest) {
  const page = await fetch(`http://127.0.0.1:${process.env.PORT ?? 3000}/404/`, {
    headers: { host: req.headers.get("host") ?? "" },
  }).catch(() => null);
  return new NextResponse(page ? await page.text() : "Gone", {
    status: 410,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "max-age=0" },
  });
}

/** Las reglas del sitio, en orden: la primera que coincide gana. */
async function site(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const origin = localOrigin(req) ?? siteUrl;
  const to = (path: string) => NextResponse.redirect(new URL(path, origin), 301);

  if (isAlias(req)) return to(pathname + search);

  let m: RegExpMatchArray | null;
  // Idiomas: /es/… sin el prefijo; /spanish/ y /english/ fueron los prefijos unas horas el 2026-10-11.
  if ((m = pathname.match(/^\/(?:es|spanish)(?:\/(.*))?$/))) return to(`/${m[1] ?? ""}${search}`);
  if ((m = pathname.match(/^\/english(?:\/(.*))?$/))) return to(`/en/${m[1] ?? ""}${search}`);
  if ((m = pathname.match(/^(.*\/)index\.html$/))) return to(m[1] + search);
  // Páginas viejas cuyo contenido hoy es una sección del inicio.
  if (/^\/(servicios|entrenamiento-online|entrenamiento-presencial|sistema-general-dirigido|producto\/reto-de-los-25-dias-(online|presencial))\/?$/.test(pathname))
    return to("/#programas");
  if (/^\/(sobre-ronald|entrenadores)\/?$/.test(pathname)) return to("/#zar");
  if (/^\/transformaciones-(online|presencial)\/?$/.test(pathname)) return to("/#resultados");
  if ((m = pathname.match(/^\/(en\/)?blog\/page\/[0-9]+\/?$/))) return to(`/${m[1] ?? ""}blog/`);
  // Las URLs de siempre de las páginas legales (las de WordPress y las que se suelen probar), a las de ahora.
  if (/^\/(politica-de-privacidad|privacy-policy|privacidad-y-cookies|aviso-de-privacidad)\/?$/.test(pathname))
    return to(pathname.startsWith("/privacy") ? "/en/privacy/" : "/privacidad/");
  if (/^\/(terminos-y-condiciones|condiciones|terms|terms-and-conditions)\/?$/.test(pathname))
    return to(pathname.startsWith("/terms") ? "/en/terms/" : "/terminos/");
  if (SITEMAPS.test(pathname)) return to("/sitemap.xml");
  if (GONE.test(pathname)) return gone(req);
  // Una página sin la barra final (/blog), a la URL con barra.
  if (!pathname.endsWith("/") && !FILE.test(pathname)) return to(`${pathname}/${search}`);
  return NextResponse.next();
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname, search } = req.nextUrl;
  // Antes que todo: la misma URL sin los caracteres invisibles, que después pasa por las demás reglas.
  const visible = withoutInvisible(pathname);
  if (visible !== null) return NextResponse.redirect(new URL(visible + search, localOrigin(req) ?? siteUrl), 301);
  if (!PORTAL.test(pathname)) return site(req);
  if (NO_SESSION.test(pathname)) return NextResponse.next();
  // El portal también, en el dominio del sitio: la sesión de Clerk y la cookie del chat de Digui (portal/lib/digui-cookie.ts)
  // son de un dominio, y el sitio no vería las del .com.
  if (isAlias(req)) return NextResponse.redirect(new URL(pathname + search, siteUrl), 308);
  return clerk(req, event);
}

export const config = {
  matcher: [
    // Todo menos los archivos internos de Next.js y los estáticos. Las fotos y certificados del portal (/archivos/…)
    // terminan en .jpg/.png, pero pasan: el portal revisa quién los pide.
    "/((?!_next/static|_next/image|[^?]*\\.(?:css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)$).*)",
    "/archivos/(.*)",
    "/portal/archivos/(.*)",
  ],
};
