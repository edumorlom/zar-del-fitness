"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import type { FormState } from "~/actions";
import { shrinkPhotos } from "~/lib/shrink-photo";

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
 * error (el <form action> de React los vaciaría); con `reset`, se vacían cuando sale bien. Las fotos van achicadas
 * (shrinkPhotos): la de un celular, entera, puede pasar el límite de Next.js y tirar la página.
 *
 * Si la acción le manda un correo al cliente (`mailTo`), un cartel lo sigue desde que se aprieta el botón: "Enviando…",
 * y después si salió, si no salió o si no hizo falta mandarlo (lo que dice la acción en `mail`).
 */
export function Form({
  action,
  submit,
  button = "btn btn--gold",
  confirm,
  ask,
  mailTo,
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
  /** A quién le manda un correo la acción cuando sale bien (con `ask`, sólo si se contesta que sí). */
  mailTo?: string | null;
  /** Para un botón que es sólo un ícono: lo que dice el lector de pantalla. */
  label?: string;
  reset?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, sending] = useActionState(action, null);
  const [shrinking, startShrinking] = useTransition();
  const pending = sending || shrinking;
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const asked = useRef<FormData | null>(null);
  const mailBox = useRef<HTMLDialogElement>(null);
  const mailDone = useRef<HTMLButtonElement>(null);
  const mailTitle = useId();
  const [to, setTo] = useState<string | null>(null); // a quién se le está mandando, desde que se aprieta el botón

  const send = (data: FormData, mailing: boolean) => {
    if (mailing && mailTo) {
      setTo(mailTo);
      mailBox.current?.showModal();
    }
    startShrinking(async () => {
      await shrinkPhotos(data);
      startTransition(() => formAction(data));
    });
  };

  useEffect(() => {
    if (reset && state?.ok) ref.current?.reset();
    // Con un error no se guardó ni se mandó nada: el cartel se va y el error queda abajo del botón.
    if (state?.error) mailBox.current?.close();
    else if (state?.mail && !mailBox.current?.open) mailBox.current?.showModal();
  }, [reset, state]);
  // Cuando termina, el foco va a "Listo": Enter o Esp cierran el cartel.
  useEffect(() => {
    if (!pending && mailBox.current?.open) mailDone.current?.focus();
  }, [pending, state]);

  const phase = pending || !state || state.error ? "sending" : !state.mail ? "skipped" : state.mail.sent ? "sent" : "failed";
  const close = () => !pending && mailBox.current?.close();
  const mailNote = state?.mail
    ? state.mail.sent
      ? ` Se le mandó el correo a ${state.mail.to}.`
      : ` El correo a ${state.mail.to} no salió: avisale por WhatsApp.`
    : "";

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (!confirm && !ask) return send(data, true);
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
            send(data, !ask || yes);
          }}
        />
      )}
      {/* Mientras se manda, no se cierra (ni con Esc ni tocando afuera). Al cerrarlo, la página va a `next`, si hay. */}
      <dialog
        ref={mailBox}
        className="ask card"
        aria-labelledby={mailTitle}
        aria-busy={phase === "sending"}
        onClick={(e) => e.target === e.currentTarget && close()}
        onCancel={(e) => pending && e.preventDefault()}
        onClose={() => !pending && state?.next && router.push(state.next)}
      >
        <h2 id={mailTitle} className="h2 h2--sm">
          {phase === "sending" ? (
            <>
              Enviando <em className="serif gold-text">el correo…</em>
            </>
          ) : phase === "sent" ? (
            <>
              ¡Correo <em className="serif gold-text">enviado!</em>
            </>
          ) : phase === "failed" ? (
            <>
              No se pudo <em className="serif gold-text">enviar</em>
            </>
          ) : (
            <>
              Guardado, <em className="serif gold-text">sin correo</em>
            </>
          )}
        </h2>
        <p className="muted" role="status" aria-live="polite">
          {phase === "sending" ? (
            <>
              Guardando y mandándole el correo a <strong className="mono">{to}</strong>.
            </>
          ) : phase === "sent" ? (
            <>
              {state?.ok} Se le mandó a <strong className="mono">{state?.mail?.to}</strong>.
            </>
          ) : phase === "failed" ? (
            <>
              {state?.ok} El correo a <strong className="mono">{state?.mail?.to}</strong> no salió (Resend no lo aceptó): avisale
              por WhatsApp.
            </>
          ) : (
            state?.ok
          )}
        </p>
        <div className="ask__actions">
          {phase === "sending" ? (
            <span className="ask__spinner" aria-hidden="true" />
          ) : (
            <button ref={mailDone} type="button" className="btn btn--gold btn--sm" onClick={close}>
              Listo
            </button>
          )}
        </div>
      </dialog>
      <div className="form-foot">
        <button className={button} disabled={pending} aria-label={label} title={label}>
          {submit}
        </button>
        <p className={state?.error || state?.mail?.sent === false ? "form-msg form-msg--error" : "form-msg"} role="status" aria-live="polite">
          {state?.error ?? (state?.ok && state.ok + mailNote)}
        </p>
      </div>
    </form>
  );
}
