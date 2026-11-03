"use client";

import { useState } from "react";

/**
 * Un formulario largo en pasos (Personales, Programa, …). Todos los pasos están en el mismo <form>: se guarda todo junto
 * desde cualquiera, y los que no se ven igual se mandan. Sin `required` adentro: un campo obligatorio en un paso oculto
 * frenaría el envío sin avisar (el servidor valida).
 */
export function Steps({ steps }: { steps: { id: string; label: string; content: React.ReactNode }[] }) {
  const [i, setI] = useState(0);
  const n = steps.length;
  return (
    <div className="steps">
      <div className="steps__bar">
        <span className="steps__track" aria-hidden="true">
          {steps.map((s, k) => (
            <span key={s.id} data-done={k <= i} />
          ))}
        </span>
        <span className="steps__count">
          Paso {i + 1} de {n} · {steps[i].label}
        </span>
      </div>
      <div className="steps__body">
        <div className="steps__nav" role="tablist" aria-label="Pasos">
          {steps.map((s, k) => (
            <button key={s.id} type="button" role="tab" aria-selected={k === i} aria-controls={`step-${s.id}`} onClick={() => setI(k)}>
              <span className="steps__num">{k + 1}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div className="steps__panels">
          {steps.map((s, k) => (
            <div key={s.id} id={`step-${s.id}`} role="tabpanel" hidden={k !== i}>
              {s.content}
            </div>
          ))}
          <div className="steps__move">
            {i > 0 && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setI(i - 1)}>
                Atrás
              </button>
            )}
            {i < n - 1 && (
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setI(i + 1)}>
                Siguiente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
