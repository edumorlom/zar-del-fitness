import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { whatsapp } from "@/lib/content";
import { pick } from "@/lib/i18n";
import { DiguiChat } from "~/components/DiguiChat";
import { LoginBackdrop } from "~/components/LoginBackdrop";
import { SIGN_OUT, SignOut } from "~/components/Shell";
import { SiteHeader } from "~/components/SiteHeader";
import { Title } from "~/components/Title";
import { getViewer } from "~/lib/auth";
import { getLang } from "~/lib/lang";

export const generateMetadata = async (): Promise<Metadata> => ({ title: pick(await getLang())("Sin acceso", "No access") });

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
        <Title as="h1" className="h2" intro plain={tr("Todavía", "You're not")} accent={tr("no estás", "in yet")} />
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
          <a className="btn btn--gold" href={whatsapp(tr("Hola! Quiero entrar a Mi progreso.", "Hi! I'd like to access the member portal."))} target="_blank" rel="noopener">
            <Icon name="wa" />
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
