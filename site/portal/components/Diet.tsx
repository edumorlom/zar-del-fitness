import { MEALS } from "~/lib/clients";
import type { Diet } from "~/lib/data";
import { longDate } from "~/lib/format";
import { pick, type Lang } from "@/lib/i18n";

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
export function DietCard({ diet, lang = "es" }: { diet: Diet; lang?: Lang }) {
  const tr = pick(lang);
  return (
    <div className="card" data-reveal>
      <p className="kpi__sub">
        {tr("Desde la evaluación del", "Since the evaluation on")} {longDate(diet.date, lang)}
        {diet.goal && ` · ${tr("objetivo", "goal")}: ${diet.goal}`}
      </p>
      <dl className="facts-grid">
        {MEALS.filter((m) => diet[m.key]).map((m) => (
          <div key={m.key} className="fact-item">
            <dt className="label">{tr(m.label, m.en)}</dt>
            <dd className="pre">{diet[m.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
