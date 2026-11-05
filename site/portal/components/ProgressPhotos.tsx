"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addProgressPhoto, deleteProgressPhoto } from "~/actions";
import type { ProgressPhoto } from "~/lib/data";
import { shortDate, todayISO } from "~/lib/format";

/** El lado más largo de la foto que se sube: alcanza para verla a pantalla completa y pesa unos cientos de KB. */
const MAX_SIDE = 1600;

/**
 * Achica la foto en el navegador y la pasa a JPEG. Así entran varias aunque el celular las saque de 8 MB, y de paso se
 * pierden los datos que trae (la ubicación, el modelo del celular): el lienzo sólo copia los píxeles.
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file); // respeta la rotación de la cámara (EXIF)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
  if (!blob) throw new Error("toBlob");
  return blob;
}

type Shown = ProgressPhoto & { label: string };

/**
 * Las fotos de progreso de un cliente: la subida, la primera y la última lado a lado (el antes y el ahora) y el visor.
 * Se guardan todas; se muestran sólo esas dos. `photos` viene con la más nueva primero.
 */
export function ProgressPhotos({ clientId, photos, you }: { clientId: number; photos: ProgressPhoto[]; you: boolean }) {
  const shown: Shown[] =
    photos.length === 1
      ? [{ ...photos[0], label: "Primera" }]
      : photos.length > 1
        ? [
            { ...photos[photos.length - 1], label: "Primera" },
            { ...photos[0], label: "Última" },
          ]
        : [];
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [uploading, startUpload] = useTransition();
  const [open, setOpen] = useState<number | null>(null); // índice de la foto en el visor
  const input = useRef<HTMLInputElement>(null);

  function upload(files: File[]) {
    startUpload(async () => {
      let done = 0;
      const failed: string[] = [];
      for (const file of files) {
        setStatus({ text: files.length > 1 ? `Subiendo ${done + failed.length + 1} de ${files.length}…` : "Subiendo…" });
        let blob: Blob;
        try {
          blob = await shrink(file);
        } catch {
          failed.push(`${file.name}: no se pudo leer la foto (probá con un JPG o PNG)`);
          continue;
        }
        const form = new FormData();
        form.set("client_id", String(clientId));
        form.set("taken_on", date);
        form.set("photo", blob, "foto.jpg");
        const res = await addProgressPhoto(null, form);
        if (res?.error) failed.push(files.length > 1 ? `${file.name}: ${res.error}` : res.error);
        else done++;
      }
      const ok = done === 0 ? "" : done === 1 ? "1 foto subida." : `${done} fotos subidas.`;
      if (failed.length) setStatus({ text: [ok, ...failed].filter(Boolean).join(" · "), error: true });
      else setStatus({ text: ok });
    });
  }

  return (
    <div className="photos">
      <div className="card photos__upload">
        <label className="field">
          <span className="field__label">Fecha de las fotos</span>
          <input type="date" value={date} max={todayISO()} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="form-foot">
          <button type="button" className="btn btn--gold btn--sm" disabled={uploading || !date} onClick={() => input.current?.click()}>
            {uploading ? "Subiendo…" : "Subir fotos"}
          </button>
          <p className={status?.error ? "form-msg form-msg--error" : "form-msg"} role="status" aria-live="polite">
            {status?.text}
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = ""; // para poder volver a elegir las mismas
            if (files.length) upload(files);
          }}
        />
      </div>

      {photos.length === 0 ? (
        <div className="card empty">
          <p className="fact">Todavía no hay fotos</p>
          <p className="muted">
            {you
              ? "Sacate siempre la misma foto (misma pose, mismo lugar, misma luz): acá vas a ver la primera al lado de la última."
              : "Subí la del día del control, siempre con la misma pose: acá se ve la primera al lado de la última."}
          </p>
        </div>
      ) : (
        <>
          <ul className="photos__grid photos__grid--pair">
            {shown.map((p, i) => (
              <li key={p.id}>
                <button type="button" className="photos__item" onClick={() => setOpen(i)} aria-label={`Ver la ${p.label.toLowerCase()} foto, del ${shortDate(p.taken_on)}`}>
                  <img src={p.url} alt="" loading="lazy" decoding="async" />
                  <span className="photos__date">
                    <span className="photos__label">{p.label}</span>
                    {shortDate(p.taken_on)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {photos.length > 2 && (
            <p className="muted photos__count">
              {photos.length} fotos guardadas · se muestran la primera y la última
            </p>
          )}
        </>
      )}

      {open !== null && shown[open] && <Viewer photos={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Una foto a pantalla completa, con flechas (o el teclado) para pasar de la primera a la última. */
function Viewer({ photos, index, onIndex, onClose }: { photos: Shown[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const photo = photos[index];
  const prev = index > 0 ? index - 1 : null;
  const next = index < photos.length - 1 ? index + 1 : null;

  // Sin close() al desmontar: dispararía onClose (y en desarrollo, con los efectos dobles, cerraría el visor recién
  // abierto). Al sacarlo de la página, el <dialog> se va solo.
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev !== null) onIndex(prev);
      if (e.key === "ArrowRight" && next !== null) onIndex(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onIndex]);

  function remove() {
    if (!window.confirm(`¿Borrar esta foto del ${shortDate(photo.taken_on)}? No se puede deshacer.`)) return;
    startDelete(async () => {
      const form = new FormData();
      form.set("id", String(photo.id));
      const res = await deleteProgressPhoto(null, form);
      if (res?.error) return setError(res.error);
      setError(null);
      onClose();
    });
  }

  return (
    // Esc cierra el <dialog> solo; un toque fuera de la foto (en el fondo) también.
    <dialog ref={ref} className="viewer" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()} aria-label="Foto de progreso">
      <div className="viewer__bar">
        <p className="viewer__date">
          {photo.label} <span className="muted">· {shortDate(photo.taken_on)}</span>
        </p>
        <button type="button" className="btn btn--sm btn--danger" onClick={remove} disabled={deleting}>
          {deleting ? "Borrando…" : "Borrar"}
        </button>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar" title="Cerrar">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {error && <p className="form-msg form-msg--error viewer__error">{error}</p>}
      <img className="viewer__img" src={photo.url} alt={`Foto de progreso del ${shortDate(photo.taken_on)}`} />
      {prev !== null && (
        <button type="button" className="icon-btn viewer__nav viewer__nav--prev" onClick={() => onIndex(prev)} aria-label="Ver la primera" title="Primera">
          ‹
        </button>
      )}
      {next !== null && (
        <button type="button" className="icon-btn viewer__nav viewer__nav--next" onClick={() => onIndex(next)} aria-label="Ver la última" title="Última">
          ›
        </button>
      )}
    </dialog>
  );
}
