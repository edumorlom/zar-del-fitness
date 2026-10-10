"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<string | null>(null);

  const onPreloaderDone = useCallback(() => setReady(true), []);
  const closeVideo = useCallback(() => setVideo(null), []);
  const value = useMemo(() => ({ ready, openVideo: setVideo }), [ready]);

  return (
    <MotionContext.Provider value={value}>
      <SmoothScroll />
      <Preloader onDone={onPreloaderDone} />
      <Cursor />
      <ScrollProgress />
      {children}
      <VideoModal id={video} onClose={closeVideo} />
    </MotionContext.Provider>
  );
}
