import { Fragment } from "react";
import Image from "next/image";
import styles from "./PageHero.module.css";

type Crumb = { name: string; path: string };

/**
 * El encabezado de las páginas internas: migas de pan, el h1 (por líneas, la última en cursiva dorada),
 * una bajada y botones. Las migas son las mismas que van en el JSON-LD (breadcrumbLd de lib/seo.ts).
 * Su entrada es una animación CSS y no GSAP (data-*): arranca con el primer pintado, sin esperar al JS,
 * así Google mide rápido el contenido principal (LCP).
 */
export function PageHero({
  crumbs,
  eyebrow,
  lines,
  accent,
  lead,
  image,
  children,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  lines: string[];
  accent?: string;
  lead?: React.ReactNode;
  image?: { src: string; w: number; h: number; alt: string };
  children?: React.ReactNode;
}) {
  return (
    <section className={`${styles.hero} ${image ? styles.withImage : ""}`} id="top">
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <nav aria-label="Migas de pan" className={styles.crumbs}>
            <ol>
              <li>
                <a href="/">Inicio</a>
              </li>
              {crumbs.map((c, i) =>
                i === crumbs.length - 1 ? (
                  <li key={c.path} aria-current="page">
                    {c.name}
                  </li>
                ) : (
                  <li key={c.path}>
                    <a href={c.path}>{c.name}</a>
                  </li>
                )
              )}
            </ol>
          </nav>

          <p className="eyebrow">
            <span className="dot" /> {eyebrow}
          </p>
          <h1 className={styles.title}>
            {/* Con un espacio entre líneas, para que el texto no quede pegado ("Entrenamientoonline") */}
            {lines.map((l, i) => (
              <Fragment key={l}>
                {i > 0 && " "}
                <span className="ln">
                  <span>{l}</span>
                </span>
              </Fragment>
            ))}
            {accent && " "}
            {accent && (
              <span className="ln">
                <span>
                  <em className="serif gold-text">{accent}</em>
                </span>
              </span>
            )}
          </h1>
          {lead && (
            <div className={styles.lead}>
              {lead}
            </div>
          )}
          {children && (
            <div className={styles.ctas}>
              {children}
            </div>
          )}
        </div>

        {image && (
          <figure className={styles.media}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.w}
              height={image.h}
              sizes="(max-width: 900px) 90vw, 40vw"
              fetchPriority="high"
            />
          </figure>
        )}
      </div>
    </section>
  );
}
