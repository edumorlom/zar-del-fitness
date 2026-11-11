import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { Reveals } from "@/components/motion/Reveals";
import { homeOf } from "~/lib/access";
import type { Viewer } from "~/lib/auth";
import { getLang } from "~/lib/lang";
import { pick } from "@/lib/i18n";
import { DiguiChat } from "./DiguiChat";
import { SiteHeader } from "./SiteHeader";

export const SignOut = ({ label = "Salir" }: { label?: string }) => (
  <SignOutButton redirectUrl="/portal/ingresar">
    <button className="icon-btn" aria-label={label} title={label}>
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
      </svg>
    </button>
  </SignOutButton>
);

/** El botón dorado del menú del sitio, con la sesión iniciada (app/(portal)/portal/salir). */
export const SIGN_OUT = { label: "Cerrar sesión", href: "/portal/salir" };

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Arriba, el menú del sitio (con "Cerrar sesión"); abajo, qué parte del portal es. Y las animaciones data-* del sitio. */
export async function Shell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const home = homeOf(viewer);
  const lang = await getLang();
  const tr = pick(lang);
  return (
    <>
      <SiteHeader login={{ ...SIGN_OUT, label: tr(SIGN_OUT.label, "Sign out") }} lang={lang} />
      <main id="main" className="container portal">
        <div className="portal-bar">
          <span className="eyebrow">
            <span className="num">{tr("Mi progreso", "My progress")}</span>
          </span>
          {home !== "/portal/mi-progreso" && (
            <Link className="btn btn--ghost btn--sm" href={home}>
              {tr("Volver al panel", "Back to the dashboard")}
            </Link>
          )}
        </div>
        {children}
      </main>
      <DiguiChat customerId={viewer.id} />
      {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
      <Reveals />
    </>
  );
}
