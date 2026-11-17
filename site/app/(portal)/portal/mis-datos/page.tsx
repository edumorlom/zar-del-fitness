import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { saveMyConsents } from "~/consent-actions";
import { Title } from "~/components/Progress";
import { Form } from "~/components/Form";
import { Shell } from "~/components/Shell";
import { homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { CONSENT_KINDS, CONSENT_TEXT, getConsents, needsConsent, REQUIRED_CONSENTS } from "~/lib/consent";
import { getClient } from "~/lib/data";
import { getLang } from "~/lib/lang";
import { content } from "@/lib/content";
import { formatDate, pick } from "@/lib/i18n";
import { legalDocs, legalVersion } from "@/lib/legal";

export const generateMetadata = async (): Promise<Metadata> => ({ title: pick(await getLang())("Mis datos", "My data") });

/**
 * Los permisos del cliente (portal/lib/consent.ts): la primera vez que entra, y cada vez que cambian los términos o la
 * privacidad, tiene que pasar por acá antes de ver su progreso. Después puede volver a cambiar los opcionales y ver cómo
 * pedir sus datos o que los borren (Ley 25.326, arts. 14 a 16).
 */
export default async function MyDataPage() {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("user")) redirect(homeOf(viewer));
  const lang = await getLang();
  const tr = pick(lang);
  const [state, client] = await Promise.all([getConsents(viewer.id), getClient(viewer.id)]);
  const first = needsConsent(state);
  const changed = first && state.terminos?.granted && state.terminos.version !== legalVersion;
  const { contact } = content(lang);
  const terms = legalDocs.terminos[lang];
  const privacy = legalDocs.privacidad[lang];
  const wa = (text: string) => `${contact.phoneHref}?text=${encodeURIComponent(text)}`;
  const who = `${client?.name ?? viewer.name}${client?.dni ? ` (DNI ${client.dni})` : ""}`;

  return (
    <Shell viewer={viewer}>
      <section className="consent">
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{first ? tr("Antes de seguir", "Before you continue") : tr("Privacidad", "Privacy")}</span>
            </p>
            <Title plain={tr("Tus datos,", "Your data,")} accent={tr("tus permisos", "your choices")} />
            <p className="sub">
              {changed
                ? tr(
                    `Actualizamos los términos y la privacidad el ${formatDate(legalVersion, lang)}. Leelos y volvé a aceptarlos para seguir.`,
                    `We updated the terms and privacy policy on ${formatDate(legalVersion, lang)}. Please read and accept them again to continue.`
                  )
                : first
                  ? tr(
                      "Para mostrarte tu progreso guardamos datos de salud: necesitamos tu permiso expreso. Los opcionales los podés cambiar cuando quieras.",
                      "To show you your progress we store health data, so we need your express consent. You can change the optional ones at any time."
                    )
                  : tr("Lo que aceptaste y lo que podés cambiar cuando quieras.", "What you've agreed to and what you can change at any time.")}
            </p>
          </div>
        </div>

        <div className="card consent__card">
          <p className="consent__docs">
            <a href={privacy.path} target="_blank" rel="noreferrer">
              {privacy.title}
            </a>
            <a href={terms.path} target="_blank" rel="noreferrer">
              {terms.title}
            </a>
          </p>
          <Form action={saveMyConsents} submit={first ? tr("Aceptar y seguir", "Accept and continue") : tr("Guardar", "Save")}>
            <div className="consent__list">
              {CONSENT_KINDS.map((k) => {
                const now = state[k];
                const required = REQUIRED_CONSENTS.includes(k);
                // Los términos vigentes ya aceptados no se pueden "desaceptar": la casilla queda tildada y no se manda.
                const locked = k === "terminos" && !first;
                const t = CONSENT_TEXT[k][lang];
                return (
                  <label key={k} className="check consent__item">
                    <input
                      type="checkbox"
                      name={k}
                      defaultChecked={locked || (k === "terminos" ? false : (now?.granted ?? false))}
                      disabled={locked}
                      required={first && required && !(k === "salud" && now)}
                    />
                    <span>
                      <span className="strong">
                        {t.title}
                        {required && <span className="gold-text"> *</span>}
                      </span>
                      <span className="field__hint">{t.text}</span>
                      {now && (
                        <span className="consent__when">
                          {now.granted ? tr("Aceptado", "Accepted") : tr("Retirado", "Withdrawn")} · {formatDate(now.at.slice(0, 10), lang)}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="field__hint">{tr("* Obligatorio para usar el portal.", "* Required to use the portal.")}</p>
          </Form>
        </div>

        <div className="card consent__card">
          <h2 className="card-title">{tr("Tus derechos", "Your rights")}</h2>
          <p className="muted">
            {tr(
              "Podés pedir una copia de tus datos (te la damos en hasta 10 días corridos), que los corrijamos o que los borremos (en hasta 5 días hábiles). Es gratis.",
              "You can ask for a copy of your data (we provide it within 10 calendar days), or ask us to correct or delete it (within 5 business days). It's free."
            )}{" "}
            <a href={`${privacy.path}#${privacy.toc.find((s) => /derechos|rights/i.test(s.text))?.id ?? ""}`} target="_blank" rel="noreferrer">
              {tr("Más sobre tus derechos", "More about your rights")}
            </a>
          </p>
          <div className="consent__actions">
            <a className="btn btn--ghost btn--sm" href={wa(tr(`Hola, soy ${who}. Quiero una copia de mis datos personales.`, `Hi, I'm ${who}. I'd like a copy of my personal data.`))}>
              {tr("Pedir mis datos", "Request my data")}
            </a>
            <a className="btn btn--ghost btn--sm" href={wa(tr(`Hola, soy ${who}. Quiero corregir estos datos: `, `Hi, I'm ${who}. I'd like to correct this data: `))}>
              {tr("Corregir un dato", "Correct my data")}
            </a>
            <a className="btn btn--ghost btn--sm" href={wa(tr(`Hola, soy ${who}. Quiero que borren mis datos personales.`, `Hi, I'm ${who}. I'd like my personal data deleted.`))}>
              {tr("Borrar mis datos", "Delete my data")}
            </a>
          </div>
        </div>
      </section>
    </Shell>
  );
}
