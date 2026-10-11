"use client";

import { useEffect, useRef } from "react";
import { reducedMotion } from "@/lib/gsap";

const COLORS = ["#D6A61D", "#E7C152", "#988858", "#DCDCDC", "#F3E3AD"];

type P = { x: number; y: number; r: number; vy: number; vx: number; t: number; s: number; c: string };

/** Destellos dorados/diamante que flotan, en referencia al logo. Se pausa fuera de pantalla. */
export function Sparkles({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let parts: P[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (anywhere: boolean): P => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.25 + 0.05),
      vx: (Math.random() - 0.5) * 0.08,
      t: Math.random() * Math.PI * 2,
      s: Math.random() * 0.02 + 0.008,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    });

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      parts = Array.from({ length: count }, () => spawn(true));
    };

    const star = (p: P, a: number) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = p.c;
      if (p.r > 1.6) {
        // destello de 4 puntas
        const l = p.r * 3.2 * (0.6 + a * 0.6);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - l);
        ctx.quadraticCurveTo(p.x, p.y, p.x + l, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + l);
        ctx.quadraticCurveTo(p.x, p.y, p.x - l, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - l);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.t += p.s;
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < -10) parts[i] = spawn(false);
        star(p, 0.15 + ((Math.sin(p.t) + 1) / 2) * 0.75);
      }
      ctx.globalAlpha = 1;
      if (visible) raf = requestAnimationFrame(frame);
    };

    resize();
    if (reducedMotion()) {
      frame();
      cancelAnimationFrame(raf);
      return;
    }
    raf = requestAnimationFrame(frame);

    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
