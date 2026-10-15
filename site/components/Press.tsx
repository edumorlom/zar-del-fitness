import { Lines } from "./Lines";
import { PressList } from "./PressList";
import { content } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./Press.module.css";

export function Press({ lang }: { lang: Lang }) {
  const { t, press } = content(lang);
  return (
    <section className={`section ${styles.press}`}>
      <div className="container">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            <span className="num">06</span> {t.trayectoria.antetitulo}
          </p>
          <h2 className="h2" data-lines>
            <Lines lines={t.trayectoria.titulo} />
          </h2>
        </header>

        <PressList items={press} alt={t.trayectoria.imagen} />
      </div>
    </section>
  );
}
