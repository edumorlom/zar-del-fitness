"use client";

import { useEffect, useState } from "react";
import { schedule } from "@/lib/content";
import styles from "./Visit.module.css";

type Now = { day: number; hour: number };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nowInBA(): Now {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: schedule.timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { day: DAYS.indexOf(get("weekday")), hour: Number(get("hour")) + Number(get("minute")) / 60 };
}

function describe({ day, hour }: Now) {
  const workday = schedule.days.includes(day);
  const slot = workday ? schedule.slots.find((s) => hour >= s.from && hour < s.to) : undefined;
  if (slot) return { open: true, text: `Abierto ahora · último ingreso ${slot.lastEntry}` };
  const next = workday ? schedule.slots.find((s) => hour < s.from) : undefined;
  if (next) return { open: false, text: `Cerrado · abre hoy a las ${next.label.split(" ")[0]}` };
  return { open: false, text: "Cerrado · abre lunes a viernes desde las 8:00" };
}

function useNowBA() {
  const [now, setNow] = useState<Now | null>(null);
  useEffect(() => {
    const update = () => setNow(nowInBA());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Indicador "abierto/cerrado". Se calcula sólo en el cliente (hora de Buenos Aires). */
export function OpenStatus() {
  const now = useNowBA();
  const info = now ? describe(now) : null;
  return (
    <p className={styles.status} data-open={info?.open ?? false} aria-live="polite">
      <span className={styles.statusDot} />
      {info?.text ?? "Lunes a viernes · 8:00 a 12:00 y 14:30 a 21:00"}
    </p>
  );
}

/** Marcador de la hora actual sobre la línea de horarios. */
export function NowMarker() {
  const now = useNowBA();
  const { from, to } = schedule.range;
  if (!now || !schedule.days.includes(now.day) || now.hour < from || now.hour > to) return null;
  return (
    <span className={styles.now} style={{ left: `${((now.hour - from) / (to - from)) * 100}%` }} aria-hidden="true">
      <b>Ahora</b>
    </span>
  );
}
