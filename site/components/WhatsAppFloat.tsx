"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/** Botón flotante de WhatsApp; aparece después del hero. */
export function WhatsAppFloat({ href, label, cursor }: { href: string; label: string; cursor: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a className="wa-float" href={href} aria-label={label} data-show={show} data-cursor={cursor}>
      <Icon name="wa" className="" />
    </a>
  );
}
