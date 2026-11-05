"use client";

import { useEffect } from "react";

type Chat = { identify: (params: Record<string, string>, exp: number, signature: string) => void };
type Props = { params: Record<string, string>; exp: number; signature: string };

/**
 * chat.js lo carga el layout una sola vez, y entre páginas (o al entrar con Clerk) no se recarga: por eso el cliente se
 * pasa con diguiChat.identify, que vale para el próximo chat. Al salir de la página se borra, para que otra cuenta en
 * la misma pestaña no chatee como este cliente.
 */
export function DiguiIdentify({ params, exp, signature }: Props) {
  const customerId = params.customer_id;
  useEffect(() => {
    const chat = () => (window as { diguiChat?: Chat }).diguiChat;
    const send = () => chat()?.identify({ customer_id: customerId }, exp, signature);
    // chat.js puede cargar después de esta página (sus efectos corren antes que los del layout)
    const wait = setInterval(() => chat() && (send(), clearInterval(wait)), 300);
    send();
    return () => {
      clearInterval(wait);
      chat()?.identify({}, 0, "");
    };
  }, [customerId, exp, signature]);
  return null;
}
