"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { scroll } from "@/lib/scroll";
import { Preloader } from "./Preloader";
import { SmoothScroll } from "./SmoothScroll";
import { Cursor } from "./Cursor";
import { ScrollProgress } from "./ScrollProgress";
import { VideoModal } from "./VideoModal";

type MotionState = {
  /** true cuando el preloader terminó y la intro del hero puede arrancar */
  ready: boolean;
  openVideo: (youtubeId: string) => void;
};

const MotionContext = createContext<MotionState>({ ready: true, openVideo: () => {} });

export const useMotion = () => useContext(MotionContext);

declare global {
  interface Window {
    /** El #ancla con la que se abrió la página (ver app/layout.tsx). */
    __zarHash?: string;
  }
}

/** Los textos del preloader y del video, de db/textos.json, ya en el idioma de la página. */
export type MotionLabels = {
  preloader: { reto: string; dias: string };
  video: { nombre: string; cerrar: string; titulo: string };
};

export function MotionProvider({ home, labels, children }: { home: string; labels: MotionLabels; children: React.ReactNode }) {
  // El preloader es la intro del inicio ("/" o "/english/"): las otras páginas arrancan directo.
  // usePathname() no trae la barra final: "/english".
  const [intro] = useState(`${usePathname().replace(/\/$/, "")}/` === home);
  const [ready, setReady] = useState(!intro);
  const [video, setVideo] = useState<string | null>(null);

  const onPreloaderDone = useCallback(() => setReady(true), []);
  const closeVideo = useCallback(() => setVideo(null), []);
  const value = useMemo(() => ({ ready, openVideo: setVideo }), [ready]);

  // Se abrió con un #ancla (p. ej. "/#programas" desde el blog): scrollear hasta la sección una vez listo todo.
  useEffect(() => {
    const hash = window.__zarHash;
    if (!ready || !hash) return;
    delete window.__zarHash;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    const t = setTimeout(() => scroll.to(target), 120);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <MotionContext.Provider value={value}>
      <SmoothScroll />
      {intro && <Preloader onDone={onPreloaderDone} labels={labels.preloader} />}
      <Cursor />
      <ScrollProgress />
      {children}
      <VideoModal id={video} onClose={closeVideo} labels={labels.video} />
    </MotionContext.Provider>
  );
}
