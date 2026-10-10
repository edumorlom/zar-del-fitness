"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";
import { scroll } from "@/lib/scroll";
import styles from "./Modal.module.css";

export function VideoModal({ id, onClose }: { id: string | null; onClose: () => void }) {
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
      aria-label="Video"
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      <button className={styles.close} type="button" aria-label="Cerrar" onClick={onClose}>
        <Icon name="close" className="" />
      </button>
      <div className={styles.video}>
        {id && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title="Video de Zar del Fitness"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        )}
      </div>
    </dialog>
  );
}
