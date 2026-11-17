import type { Metadata } from "next";
import { unsubscribe } from "~/consent-actions";
import { Form } from "~/components/Form";
import { LoginBackdrop } from "~/components/LoginBackdrop";
import { SiteHeader } from "~/components/SiteHeader";
import { verifyUnsubscribe } from "~/lib/consent";
import { getLang } from "~/lib/lang";
import { pick } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: pick(await getLang())("Dejar de recibir promociones", "Unsubscribe from offers"),
  robots: { index: false },
});

/**
 * La baja de los correos de promociones, desde el link de cada correo masivo (portal/lib/consent.ts, unsubscribeUrl):
 * sin iniciar sesión, con la firma del link. Pide confirmar con un botón: algunos programas de correo abren los links
 * solos para revisarlos, y un link que da de baja con sólo abrirlo daría de baja a gente que no lo pidió.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string }> }) {
  const sp = await searchParams;
  const id = Number(sp.c);
  const token = sp.t ?? "";
  const valid = verifyUnsubscribe(id, token);
  const lang = await getLang();
  const tr = pick(lang);

  return (
    <>
      <SiteHeader login={{ label: tr("Iniciar sesión", "Sign in"), href: "/portal/ingresar" }} lang={lang} />
      <main id="main" className="login">
        <LoginBackdrop />
        <div className="panel intro">
          <p className="eyebrow">
            <span className="dot" /> {tr("Correos", "Emails")}
          </p>
          <h1 className="h2">
            {tr("Dejar de recibir", "Stop receiving")} <em className="serif gold-text">{tr("promociones", "offers")}</em>
          </h1>
          {valid ? (
            <>
              <p className="panel__lead">
                {tr(
                  "No te vamos a mandar más novedades ni promociones. Los avisos de tus turnos y evaluaciones te siguen llegando.",
                  "We won't send you any more news or offers. Notices about your sessions and evaluations will still reach you."
                )}
              </p>
              <Form action={unsubscribe.bind(null, id, token)} submit={tr("Confirmar la baja", "Confirm")} />
            </>
          ) : (
            <p className="panel__lead">
              {tr(
                "Este link no es válido. Para dejar de recibir promociones, entrá a Mis datos en el portal o escribinos por WhatsApp.",
                "This link is not valid. To stop receiving offers, go to My data in the portal or message us on WhatsApp."
              )}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
