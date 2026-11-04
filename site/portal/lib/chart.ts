// Lo común de los gráficos de línea (Evolution, LineChart).

/** Ticks redondos (1, 2, 2,5 o 5 × 10ⁿ) que cubren de min a max. */
export function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || Math.abs(max) * 0.1 || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const lo = Math.floor(min / step) * step;
  const hi = Math.max(Math.ceil(max / step) * step, lo + step);
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/** Hasta `max` índices repartidos, siempre con el primero y el último (las etiquetas del eje). */
export const spread = (n: number, max: number) =>
  n <= max ? [...Array(n).keys()] : [...new Set(Array.from({ length: max }, (_, i) => Math.round((i * (n - 1)) / (max - 1))))];
