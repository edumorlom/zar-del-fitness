import { notifiedPaymentId } from "~/lib/payments";
import { settleMercadoPago } from "~/lib/payments-data";

export const dynamic = "force-dynamic";

/**
 * Los avisos de Mercado Pago (notification_url de cada preferencia: portal/lib/mercadopago.ts). Sin Clerk (proxy.ts):
 * los manda su servidor. No se cree nada del aviso: sólo trae el id, y el pago se le pide a Mercado Pago con el access
 * token del Zar (un aviso falso con un id ajeno no encuentra nada, y uno de un pago real sólo lo acredita una vez).
 * 200 para lo que no es un pago nuestro; 502 si Mercado Pago no respondió, para que vuelva a avisar.
 */
export async function POST(req: Request) {
  const id = notifiedPaymentId(new URL(req.url).searchParams, await req.json().catch(() => null));
  if (!id) return new Response(null, { status: 200 });
  const r = await settleMercadoPago(id);
  return new Response(null, { status: r.state === "error" ? 502 : 200 });
}
