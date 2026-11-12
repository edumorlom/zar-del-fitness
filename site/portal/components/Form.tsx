"use client";

import { startTransition, useActionState, useEffect, useId, useRef } from "react";
import type { FormState } from "~/actions";

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
  confirm?: string;
  /**
   * Una pregunta que no frena el envío, en un cartel con el diseño del sitio: con `yes` el formulario lleva notify=1,
   * con `no` se manda igual sin eso. Esc o tocar afuera no mandan nada.
   */
  ask?: { title: string; accent: string; text: string; yes: string; no: string };
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
        if (confirm && !window.confirm(confirm)) return;
        const data = new FormData(e.currentTarget);
        if (!ask) return startTransition(() => formAction(data));
        asked.current = data;
        dialog.current?.showModal();
      }}
    >
      {children}
      {ask && (
        <dialog ref={dialog} className="ask card" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()} aria-labelledby="ask-title">
          <h2 id="ask-title" className="h2 h2--sm">
            {ask.title} <em className="serif gold-text">{ask.accent}</em>
          </h2>
          <p className="muted">{ask.text}</p>
          <div className="ask__actions">
            {[true, false].map((notify) => (
              <button
                key={String(notify)}
                type="button"
                className={notify ? "btn btn--gold btn--sm" : "btn btn--ghost btn--sm"}
                onClick={() => {
                  const data = asked.current;
                  dialog.current?.close();
                  if (!data) return;
                  if (notify) data.set("notify", "1");
                  startTransition(() => formAction(data));
                }}
              >
                {notify ? ask.yes : ask.no}
              </button>
            ))}
          </div>
        </dialog>
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
