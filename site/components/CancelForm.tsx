"use client";

// El formulario del botón de arrepentimiento y del botón de baja (components/CancelPage.tsx). Sin registrarse: manda a
// la Server Action de portal/cancel-actions.ts, que guarda el pedido y manda el código por correo en el momento.

import { useActionState } from "react";
import { Rich } from "./Rich";
import type { CancelState } from "~/cancel-actions";
import styles from "./CancelPage.module.css";

export type CancelLabels = {
  title: string;
  name: string;
  email: string;
  emailHint: string;
  phone: string;
  dni: string;
  dniHint: string;
  plan: string;
  planChoose: string;
  planOther: string;
  date: string;
  message: string;
  deleteData: string;
  submit: string;
  sending: string;
  doneTitle: string;
  done: string;
  doneNoEmail: string;
  error: string;
  missing: string;
  privacy: string;
};

export function CancelForm({
  action,
  labels,
  plans,
  withDate,
  withDelete,
}: {
  action: (state: CancelState, form: FormData) => Promise<CancelState>;
  labels: CancelLabels;
  plans: string[];
  /** El arrepentimiento pregunta cuándo se contrató (los 10 días); la baja, no. */
  withDate: boolean;
  /** La baja puede pedir, además, que se borren los datos. */
  withDelete: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state && "code" in state)
    return (
      <div className={styles.done} role="status">
        <p className={styles.doneTitle}>{labels.doneTitle}</p>
        <p>
          <Rich text={(state.emailed ? labels.done : labels.doneNoEmail).replace("{codigo}", state.code).replace("{correo}", state.email)} />
        </p>
      </div>
    );

  return (
    <form action={formAction} className={styles.form}>
      <p className={styles.formTitle}>{labels.title}</p>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>{labels.name}</span>
          <input name="name" autoComplete="name" required maxLength={120} />
        </label>
        <label className={styles.field}>
          <span>{labels.email}</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} />
          <small>{labels.emailHint}</small>
        </label>
        <label className={styles.field}>
          <span>{labels.phone}</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </label>
        <label className={styles.field}>
          <span>{labels.dni}</span>
          <input name="dni" inputMode="numeric" maxLength={20} />
          <small>{labels.dniHint}</small>
        </label>
        <label className={styles.field}>
          <span>{labels.plan}</span>
          <select name="plan" defaultValue="">
            <option value="" disabled>
              {labels.planChoose}
            </option>
            {plans.map((p) => (
              <option key={p}>{p}</option>
            ))}
            <option>{labels.planOther}</option>
          </select>
        </label>
        {withDate && (
          <label className={styles.field}>
            <span>{labels.date}</span>
            <input name="purchased_on" type="date" />
          </label>
        )}
        <label className={`${styles.field} ${styles.wide}`}>
          <span>{labels.message}</span>
          <textarea name="message" rows={3} maxLength={2000} />
        </label>
        {withDelete && (
          <label className={`${styles.check} ${styles.wide}`}>
            <input type="checkbox" name="delete_data" />
            <span>{labels.deleteData}</span>
          </label>
        )}
        {/* El campo trampa para robots: no se ve ni se puede tabular. */}
        <input className={styles.trap} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>
      <p className={styles.privacy}>{labels.privacy}</p>
      <div className={styles.submit}>
        <button className="btn btn--gold" disabled={pending}>
          {pending ? labels.sending : labels.submit}
        </button>
        {state && "error" in state && (
          <p className={styles.error} role="alert">
            {state.error === "faltan" ? labels.missing : labels.error}
          </p>
        )}
      </div>
    </form>
  );
}
