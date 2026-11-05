import { DIGUI_RECEPTIONIST, signVisitor } from "~/lib/digui";
import { DiguiIdentify } from "./DiguiIdentify";

/** Le pasa al chat de Digui el customer_id del cliente que entró (su id en users), firmado. Sin DIGUI_SIGNING_SECRET, nada. */
export function DiguiChat({ customerId }: { customerId: number }) {
  const secret = process.env.DIGUI_SIGNING_SECRET;
  if (!secret) return null;
  const params = { customer_id: String(customerId) };
  return <DiguiIdentify params={params} {...signVisitor(secret, DIGUI_RECEPTIONIST, params)} />;
}
