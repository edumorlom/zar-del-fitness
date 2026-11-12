"use client";

import { useId, useRef, useState } from "react";

export type PickOption = { id: number; label: string };

/**
 * Elegir un cliente escribiendo su nombre (la lista del navegador, <datalist>). Manda su id en `name`. Con `multiple`,
 * cada uno elegido queda como chip y manda un `name` por cliente.
 */
export function ClientPicker({
  name,
  id,
  options,
  defaultValue = "",
  multiple = false,
  placeholder = "Escribí el nombre",
}: {
  name: string;
  /** Para un <label htmlFor> que no envuelve al campo. */
  id?: string;
  options: PickOption[];
  defaultValue?: string;
  multiple?: boolean;
  placeholder?: string;
}) {
  const listId = useId();
  const hidden = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickOption[]>([]);
  // Dos clientes con el mismo nombre: el número los distingue.
  const seen = new Map<string, number>();
  for (const o of options) seen.set(o.label, (seen.get(o.label) ?? 0) + 1);
  const unique = options.map((o) => (seen.get(o.label)! > 1 ? { ...o, label: `${o.label} (#${o.id})` } : o));
  const byLabel = new Map(unique.map((o) => [o.label, o]));
  const initial = unique.find((o) => String(o.id) === defaultValue);

  return (
    <>
      <input
        id={id}
        type="search"
        list={listId}
        defaultValue={multiple ? "" : initial?.label}
        placeholder={placeholder}
        required={!multiple}
        autoComplete="off"
        onChange={(e) => {
          const el = e.currentTarget;
          const o = byLabel.get(el.value);
          if (multiple) {
            if (o) {
              setPicked((p) => (p.some((x) => x.id === o.id) ? p : [...p, o]));
              el.value = "";
            }
            return;
          }
          // Un <input hidden> de texto (no type="hidden"): así form.reset() lo vuelve a su valor inicial.
          hidden.current!.value = o ? String(o.id) : "";
          el.setCustomValidity(o || !el.value ? "" : "Elegí un cliente de la lista.");
        }}
      />
      <datalist id={listId}>
        {unique
          .filter((o) => !picked.some((p) => p.id === o.id))
          .map((o) => (
            <option key={o.id} value={o.label} />
          ))}
      </datalist>
      {multiple ? (
        picked.length > 0 && (
          <span className="chips">
            {picked.map((p) => (
              <span key={p.id} className="pill">
                <input type="hidden" name={name} value={p.id} />
                {p.label}{" "}
                <button type="button" className="pill__x" aria-label={`Quitar a ${p.label}`} onClick={() => setPicked((all) => all.filter((x) => x.id !== p.id))}>
                  ×
                </button>
              </span>
            ))}
          </span>
        )
      ) : (
        <input ref={hidden} name={name} defaultValue={initial ? String(initial.id) : ""} hidden readOnly />
      )}
    </>
  );
}
