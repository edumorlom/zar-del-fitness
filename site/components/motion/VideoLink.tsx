"use client";

import type { ComponentProps } from "react";
import { useMotion, type VideoPage } from "./MotionProvider";

/**
 * Link a la página de un video (un episodio del podcast). Un click común abre el video en el modal y cambia la URL a
 * la de esa página, sin recargar; con Cmd/Ctrl, Shift o la rueda del mouse abre la página, como cualquier link.
 * `page` es la URL y el título de la pestaña; `cursor`, el texto del cursor al pasar por encima.
 */
export function VideoLink({ videoId, page, cursor, ...rest }: { videoId: string; page: VideoPage; cursor: string } & ComponentProps<"a">) {
  const { openVideo } = useMotion();
  // data-video: para el evento VideoPlay de LogRocket (components/SessionRecording.tsx).
  return (
    <a
      href={page.url}
      data-cursor={cursor}
      data-video={videoId}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openVideo(videoId, page);
      }}
      {...rest}
    />
  );
}
