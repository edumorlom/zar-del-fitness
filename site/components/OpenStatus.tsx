"use client";

import { useEffect, useState } from "react";
import { fill } from "@/lib/i18n";
import styles from "./Visit.module.css";

/** El horario y los textos del indicador, ya en el idioma de la página (los arma components/Visit.tsx). */
export type StatusProps = {
  timeZone: string;
  /** Los días que abre, como Date.getDay(): 0 es domingo. */
  days: number[];
  /** Horas en decimal: 14.5 = 14:30. */
  slots: { from: number; to: number; opens: string; lastEntry: string }[];
  range: { from: number; to: number };
  text: {
    /** "Abierto ahora · último ingreso {hora}" */
    open: string;
    /** "Cerrado · abre hoy a las {hora}" */
    opensToday: string;
    /** "Cerrado · abre lunes a viernes desde las 8:00" */
    closed: string;
    now: string;
    /** Lo que se ve antes de saber la hora (en el HTML del build). */
    schedule: string;
  };
};

type Now = { day: number; hour: number };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nowIn(timeZone: string): Now {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { day: DAYS.indexOf(get("weekday")), hour: Number(get("hour")) + Number(get("minute")) / 60 };
}

function describe({ day, hour }: Now, { days, slots, text }: StatusProps) {
  const workday = days.includes(day);
  const slot = workday ? slots.find((s) => hour >= s.from && hour < s.to) : undefined;
  if (slot) return { open: true, text: fill(text.open, { hora: slot.lastEntry }) };
  const next = workday ? slots.find((s) => hour < s.from) : undefined;
  if (next) return { open: false, text: fill(text.opensToday, { hora: next.opens }) };
  return { open: false, text: text.closed };
}

function useNow(timeZone: string) {
  const [now, setNow] = useState<Now | null>(null);
  useEffect(() => {
    const update = () => setNow(nowIn(timeZone));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [timeZone]);
  return now;
}

/** Indicador "abierto/cerrado". Se calcula sólo en el cliente (hora de Buenos Aires). */
export function OpenStatus(props: StatusProps) {
  const now = useNow(props.timeZone);
  const info = now ? describe(now, props) : null;
  return (
    <p className={styles.status} data-open={info?.open ?? false} aria-live="polite">
      <span className={styles.statusDot} />
      {info?.text ?? props.text.schedule}
    </p>
  );
}

/** Marcador de la hora actual sobre la línea de horarios. */
export function NowMarker({ timeZone, days, range, text }: StatusProps) {
  const now = useNow(timeZone);
  const { from, to } = range;
  if (!now || !days.includes(now.day) || now.hour < from || now.hour > to) return null;
  return (
    <span className={styles.now} style={{ left: `${((now.hour - from) / (to - from)) * 100}%` }} aria-hidden="true">
      <b>{text.now}</b>
    </span>
  );
}
