import { PageShell } from "@/components/PageShell";
import { Icon } from "@/components/Icon";
import { links, pages } from "@/lib/content";
import styles from "./not-found.module.css";

// La página 404 (out/404.html). También la ven los links viejos del sitio anterior que ya no existen
// (tienda, carrito, mi cuenta…; ver public/.htaccess), así que muestra a dónde ir.
export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <PageShell>
      <section className={styles.wrap} id="top">
        <div className="container">
          <p className="eyebrow">
            <span className="dot" /> Error 404
          </p>
          <h1 className={styles.title}>
            Esta página <em className="serif gold-text">no existe.</em>
          </h1>
          <p className={styles.lead}>
            Puede que el link sea del sitio anterior. La tienda online ya no está: la inscripción a los programas es por
            WhatsApp.
          </p>
          <ul className={styles.links}>
            <li>
              <a className="btn btn--gold" href="/">
                <span>Ir al inicio</span>
                <Icon name="arrow" />
              </a>
            </li>
            <li>
              <a className="link-arrow" href={pages.online}>
                Entrenamiento online <Icon name="arrow" />
              </a>
            </li>
            <li>
              <a className="link-arrow" href={pages.presencial}>
                Entrenamiento presencial <Icon name="arrow" />
              </a>
            </li>
            <li>
              <a className="link-arrow" href={pages.blog}>
                Blog <Icon name="arrow" />
              </a>
            </li>
            <li>
              <a className="link-arrow" href={links.waInfo}>
                <Icon name="wa" /> Escribinos
              </a>
            </li>
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
