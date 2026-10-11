"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function ScrollProgress() {
  const bar = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } }
    );
  });

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: "0 0 auto 0", height: 2, zIndex: 200, pointerEvents: "none" }}
    >
      <i
        ref={bar}
        style={{
          display: "block",
          height: "100%",
          background: "var(--grad-gold-flat)",
          transform: "scaleX(0)",
          transformOrigin: "left",
        }}
      />
    </div>
  );
}
