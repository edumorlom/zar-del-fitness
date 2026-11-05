import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { siteUrl } from "@/lib/content";

// Un solo servidor para el sitio y el portal:
// - /portal/… (en cualquier dominio): el portal, en app/(portal)/portal/. Clerk lee la sesión en cada pedido; qué puede
//   ver cada uno se decide en las páginas y las acciones (portal/lib/auth.ts). /archivos/… también es del portal: así
//   guarda la base las fotos y los certificados.
// - mi.zardelfitness.com.ar (o mi.localhost en desarrollo), el dominio de antes del portal, sin /portal en las URLs:
//   lleva a /portal/…, salvo la API de Digui.
// - el resto: el sitio, con las reglas que tenía el .htaccess de cPanel antes de Railway (las URLs del WordPress
//   anterior, la "/" final).

/** El dominio que pidió el navegador (Railway lo pasa en Host; req.nextUrl tiene el del servidor). */
const hostOf = (req: NextRequest) =>
  (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
const isMi = (req: NextRequest) => hostOf(req).startsWith("mi.");
/** En desarrollo (localhost) las redirecciones se quedan en localhost; en producción, a los dominios de verdad. */
const localOrigin = (req: NextRequest) => {
  const host = req.headers.get("host") ?? "";
  return /^(mi\.)?localhost(:\d+)?$/.test(host) ? `http://${host}` : null;
};
const PORTAL = /^\/(portal|archivos)(\/|$)/;
// La API de Digui la llama el servidor de Digui con su clave, no una persona con sesión: va al portal sin Clerk.
const DIGUI = /^(\/portal)?\/api\/digui(\/|$)/;

/** La ruta en app/(portal)/: /archivos/… y /api/digui/… (en mi.) llevan /portal adelante. */
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
  const hostname = hostOf(req);
  const origin = localOrigin(req) ?? siteUrl;
  const to = (path: string) => NextResponse.redirect(new URL(path, origin), 301);

  // El .com y los www van al dominio principal, con la misma ruta.
  if (/^(www\.)?zardelfitness\.com$/.test(hostname) || hostname.startsWith("www.")) return to(pathname + search);

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
  if (SITEMAPS.test(pathname)) return to("/sitemap.xml");
  if (GONE.test(pathname)) return gone(req);
  // Una página sin la barra final (/blog), a la URL con barra.
  if (!pathname.endsWith("/") && !FILE.test(pathname)) return to(`${pathname}/${search}`);
  return NextResponse.next();
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname, search } = req.nextUrl;
  if (!PORTAL.test(pathname)) {
    if (!isMi(req)) return site(req);
    // shortcut: a /portal/… en el mismo mi., porque el DNS viejo (cPanel, con NS de TTL 1.800.000 s) puede seguir
    // mandando zardelfitness.com.ar a cPanel unos días desde el cambio a Cloudflare (2026-11-05). Desde ~2026-11-12, que
    // todo mi. lleve a portalUrl, menos /archivos/… (la base tiene fotos con https://mi.…/archivos/, de portal/scripts/)
    // y la API de Digui (su servidor la llama acá, y un POST no sigue una redirección).
    if (!DIGUI.test(pathname))
      return NextResponse.redirect(
        `${localOrigin(req) ?? `https://${hostOf(req)}`}/portal${pathname === "/" ? "" : pathname}${search}`,
        308
      );
  }
  if (DIGUI.test(pathname)) return NextResponse.rewrite(toPortal(req));
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
