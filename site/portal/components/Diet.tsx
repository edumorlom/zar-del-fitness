import { MEALS } from "~/lib/clients";
import type { Diet } from "~/lib/data";
import { longDate } from "~/lib/format";

/** Los campos del plan (diet_goal, diet_breakfast, …), con el plan vigente de entrada. */
export function DietFields({ diet }: { diet: Diet | null }) {
  return (
    <div className="fields">
      {[{ key: "goal", label: "Objetivo" } as const, ...MEALS].map((m) => (
        <label key={m.key} className="field">
          <span className="field__label">{m.label}</span>
          {m.key === "goal" ? (
            <input name="diet_goal" defaultValue={diet?.goal ?? ""} />
          ) : (
            <textarea name={`diet_${m.key}`} rows={2} defaultValue={diet?.[m.key] ?? ""} />
          )}
        </label>
      ))}
    </div>
  );
}

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
