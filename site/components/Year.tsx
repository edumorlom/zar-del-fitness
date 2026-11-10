"use client";

import { useSyncExternalStore } from "react";

/** Año actual en Buenos Aires (no en la zona de quien mira), calculado en el cliente (evita Date durante el prerender). */
const noop = () => () => {};
const yearAR = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
export function Year() {
  const year = useSyncExternalStore(noop, () => Number(yearAR.format(new Date())), () => 2026);
  return <>{year}</>;
}
