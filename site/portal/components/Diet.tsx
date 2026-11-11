import { MEALS } from "~/lib/clients";
import type { Diet } from "~/lib/data";
import { longDate } from "~/lib/format";

/** El plan de alimentación vigente, comida por comida. Lo que no se cargó no aparece. */
export function DietCard({ diet }: { diet: Diet }) {
  return (
    <div className="card" data-reveal>
      <p className="kpi__sub">
        Desde la evaluación del {longDate(diet.date)}
        {diet.goal && ` · objetivo: ${diet.goal}`}
      </p>
      <dl className="facts-grid">
        {MEALS.filter((m) => diet[m.key]).map((m) => (
          <div key={m.key} className="fact-item">
            <dt className="label">{m.label}</dt>
            <dd className="pre">{diet[m.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
