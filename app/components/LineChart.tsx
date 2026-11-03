"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { niceTicks, spread } from "~/lib/chart";

const H = 220;
const PAD = { top: 14, right: 12, bottom: 28, left: 36 };

/**
 * Una serie en el tiempo, con puntos a la par (semanas). Al pasar el mouse (o con las flechas), la línea vertical marca
 * el punto más cercano y el cuadro dice su valor. El eje arranca en 0: son cantidades.
 */
export function LineChart({ points, label }: { points: { label: string; tip: string; value: number }[]; label: string }) {
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

  const values = points.map((p) => p.value);
  const ticks = niceTicks(0, Math.max(4, ...values));
  const hi = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const x = (i: number) => PAD.left + (points.length < 2 ? plotW / 2 : (i * plotW) / (points.length - 1));
  const y = (v: number) => PAD.top + (1 - v / hi) * (H - PAD.top - PAD.bottom);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;

  const nearest = (clientX: number) => {
    const left = box.current!.getBoundingClientRect().left;
    let best = 0;
    points.forEach((_, i) => {
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
  const tipLeft = active === null ? 0 : Math.min(Math.max(x(active), 80), Math.max(80, width - 80));

  return (
    <div
      ref={box}
      className="evo__plot evo__plot--short"
      tabIndex={0}
      role="group"
      aria-label={`${label}. Con las flechas, cada punto.`}
      onPointerMove={(e) => setActive(nearest(e.clientX))}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(points.length - 1)}
      onBlur={() => setActive(null)}
      onKeyDown={onKey}
    >
      {width > 0 && (
        <svg width={width} height={H} aria-hidden="true">
          <defs>
            <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#d6a61d" stopOpacity="0.2" />
              <stop offset="1" stopColor="#d6a61d" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line className="evo__grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="evo__axis" x={PAD.left - 8} y={y(t)} dy="0.35em" textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {spread(points.length, Math.max(2, Math.floor(plotW / 70))).map((i) => (
            <text key={i} className="evo__axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}>
              {points[i].label}
            </text>
          ))}
          <path className="evo__area" d={area} fill="url(#line-fill)" />
          <path className="evo__line" d={line} pathLength={1} />
          {active !== null && <line className="evo__cross" x1={x(active)} x2={x(active)} y1={PAD.top} y2={H - PAD.bottom} />}
          {values.map((v, i) => (
            <circle key={i} className="evo__dot" cx={x(i)} cy={y(v)} r={i === active ? 6 : 4} />
          ))}
        </svg>
      )}
      {p && (
        <div className="evo__tip" style={{ left: tipLeft, minWidth: 150 }} role="status">
          <p className="evo__tip-date">{p.tip}</p>
          <p className="evo__tip-row is-active">
            <span className="evo__key" aria-hidden="true" />
            <b>{p.value}</b>
            <span>{label}</span>
          </p>
        </div>
      )}
    </div>
  );
}
