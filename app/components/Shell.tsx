import { SignOutButton } from "@clerk/nextjs";
import { Reveals } from "@/components/motion/Reveals";
import type { Viewer } from "~/lib/auth";
import { SiteHeader } from "./SiteHeader";

export const SignOut = () => (
  <SignOutButton redirectUrl="/ingresar">
    <button className="icon-btn" aria-label="Salir" title="Salir">
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
      </svg>
    </button>
  </SignOutButton>
);

const ROLE_LABEL = { admin: "Admin", coach: "Coach", user: "Mi progreso" } as const;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Arriba, el menú del sitio; abajo, quién entró y el botón para salir. Y las animaciones data-* del sitio. */
export function Shell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader login={{ label: viewer.role === "user" ? "Mi progreso" : "Clientes", href: "/" }} />
      <main id="main" className="container portal">
        <div className="portal-bar">
          <span className="eyebrow">
            <span className="num">{ROLE_LABEL[viewer.role]}</span>
          </span>
          <div className="me">
            <span className="avatar" aria-hidden="true">
              {initials(viewer.name)}
            </span>
            <span className="me__name">{viewer.name}</span>
            <SignOut />
          </div>
        </div>
        {children}
      </main>
      {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
      <Reveals />
    </>
  );
}
