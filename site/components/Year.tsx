"use client";

import { useSyncExternalStore } from "react";

/** Año actual calculado en el cliente (evita Date durante el prerender). */
const noop = () => () => {};
export function Year() {
  const year = useSyncExternalStore(noop, () => new Date().getFullYear(), () => 2026);
  return <>{year}</>;
}
