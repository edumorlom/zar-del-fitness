"use client";

import { startTransition, useActionState, useEffect, useId, useRef } from "react";
import type { FormState } from "~/actions";

/** Lo que dice un cartel: el título (con la segunda parte en cursiva dorada), el texto y los dos botones. */
export type Question = { title: string; accent: string; text: string; yes: string; no?: string };

/**
 * Un cartel con el diseño del sitio, en el centro sobre fondo oscuro: se abre con `dialog.current.showModal()`. Los dos
 * botones lo cierran y llaman a `onAnswer`; Esc o tocar afuera lo cierran sin llamar a nada.
 */
export function Ask({
  dialog,
  q,
  onAnswer,
}: {
  dialog: React.RefObject<HTMLDialogElement | null>;
  q: Question;
  onAnswer: (yes: boolean) => void;
}) {
  const titleId = useId();
  return (
    <dialog ref={dialog} className="ask card" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()} aria-labelledby={titleId}>
      <h2 id={titleId} className="h2 h2--sm">
        {q.title} <em className="serif gold-text">{q.accent}</em>
      </h2>
      <p className="muted">{q.text}</p>
      <div className="ask__actions">
        {[true, false].map((yes) => (
          <button
            key={String(yes)}
            type="button"
            className={yes ? "btn btn--gold btn--sm" : "btn btn--ghost btn--sm"}
            onClick={() => {
              dialog.current?.close();
              onAnswer(yes);
            }}
          >
            {yes ? q.yes : (q.no ?? "Cancelar")}
          </button>
        ))}
      </div>
    </dialog>
  );
}

/**
 * Un formulario que manda a una Server Action y muestra su error o su "ok". Los campos quedan como estaban si hay un
 * error (el <form action> de React los vaciaría); con `reset`, se vacían cuando sale bien. Si la acción le mandó un
 * correo al cliente (`sent`), lo dice en un cartel con el diseño del sitio.
 */
export function Form({
  action,
  submit,
  button = "btn btn--gold",
  confirm,
  ask,
  label,
  reset = false,
  className,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submit: React.ReactNode;
  button?: string;
  /** Un cartel antes de mandar: sólo se manda con `yes`; `no` (por defecto, "Cancelar") no manda nada. */
  confirm?: Question;
  /**
   * Una pregunta que no frena el envío, en un cartel con el diseño del sitio: con `yes` el formulario lleva notify=1,
   * con `no` se manda igual sin eso. Esc o tocar afuera no mandan nada.
   */
  ask?: Question & { no: string };
  /** Para un botón que es sólo un ícono: lo que dice el lector de pantalla. */
  label?: string;
  reset?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const asked = useRef<FormData | null>(null);
  const done = useRef<HTMLDialogElement>(null);
  const doneTitle = useId();
  useEffect(() => {
    if (reset && state?.ok) ref.current?.reset();
    if (state?.sent) done.current?.showModal();
  }, [reset, state]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (!confirm && !ask) return startTransition(() => formAction(data));
        asked.current = data;
        dialog.current?.showModal();
      }}
    >
      {children}
      {(confirm ?? ask) && (
        <Ask
          dialog={dialog}
          q={(confirm ?? ask)!}
          onAnswer={(yes) => {
            const data = asked.current;
            if (!data || (confirm && !yes)) return;
            if (ask && yes) data.set("notify", "1");
            startTransition(() => formAction(data));
          }}
        />
      )}
      {state?.sent && (
        <dialog ref={done} className="ask card" onClick={(e) => e.target === e.currentTarget && done.current?.close()} aria-labelledby={doneTitle}>
          <h2 id={doneTitle} className="h2 h2--sm">
            Correo <em className="serif gold-text">enviado</em>
          </h2>
          <p className="muted">
            {state.ok} El correo se envió correctamente a <strong className="mono">{state.sent}</strong>.
          </p>
          <div className="ask__actions">
            <button type="button" className="btn btn--gold btn--sm" onClick={() => done.current?.close()} autoFocus>
              Listo
            </button>
          </div>
        </dialog>
      )}
      <div className="form-foot">
        <button className={button} disabled={pending} aria-label={label} title={label}>
          {submit}
        </button>
        <p className={state?.error ? "form-msg form-msg--error" : "form-msg"} role="status" aria-live="polite">
          {state?.error ?? state?.ok}
        </p>
      </div>
    </form>
  );
}
