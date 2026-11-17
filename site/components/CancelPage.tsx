// El botón de arrepentimiento (/arrepentimiento/, /en/withdrawal/) y el botón de baja de servicio (/baja/,
// /en/cancel-plan/), de la Disp. 954/2025: a simple vista desde el menú y el pie de todas las páginas, sin registrarse,
// y con el código del pedido en el momento. Los textos están en db/textos.json (cancelar y legal).

import { PageShell } from "./PageShell";
import { PageHero } from "./PageHero";
import { JsonLd } from "./JsonLd";
import { Rich } from "./Rich";
import { CancelForm } from "./CancelForm";
import { requestCancel } from "~/cancel-actions";
import type { CancelKind } from "~/lib/cancel-email";
import { content } from "@/lib/content";
import { fill, otherLang, type Lang } from "@/lib/i18n";
import { breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";
import styles from "./CancelPage.module.css";

const pathOf = (lang: Lang, kind: CancelKind) => content(lang).pages[kind];
const alternatesOf = (kind: CancelKind) => ({ es: pathOf("es", kind), en: pathOf("en", kind) });

export function cancelMetadata(lang: Lang, kind: CancelKind) {
  const { titulo, descripcion } = content(lang).t.cancelar[kind].seo;
  return pageMetadata({ lang, title: titulo, description: descripcion, path: pathOf(lang, kind), alternates: alternatesOf(kind) });
}

export function CancelPage({ lang, kind }: { lang: Lang; kind: CancelKind }) {
  const { t, pages, contact, programs } = content(lang);
  const page = t.cancelar[kind];
  const f = t.cancelar.formulario;
  const path = pathOf(lang, kind);
  const other = kind === "arrepentimiento" ? "baja" : "arrepentimiento";

  return (
    <PageShell lang={lang} alternate={alternatesOf(kind)[otherLang(lang)]}>
      <JsonLd
        data={[webPageLd({ lang, path, name: page.seo.titulo, description: page.seo.descripcion }), breadcrumbLd(lang, [{ name: page.antetitulo, path }])]}
      />
      <PageHero
        home={{ name: t.general.inicio, path: pages.home }}
        crumbsLabel={t.general.migasDePan}
        crumbs={[{ name: page.antetitulo, path }]}
        eyebrow={page.antetitulo}
        lines={page.titulo}
        lead={<p>{page.bajada}</p>}
      />

      <section className="section">
        <div className={`container ${styles.grid}`}>
          <div className={styles.info}>
            <ul className={styles.points}>
              {page.puntos.map((p) => (
                <li key={p}>
                  <Rich text={p} />
                </li>
              ))}
            </ul>
            <p className={styles.alt}>
              <a href={`${contact.phoneHref}?text=${encodeURIComponent(page.antetitulo)}`}>
                {f.otrosCanales}: {contact.phone}
              </a>
            </p>
            <p className={styles.links}>
              <a href={pages[other]}>{t.legal[other]}</a>
              <a href={pages.terminos}>{t.legal.terminos}</a>
              <a href={pages.privacidad}>{t.legal.privacidad}</a>
            </p>
          </div>

          <CancelForm
            action={requestCancel.bind(null, kind, lang)}
            plans={programs.map((p) => p.title)}
            withDate={kind === "arrepentimiento"}
            withDelete={kind === "baja"}
            labels={{
              title: f.titulo,
              name: f.nombre,
              email: f.correo,
              emailHint: f.correoAyuda,
              phone: f.telefono,
              dni: f.dni,
              dniHint: f.dniAyuda,
              plan: f.plan,
              planChoose: f.planElegir,
              planOther: f.planOtro,
              date: f.fecha,
              message: f.mensaje,
              deleteData: f.borrarDatos,
              submit: page.enviar,
              sending: f.enviando,
              doneTitle: f.listoTitulo,
              done: f.listo,
              doneNoEmail: f.sinCorreo,
              error: fill(f.error, { whatsapp: contact.phone }),
              missing: f.faltan,
              privacy: f.datos,
            }}
          />
        </div>
      </section>
    </PageShell>
  );
}
