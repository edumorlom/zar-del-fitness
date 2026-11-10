"use client";

import { useEffect } from "react";
import { useClerkSignedIn } from "@/components/Session";
import { FORGET_VISITOR, readVisitor, sharedDomain, signedIn, visitorCookie } from "~/lib/digui-cookie";

type Chat = { identify: (params: Record<string, string>, exp: number, signature: string) => void };
type Props = { params: Record<string, string>; exp: number; signature: string };

/**
 * chat.js lo carga DiguiChat una sola vez, y entre páginas (o con otra cuenta en la misma pestaña) no se recarga: por
 * eso el cliente también se pasa con diguiChat.identify, que vale para el próximo chat. Al salir de la página se borra,
 * para que otra cuenta en la misma pestaña no chatee como este cliente. Devuelve eso, para el final de un efecto.
 */
function identify(customerId: string, exp: number, signature: string) {
  const chat = () => (window as { diguiChat?: Chat }).diguiChat;
  const send = () => chat()?.identify({ customer_id: customerId }, exp, signature);
  // chat.js puede cargar después de esta página (sus efectos corren antes que los del layout)
  const wait = setInterval(() => chat() && (send(), clearInterval(wait)), 300);
  send();
  return () => {
    clearInterval(wait);
    chat()?.identify({}, 0, "");
  };
}

/** En el portal con la sesión iniciada: el cliente, y la cookie de portal/lib/digui-cookie.ts para el chat del sitio. */
export function DiguiIdentify({ params, exp, signature }: Props) {
  const customerId = params.customer_id;
  useEffect(() => {
    document.cookie = visitorCookie(customerId, exp, signature) + (location.protocol === "https:" ? "; secure" : "") + sharedDomain(location.hostname);
    return identify(customerId, exp, signature);
  }, [customerId, exp, signature]);
  return null;
}

/**
 * Sin sesión a la vista (el sitio, o el portal sin sesión): el cliente que guardó DiguiIdentify en este navegador, sólo
 * si Clerk dice que la sesión sigue iniciada (su cookie y, en el sitio, lo que responde: components/Session.tsx). forget
 * (el ingreso, adonde lleva cerrar la sesión, y sin-acceso) la borra: otra cuenta no chatea como ese cliente.
 */
export function DiguiVisitor({ forget }: { forget?: boolean }) {
  const clerk = useClerkSignedIn();
  useEffect(() => {
    if (forget || !(clerk ?? signedIn(document.cookie))) {
      for (const forget of FORGET_VISITOR) document.cookie = forget;
      return;
    }
    const saved = readVisitor(document.cookie);
    return saved ? identify(saved.params.customer_id, saved.exp, saved.signature) : undefined;
  }, [forget, clerk]);
  return null;
}
