"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { links } from "@/lib/content";

/** Botón flotante de WhatsApp; aparece después del hero. */
export function WhatsAppFloat() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a className="wa-float" href={links.waInfo} aria-label="Escribinos por WhatsApp" data-show={show} data-cursor="Chat">
      <Icon name="wa" className="" />
    </a>
  );
}
