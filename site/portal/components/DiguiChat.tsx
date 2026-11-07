import Script from "next/script";
import { DIGUI_RECEPTIONIST, signVisitor } from "~/lib/digui";
import { DiguiIdentify, DiguiVisitor } from "./DiguiIdentify";

const CHAT_JS = "https://digui.ai/chat.js";

/**
 * El chat de Digui, en toda la web. Con customerId, en el portal con la sesión iniciada (Shell y AdminShell): su id en
 * users (cliente, coach o admin) va firmado, así el primer chat (y una llamada desde él) sabe quién es. Sin
 * DIGUI_SIGNING_SECRET, anónimo también ahí.
 * Sin customerId, en el sitio (components/RootShell.tsx) y en el portal sin sesión (ingresar y sin-acceso, con forget),
 * cargado al terminar la página (lazyOnload, como Analytics.tsx). El sitio pasa el id firmado que el portal dejó en este
 * navegador (DiguiVisitor); el portal sin sesión lo borra.
 * Del sitio al portal la página se recarga entera (otro layout raíz): chat.js arranca de nuevo con lo de cada lado.
 */
export function DiguiChat({ customerId, forget }: { customerId?: number; forget?: boolean }) {
  const secret = process.env.DIGUI_SIGNING_SECRET;
  if (customerId === undefined || !secret)
    return (
      <>
        <Script src={CHAT_JS} data-receptionist={DIGUI_RECEPTIONIST} strategy="lazyOnload" />
        <DiguiVisitor forget={forget} />
      </>
    );
  const params = { customer_id: String(customerId) };
  const signed = signVisitor(secret, DIGUI_RECEPTIONIST, params);
  return (
    <>
      <Script
        src={CHAT_JS}
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
