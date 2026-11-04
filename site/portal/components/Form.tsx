"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { FormState } from "~/actions";

/**
 * Un formulario que manda a una Server Action y muestra su error o su "ok". Los campos quedan como estaban si hay un
 * error (el <form action> de React los vaciaría); con `reset`, se vacían cuando sale bien.
 */
export function Form({
  action,
  submit,
  button = "btn btn--gold",
  confirm,
  label,
  reset = false,
  className,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submit: React.ReactNode;
  button?: string;
  confirm?: string;
  /** Para un botón que es sólo un ícono: lo que dice el lector de pantalla. */
  label?: string;
  reset?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (reset && state?.ok) ref.current?.reset();
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
        startTransition(() => formAction(data));
      }}
    >
      {children}
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
