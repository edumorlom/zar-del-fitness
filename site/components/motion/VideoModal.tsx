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

  useEffect(() => {
    const d = dialog.current!;
    if (!id) return;
    d.showModal();
    scroll.lock();
    return () => {
      d.close();
      scroll.unlock();
    };
  }, [id]);

  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-label={labels.nombre}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      <button className={styles.close} type="button" aria-label={labels.cerrar} onClick={onClose}>
        <Icon name="close" className="" />
      </button>
      <div className={styles.video}>
        {id && (
          <iframe
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
