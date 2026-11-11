import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import gimnasio from "@db/gimnasio.json";
import { DiguiChat } from "~/components/DiguiChat";
import { LoginBackdrop } from "~/components/LoginBackdrop";
import { SiteHeader } from "~/components/SiteHeader";
import { SIGN_OUT, SignOut } from "~/components/Shell";
import { getViewer } from "~/lib/auth";
import { getLang } from "~/lib/lang";
import { pick } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({ title: pick(await getLang())("Sin acceso", "No access") });

const wa = (text: string) => `https://wa.me/${gimnasio.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

// Entró con Clerk, pero su correo no está cargado en el portal.
export default async function NoAccessPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/ingresar");
  if (viewer !== "unregistered") redirect("/portal");
  const email = (await currentUser())?.primaryEmailAddress?.emailAddress;
  const lang = await getLang();
  const tr = pick(lang);

  return (
    <>
    <SiteHeader login={{ ...SIGN_OUT, label: tr(SIGN_OUT.label, "Sign out") }} lang={lang} />
    <main id="main" className="login">
      <LoginBackdrop />
      <div className="panel intro">
        <p className="eyebrow">
          <span className="dot" /> {tr("Mi progreso", "My progress")}
        </p>
        <h1 className="h2 intro-lines">
          <span className="ln">
            <span>{tr("Todavía", "You're not")}</span>
          </span>{" "}
          <span className="ln">
            <span>
              <em className="serif gold-text">{tr("no estás", "in yet")}</em>
            </span>
          </span>
        </h1>
        <p className="panel__lead">
          {tr(
            <>
              {email ? <>Tu correo <b>{email}</b> no está registrado.</> : "Tu correo no está registrado."} Pedile a tu coach
              que te sume con ese correo, o entrá con otro.
            </>,
            <>
              {email ? <>Your email <b>{email}</b> isn&apos;t registered.</> : "Your email isn't registered."} Ask your coach to
              add you with that email, or sign in with another one.
            </>
          )}
        </p>
        <div className="panel__actions">
          <a className="btn btn--gold" href={wa(tr("Hola! Quiero entrar a Mi progreso.", "Hi! I'd like to access the member portal."))} target="_blank" rel="noopener">
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <use href="#i-wa" />
            </svg>
            {tr("Escribinos", "Message us")}
          </a>
          <SignOut label={tr("Salir", "Sign out")} />
        </div>
      </div>
    </main>
    <DiguiChat forget />
    </>
  );
}
