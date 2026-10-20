"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { scroll } from "@/lib/scroll";
import { SmoothScroll } from "./SmoothScroll";
import { Cursor } from "./Cursor";
import { ScrollProgress } from "./ScrollProgress";
import { VideoModal } from "./VideoModal";

/** La página propia de un video (un episodio del podcast): su URL y el título de la pestaña. */
export type VideoPage = { url: string; title: string };

type MotionState = {
  /** Abre un video de YouTube en el modal. Con `page`, la URL pasa a ser la del video mientras está abierto. */
  openVideo: (youtubeId: string, page?: VideoPage) => void;
};

const MotionContext = createContext<MotionState>({ openVideo: () => {} });

export const useMotion = () => useContext(MotionContext);

declare global {
  interface Window {
    /** El #ancla con la que se abrió la página (ver app/layout.tsx). */
    __zarHash?: string;
  }
}

/** Los textos del video, de db/textos.json, ya en el idioma de la página. */
type MotionLabels = {
  video: { nombre: string; cerrar: string; titulo: string };
};

export function MotionProvider({ labels, children }: { labels: MotionLabels; children: React.ReactNode }) {
  const [video, setVideo] = useState<string | null>(null);
  // El título de la pestaña antes de abrir un video con su propia URL, para volver a ponerlo al cerrarlo.
  const pageTitle = useRef("");

  // Un video con su página (un episodio del podcast) suma una entrada al historial con su URL: se puede compartir o
  // recargar (va a su página), y "atrás" lo cierra. history.pushState lo integra al router de Next.js.
  const openVideo = useCallback((id: string, page?: VideoPage) => {
    setVideo(id);
    if (!page) return;
    pageTitle.current = document.title;
    history.pushState({ video: id, title: page.title }, "", page.url);
    document.title = page.title;
  }, []);
  const closeVideo = useCallback(() => {
    setVideo(null);
    // Cerrado con la X, Escape o un click afuera: volver a la URL de antes (el popstate de abajo pone el título).
    if (history.state?.video) history.back();
  }, []);
  useEffect(() => {
    // Recargada con un video abierto, la página ya es la del video: su entrada del historial deja de abrirlo.
    if (history.state?.video) history.replaceState({ ...history.state, video: undefined, title: undefined }, "");
    const onPopState = () => {
      const state = history.state;
      if (state?.video) {
        setVideo(state.video);
        document.title = state.title;
      } else if (pageTitle.current) {
        setVideo(null);
        document.title = pageTitle.current;
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo(() => ({ openVideo }), [openVideo]);

  // Se abrió con un #ancla (p. ej. "/#programas" desde los podcasts): scrollear hasta la sección una vez montado todo.
  useEffect(() => {
    const hash = window.__zarHash;
    if (!hash) return;
    delete window.__zarHash;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    const t = setTimeout(() => scroll.to(target), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <MotionContext.Provider value={value}>
      <SmoothScroll />
      <Cursor />
      <ScrollProgress />
      {children}
      <VideoModal id={video} onClose={closeVideo} labels={labels.video} />
    </MotionContext.Provider>
  );
}
