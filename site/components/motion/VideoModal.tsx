"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";
import { scroll } from "@/lib/scroll";
import styles from "./Modal.module.css";

export function VideoModal({ id, onClose, labels }: {
  id: string | null;
  onClose: () => void;
  labels: { nombre: string; cerrar: string; titulo: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Abierto mientras haya un video. Al pasar de un video a otro (atrás/adelante entre episodios) sigue abierto y
  // sólo cambia el iframe.
  const open = id !== null;

  useEffect(() => {
    const d = dialog.current!;
    if (!open) return;
    d.showModal();
    scroll.lock();
    return () => {
      d.close();
      scroll.unlock();
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-label={labels.nombre}
      // El evento close llega también cuando lo cerramos nosotros (id ya es null): sólo cuenta el de Escape.
      onClose={() => id !== null && onClose()}
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      <button className={styles.close} type="button" aria-label={labels.cerrar} onClick={onClose}>
        <Icon name="close" className="" />
      </button>
      <div className={styles.video}>
        {id && (
          <iframe
            key={id}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={labels.titulo}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        )}
      </div>
    </dialog>
  );
}
