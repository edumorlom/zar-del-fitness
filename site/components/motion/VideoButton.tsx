"use client";

import type { ComponentProps } from "react";
import { useMotion } from "./MotionProvider";

/** Botón que abre un video de YouTube en el modal global. `cursor` es el texto del cursor al pasar por encima. */
export function VideoButton({ videoId, cursor, ...rest }: { videoId: string; cursor: string } & ComponentProps<"button">) {
  const { openVideo } = useMotion();
  // data-video: para el evento VideoPlay de LogRocket (components/SessionRecording.tsx).
  return <button type="button" data-cursor={cursor} data-video={videoId} onClick={() => openVideo(videoId)} {...rest} />;
}
