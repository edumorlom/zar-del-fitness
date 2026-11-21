import Image from "next/image";
import { Lines } from "./Lines";
import styles from "./PageHero.module.css";

type Crumb = { name: string; path: string };

/**
 * Las migas de pan: el inicio (`home`) y después cada página hasta la actual, que no es un link. Son las mismas que van
 * en el JSON-LD (breadcrumbLd de lib/seo.ts). `label` es el nombre para lectores de pantalla ("Migas de pan").
 */
export function Crumbs({ home, crumbs, label, className }: { home: Crumb; crumbs: Crumb[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={className}>
      <ol>
        <li>
          <a href={home.path}>{home.name}</a>
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
  );
}

/**
 * El encabezado de las páginas internas: migas de pan, el h1 (por líneas; la que va entre *asteriscos*, en cursiva
 * dorada), una bajada y botones. Las migas son las mismas que van en el JSON-LD (breadcrumbLd de lib/seo.ts); la
 * primera es el inicio (`home`).
 * Su entrada es una animación CSS y no GSAP (data-*): arranca con el primer pintado, sin esperar al JS,
 * así Google mide rápido el contenido principal (LCP).
 */
export function PageHero({
  home,
  crumbsLabel,
  crumbs,
  eyebrow,
  lines,
  lead,
  image,
  children,
}: {
  home: Crumb;
  /** El nombre de las migas para lectores de pantalla ("Migas de pan"). */
  crumbsLabel: string;
  crumbs: Crumb[];
  eyebrow: string;
  lines: string[];
  lead?: React.ReactNode;
  image?: { src: string; w: number; h: number; alt: string };
  children?: React.ReactNode;
}) {
  return (
    <section className={`${styles.hero} ${image ? styles.withImage : ""}`} id="top">
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <Crumbs home={home} crumbs={crumbs} label={crumbsLabel} className={styles.crumbs} />

          <p className="eyebrow">
            <span className="dot" /> {eyebrow}
          </p>
          <h1 className={styles.title}>
            <Lines lines={lines} />
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
