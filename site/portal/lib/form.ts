// Lo común de los formularios del portal (las Server Actions de portal/*-actions.ts): lo que responden y cómo leen
// sus campos. Sin base ni servidor: también lo usan las páginas y los tests.

/** Lo que responde un formulario. `sent`: a quién le llegó el correo que mandó; el formulario lo muestra en un cartel. */
export type FormState = { error?: string; ok?: string; sent?: string } | null;

/** Un campo de texto, sin espacios de más ("" si no vino). */
export const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** Un número escrito con coma o con punto ("80,9" → 80.9); NaN si no es un número. */
export const decimal = (form: FormData, key: string) => Number(text(form, key).replace(",", "."));

/** Una fecha "AAAA-MM-DD" (sólo la forma: el 30 de febrero pasa). */
export const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Un correo con la forma de un correo: alcanza para saber si se le puede escribir. */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string | null | undefined): v is string => EMAIL.test(v ?? "");
