import Link from "next/link";
import { Reveals } from "@/components/motion/Reveals";
import { homeOf } from "~/lib/access";
import type { Viewer } from "~/lib/auth";
import { getLang } from "~/lib/lang";
import { content } from "@/lib/content";
import { pick } from "@/lib/i18n";
import { DiguiChat } from "./DiguiChat";
import { PostHogIdentify, PostHogSignOut } from "./DiguiIdentify";
import { SiteHeader } from "./SiteHeader";

export const SignOut = PostHogSignOut;

/** El botón dorado del menú del sitio, con la sesión iniciada (app/(portal)/portal/salir). */
export const SIGN_OUT = { label: "Cerrar sesión", href: "/portal/salir" };

/** Arriba, el menú del sitio (con "Cerrar sesión"); abajo, qué parte del portal es. Y las animaciones data-* del sitio. */
export async function Shell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const home = homeOf(viewer);
  const lang = await getLang();
  const tr = pick(lang);
  const { t, pages } = content(lang);
  return (
    <>
      <PostHogIdentify userId={viewer.id} name={viewer.name} email={viewer.email} role={viewer.scopes.join(", ")} />
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
        {/* Los permisos del cliente y las páginas legales del sitio (db/legal/), en su idioma */}
        <nav className="portal-legal" aria-label={tr("Legal", "Legal")}>
          {viewer.scopes.includes("user") && <Link href="/portal/mis-datos">{tr("Mis datos y permisos", "My data and choices")}</Link>}
          <a href={pages.privacidad}>{t.legal.privacidad}</a>
          <a href={pages.terminos}>{t.legal.terminos}</a>
        </nav>
      </main>
      <DiguiChat customerId={viewer.id} />
      {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
      <Reveals />
    </>
  );
}
