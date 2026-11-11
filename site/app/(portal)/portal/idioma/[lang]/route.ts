import type { NextRequest } from "next/server";
import { LANG_COOKIE } from "~/lib/lang";

/**
 * Cambia el idioma del portal y vuelve a la página de donde vino (el botón ES/EN del menú). Desde el sitio en inglés
 * ("My Portal") o desde cualquier otro lado, al portal. La dirección es relativa: el servidor no sabe su dominio (proxy.ts).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang === "en" ? "en" : "es";
  let back = "/portal";
  try {
    const ref = new URL(req.headers.get("referer") ?? "");
    if (ref.pathname.startsWith("/portal/") && !ref.pathname.startsWith("/portal/idioma")) back = ref.pathname + ref.search;
  } catch {}
  return new Response(null, {
    status: 303,
    headers: { Location: back, "Set-Cookie": `${LANG_COOKIE}=${lang}; path=/portal; max-age=31536000; samesite=lax`, "Cache-Control": "no-store" },
  });
}
