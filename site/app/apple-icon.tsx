import { ImageResponse } from "next/og";

// El ícono para la pantalla de inicio del iPhone (no acepta SVG): el mismo dibujo que app/icon.svg.
// Se exporta sin extensión (out/apple-icon): el .htaccess lo sirve como image/png.
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#000" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#A7892F" />
              <stop offset=".5" stopColor="#E7C152" />
              <stop offset="1" stopColor="#988858" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="25" fill="none" stroke="url(#g)" strokeWidth="2" />
          <path d="M21 19h22v4L27.5 41H43v4H21v-4l15.5-18H21z" fill="url(#g)" />
        </svg>
      </div>
    ),
    size
  );
}
