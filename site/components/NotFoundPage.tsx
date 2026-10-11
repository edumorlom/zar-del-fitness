import { PageShell } from "./PageShell";
import { Icon } from "./Icon";
import { Rich } from "./Rich";
import { content } from "@/lib/content";
import styles from "./NotFoundPage.module.css";

// La página 404 (out/404.html), una sola para todo el sitio: en castellano, con una línea en inglés que lleva al
// sitio en inglés. También la ven los links viejos del sitio anterior que ya no existen (tienda, carrito, mi cuenta…;
// ver public/.htaccess), así que muestra a dónde ir.
export function NotFoundPage() {
  const { t, pages, links } = content("es");
  const en = content("en");
  const n = t.noEncontrada;
  return (
    <PageShell lang="es" alternate={en.pages.home}>
      <section className={styles.wrap} id="top">
        <div className="container">
          <p className="eyebrow">
            <span className="dot" /> {n.antetitulo}
          </p>
          <h1 className={styles.title}>
            <Rich text={n.encabezado} emClass="serif gold-text" />
          </h1>
          <p className={styles.lead}>{n.texto}</p>
          <ul className={styles.links}>
            <li>
              <a className="btn btn--gold" href={pages.home}>
                <span>{n.irAlInicio}</span>
                <Icon name="arrow" />
              </a>
            </li>
            <li>
              <a className="link-arrow" href={`${pages.home}#programas`}>
                {t.menu.programas} <Icon name="arrow" />
              </a>
            </li>
            <li>
              <a className="link-arrow" href={pages.blog}>
                {t.menu.blog} <Icon name="arrow" />
              </a>
            </li>
            <li>
              <a className="link-arrow" href={links.waInfo}>
                <Icon name="wa" /> {t.encabezado.escribinos}
              </a>
            </li>
          </ul>
          <p className={styles.other} lang={en.locale.html}>
            {en.t.noEncontrada.encabezado.replace(/\*/g, "")}{" "}
            <a className="link-arrow" href={en.pages.home} hrefLang="en">
              {en.t.noEncontrada.sitioEnIngles} <Icon name="arrow" />
            </a>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
