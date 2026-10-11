"use client";

import type { ComponentProps } from "react";
import { useMotion } from "./MotionProvider";

/** Botón que abre un video de YouTube en el modal global. */
export function VideoButton({ videoId, ...rest }: { videoId: string } & ComponentProps<"button">) {
  const { openVideo } = useMotion();
  return <button type="button" data-cursor="Play" onClick={() => openVideo(videoId)} {...rest} />;
}
