"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { niceTicks, spread } from "~/lib/chart";
import { longDate, num, shortDate } from "~/lib/format";

export type EvolutionPoint = { date: string; weight: number; fatPct: number; lean: number; fatKg: number };

// Una medida por gráfico, cada una con su escala: kilos y porcentajes en un mismo eje aplastaban las líneas.
const METRICS = [
  { key: "weight", label: "Peso", unit: "kg", better: 0, delta: "kg" },
  { key: "fatPct", label: "% Graso", unit: "%", better: -1, delta: "puntos" },
  { key: "lean", label: "Masa magra", unit: "kg", better: 1, delta: "kg" },
  { key: "fatKg", label: "Grasa", unit: "kg", better: -1, delta: "kg" },
] as const;
type Key = (typeof METRICS)[number]["key"];

const H = 260;
const PAD = { top: 16, right: 16, bottom: 30, left: 44 };

/** La evolución de una medida en el tiempo, con pestañas para elegir cuál. `you`: lo ve el propio cliente. */
export function Evolution({ points, you }: { points: EvolutionPoint[]; you: boolean }) {
  const [metric, setMetric] = useState<Key>("weight");
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const m = METRICS.find((it) => it.key === metric)!;
  const values = points.map((p) => p[metric]);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const [lo, hi] = [ticks[0], ticks[ticks.length - 1]];
  // Por fecha, no por orden: un control que tardó el doble se ve más lejos.
  const times = points.map((p) => Date.parse(p.date));
  const [t0, t1] = [times[0], times[times.length - 1]];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const x = (i: number) => PAD.left + (t1 === t0 ? plotW / 2 : ((times[i] - t0) / (t1 - t0)) * plotW);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${y(lo)} L${x(0).toFixed(1)} ${y(lo)} Z`;

  const change = values[values.length - 1] - values[0];
  const flat = Math.abs(change) < 0.05;
  const good = !flat && m.better !== 0 && Math.sign(change) === m.better;

  // El punto más cercano al puntero, por x (el crosshair encuentra la fecha, no hace falta apuntarle a la línea).
  const nearest = (clientX: number) => {
    const left = box.current!.getBoundingClientRect().left;
    let best = 0;
    times.forEach((_, i) => {
      if (Math.abs(x(i) - (clientX - left)) < Math.abs(x(best) - (clientX - left))) best = i;
    });
    return best;
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const last = points.length - 1;
    setActive((a) => (a === null ? last : Math.min(last, Math.max(0, a + (e.key === "ArrowRight" ? 1 : -1)))));
  };

  const p = active === null ? null : points[active];
  const tipLeft = active === null ? 0 : Math.min(Math.max(x(active), 110), Math.max(110, width - 110));

  return (
    <div className="card evo" data-reveal>
      <div className="evo__head">
        <div>
          <p className="label">{you ? "Tu evolución" : "Evolución"}</p>
          <p className={good ? "delta delta--good" : "delta"}>
            {flat
              ? "Sin cambios desde el primer control"
              : `${change > 0 ? "↑" : "↓"} ${num(Math.abs(change))} ${m.delta} desde el primer control`}
          </p>
        </div>
        <div className="evo__tabs" role="tablist" aria-label="Medida">
          {METRICS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={tab.key === metric}
              className="evo__tab"
              onClick={() => setMetric(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={box}
        className="evo__plot"
        tabIndex={0}
        role="group"
        aria-label={`${m.label}: de ${num(values[0])} ${m.unit} el ${shortDate(points[0].date)} a ${num(values[values.length - 1])} ${m.unit} el ${shortDate(points[points.length - 1].date)}. Con las flechas, cada control.`}
        onPointerMove={(e) => setActive(nearest(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        {width > 0 && (
          <svg width={width} height={H} aria-hidden="true">
            <defs>
              <linearGradient id="evo-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#d6a61d" stopOpacity="0.22" />
                <stop offset="1" stopColor="#d6a61d" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line className="evo__grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
                <text className="evo__axis" x={PAD.left - 10} y={y(t)} dy="0.35em" textAnchor="end">
                  {num(t, Number.isInteger(t) ? 0 : 1)}
                </text>
              </g>
            ))}
            {spread(points.length, Math.max(2, Math.floor(plotW / 90))).map((i) => (
              <text key={i} className="evo__axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}>
                {shortDate(points[i].date).slice(0, 5)}
              </text>
            ))}
            {/* key: al cambiar de medida, la línea se vuelve a dibujar */}
            <g key={metric}>
              <path className="evo__area" d={area} fill="url(#evo-fill)" />
              <path className="evo__line" d={line} pathLength={1} />
            </g>
            {active !== null && <line className="evo__cross" x1={x(active)} x2={x(active)} y1={PAD.top} y2={H - PAD.bottom} />}
            {values.map((v, i) => (
              <circle key={i} className="evo__dot" cx={x(i)} cy={y(v)} r={i === active ? 6 : 4} />
            ))}
          </svg>
        )}
        {p && (
          <div className="evo__tip" style={{ left: tipLeft }} role="status">
            <p className="evo__tip-date">{longDate(p.date)}</p>
            {METRICS.map((row) => (
              <p key={row.key} className={row.key === metric ? "evo__tip-row is-active" : "evo__tip-row"}>
                <span className="evo__key" aria-hidden="true" />
                <b>
                  {num(p[row.key])} {row.unit}
                </b>
                <span>{row.label}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
