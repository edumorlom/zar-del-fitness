import { MEASURES } from "~/lib/clients";
import type { Checkin, Diet } from "~/lib/data";
import { shortDate } from "~/lib/format";
import { DietFields } from "./Diet";

const input = (v: number | null | undefined) => (v == null ? "" : String(v).replace(".", ","));

/** Los campos de una evaluación: vacíos para una nueva (con el plan vigente de entrada), o con lo que tiene para editarla. */
export function CheckinFields({ checkin, diet, today }: { checkin?: Checkin; diet: Diet | null; today: string }) {
  const measured = checkin && MEASURES.some((m) => checkin[m.key] !== null);
  return (
    <>
      <div className="fields fields--3">
        <label className="field">
          <span className="field__label">Fecha</span>
          <input name="date" type="date" required defaultValue={checkin?.date ?? today} max={today} />
        </label>
        <label className="field">
          <span className="field__label">Peso (kg)</span>
          <input name="weight_kg" required inputMode="decimal" placeholder="80,9" pattern="\d{2,3}([.,]\d)?" defaultValue={input(checkin?.weight_kg)} />
        </label>
        <label className="field">
          <span className="field__label">% Graso</span>
          <input name="body_fat_pct" required inputMode="decimal" placeholder="14,2" pattern="\d{1,2}([.,]\d)?" defaultValue={input(checkin?.body_fat_pct)} />
        </label>
      </div>
      <details className="more" open={measured}>
        <summary>Perímetros y balanza (opcional)</summary>
        {(["Perímetros", "Balanza"] as const).map((g) => (
          <fieldset key={g} className="more__group">
            <legend className="field__label">{g}</legend>
            <div className="fields fields--3">
              {MEASURES.filter((m) => m.group === g).map((m) => (
                <label key={m.key} className="field">
                  <span className="field__label">
                    {m.label}
                    {m.unit && ` (${m.unit})`}
                  </span>
                  <input name={m.key} inputMode="decimal" defaultValue={input(checkin?.[m.key])} />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </details>
      <details className="more" open={Boolean(checkin && diet)}>
        <summary>Plan de alimentación (opcional)</summary>
        <p className="field__hint">
          {checkin
            ? "El plan que se le dio en esta evaluación. Vacío del todo, se borra."
            : diet
              ? `Viene con el plan vigente (del ${shortDate(diet.date)}): cambiá sólo lo que cambia.`
              : "Lo ve el cliente en Mi progreso."}
        </p>
        <DietFields diet={diet} />
      </details>
    </>
  );
}
