import Script from "next/script";
import { DIGUI_RECEPTIONIST, signVisitor } from "~/lib/digui";
import { DiguiIdentify } from "./DiguiIdentify";

/**
 * El chat de Digui, sólo para quien entró: chat.js se carga recién acá, con su customer_id (su id en users; cliente,
 * coach o admin) ya firmado, así el primer chat (y una llamada desde él) sabe quién es. Sin DIGUI_SIGNING_SECRET, no
 * hay chat.
 * shortcut: al salir sin recargar, el botón del chat queda en /ingresar hasta recargar (sin el cliente: DiguiIdentify
 * lo borra); si molesta, que el cierre de sesión recargue la página.
 */
export function DiguiChat({ customerId }: { customerId: number }) {
  const secret = process.env.DIGUI_SIGNING_SECRET;
  if (!secret) return null;
  const params = { customer_id: String(customerId) };
  const signed = signVisitor(secret, DIGUI_RECEPTIONIST, params);
  return (
    <>
      <Script
        src="https://digui.ai/chat.js"
        data-receptionist={DIGUI_RECEPTIONIST}
        data-params={JSON.stringify(params)}
        data-exp={String(signed.exp)}
        data-signature={signed.signature}
        strategy="afterInteractive"
      />
      <DiguiIdentify params={params} {...signed} />
    </>
  );
}
