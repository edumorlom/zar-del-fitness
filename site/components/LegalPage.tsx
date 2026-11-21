// Una página legal (términos y condiciones, política de privacidad), de db/legal/: ver lib/legal.ts.
// Usa el encabezado y el cuerpo de las notas del blog (BlogPost.module.css), con un índice de las secciones.

import { JsonLd } from "./JsonLd";
import { Crumbs } from "./PageHero";
import { PageShell } from "./PageShell";
import { content } from "@/lib/content";
import { formatDate, otherLang, type Lang } from "@/lib/i18n";
import { LEGAL_IDS, legalDocs, legalPaths, type LegalId } from "@/lib/legal";
import { breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";
import post from "./BlogPost.module.css";
import styles from "./LegalPage.module.css";

export function legalMetadata(lang: Lang, id: LegalId) {
  const doc = legalDocs[id][lang];
  return pageMetadata({ lang, title: doc.title, description: doc.description, path: doc.path, alternates: legalPaths[id] });
}

export function LegalPage({ lang, id }: { lang: Lang; id: LegalId }) {
  const doc = legalDocs[id][lang];
  const { t, pages, contact } = content(lang);
  const others = LEGAL_IDS.filter((o) => o !== id).map((o) => legalDocs[o][lang]);

  return (
    <PageShell lang={lang} alternate={legalPaths[id][otherLang(lang)]}>
      <JsonLd
        data={[
          { ...webPageLd({ lang, path: doc.path, name: doc.title, description: doc.description }), dateModified: doc.updated },
          breadcrumbLd(lang, [{ name: doc.title, path: doc.path }]),
        ]}
      />

      <article>
        <header className={post.head} id="top">
          <div className={post.glow} aria-hidden="true" />
          <div className={post.narrow}>
            <Crumbs home={{ name: t.general.inicio, path: pages.home }} crumbs={[{ name: doc.title, path: doc.path }]} label={t.general.migasDePan} className={post.crumbs} />
            <p className={post.meta}>
              <span className="tag">{t.legal.antetitulo}</span>
              <span>
                {t.legal.actualizado} <time dateTime={doc.updated}>{formatDate(doc.updated, lang)}</time>
              </span>
            </p>
            <h1 className={post.title}>{doc.title}</h1>
          </div>
        </header>

        <div className={post.narrow}>
          {doc.toc.length > 2 && (
            <nav className={styles.toc} aria-label={t.legal.indice}>
              <p className="tag">{t.legal.indice}</p>
              <ol>
                {doc.toc.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.text.replace(/^\d+\.\s*/, "")}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className={`${post.prose} ${styles.prose}`} dangerouslySetInnerHTML={{ __html: doc.html }} />

          <aside className={styles.contact}>
            <p className={styles.contactTitle}>{t.legal.dudas}</p>
            <p>{t.legal.dudasTexto}</p>
            <p className={styles.contactLinks}>
              <a href={contact.phoneHref}>WhatsApp {contact.phone}</a>
              {others.map((o) => (
                <a key={o.id} href={o.path}>
                  {o.title}
                </a>
              ))}
            </p>
          </aside>
        </div>
      </article>
    </PageShell>
  );
}
