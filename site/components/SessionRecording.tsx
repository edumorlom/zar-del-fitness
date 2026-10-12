"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";

// LogRocket: graba las sesiones de los visitantes (qué miran, dónde hacen click, errores) para verlas en
// app.logrocket.com. Va en todas las páginas, en los dos idiomas (components/RootShell.tsx).
const APP_ID = "eduardo-morales/zardelfitnesscomar";

type Properties = Record<string, string>;

declare global {
  interface Window {
    LogRocket?: {
      init: (appId: string, options?: { release?: string }) => void;
      track: (event: string, properties?: Properties) => void;
    };
  }
}

// El texto del botón o link, para saber cuál fue ("Inscribirme", "Ver trailer"…).
const label = (el: Element) => (el.textContent?.trim() || el.getAttribute("aria-label") || "").slice(0, 100);

const SOCIAL = /(^|\.)(instagram|facebook|youtube|tiktok|twitter|x)\.com$/;

/**
 * El evento de LogRocket (LogRocket.track) de un click, para filtrar sesiones en el panel: quién escribió por
 * WhatsApp (todas las inscripciones y consultas), quién vio un video, cambió de idioma, pidió cómo llegar o fue a
 * una red. Se detecta por el link, así que un botón nuevo de WhatsApp se cuenta solo.
 */
function eventFor(el: HTMLElement): [string, Properties] | null {
  const lang = document.documentElement.lang;
  if (el instanceof HTMLButtonElement && el.dataset.video) return ["VideoPlay", { video: el.dataset.video, label: label(el), lang }];
  if (!(el instanceof HTMLAnchorElement)) return null;
  const url = new URL(el.href, location.href);
  // El mensaje prearmado dice qué plan o qué consulta ("Quiero inscribirme en el Sistema Premium").
  if (url.hostname === "wa.me") return ["WhatsAppClick", { message: url.searchParams.get("text") ?? "", label: label(el), lang }];
  if (el.hreflang && url.origin === location.origin) return ["LanguageSwitch", { from: lang, to: el.hreflang }];
  if (url.hostname.endsWith("google.com") && url.pathname.startsWith("/maps/dir")) return ["DirectionsClick", { lang }];
  if (SOCIAL.test(url.hostname)) return ["SocialClick", { network: url.hostname.replace(/^www\./, ""), lang }];
  return null;
}

const noop = () => () => {};

/**
 * Carga LogRocket (el script de su CDN, cuando la página terminó de cargar, para no demorarla) y registra los
 * eventos. Sólo en el sitio publicado (`host`): ni en `npm run dev` ni en pruebas locales, que gastarían sesiones
 * del plan. `release` es el commit del build (next.config.ts), para saber qué versión vio cada sesión.
 */
export function SessionRecording({ host, release }: { host: string; release: string }) {
  const live = useSyncExternalStore(noop, () => location.hostname === host, () => false);

  useEffect(() => {
    if (!live) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest<HTMLElement>("a, button");
      const event = el && eventFor(el);
      if (event) window.LogRocket?.track(...event);
    };
    // En la fase de captura: llega aunque otro handler (anclas, menú) frene el click.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [live]);

  if (!live) return null;
  return (
    <Script
      src="https://cdn.logr-in.com/LogRocket.min.js"
      crossOrigin="anonymous"
      strategy="lazyOnload"
      onLoad={() => window.LogRocket?.init(APP_ID, { release })}
    />
  );
}
