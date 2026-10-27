import { PageShell } from "./PageShell";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { About } from "./About";
import { Programs } from "./Programs";
import { Method } from "./Method";
import { Results } from "./Results";
import { Vip } from "./Vip";
import { Visit } from "./Visit";
import { Press } from "./Press";
import { Team } from "./Team";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { JsonLd } from "./JsonLd";
import { content, videos } from "@/lib/content";
import { homePath, otherLang, type Lang } from "@/lib/i18n";
import { faqLd, pageMetadata, webPageLd } from "@/lib/seo";

const alternates = { es: homePath("es"), en: homePath("en") };

/** El título, la descripción y la URL del inicio en un idioma (app/(es)/page.tsx y app/(en)/en/page.tsx). */
export function homeMetadata(lang: Lang) {
  const { t, pages } = content(lang);
  return pageMetadata({
    lang,
    title: t.seo.inicio.titulo,
    description: t.seo.inicio.descripcion,
    path: pages.home,
    alternates,
    absoluteTitle: true,
    keywords: t.seo.palabrasClave,
  });
}

/** El inicio: el sitio es una sola página (más el blog y los podcasts). */
export function HomePage({ lang }: { lang: Lang }) {
  const c = content(lang);
  const { t } = c;
  return (
    <>
      <JsonLd
        data={[
          webPageLd({
            lang,
            path: c.pages.home,
            name: t.seo.inicio.titulo,
            description: t.seo.inicio.descripcion,
            about: "business",
            keywords: t.seo.palabrasClave,
          }),
          faqLd(lang),
        ]}
      />
      <PageShell lang={lang} alternate={homePath(otherLang(lang))}>
        <Hero
          t={t.inicio}
          hashtag={c.hashtag}
          cta={{ price: c.price("reto-online"), href: c.links.retoOnline }}
          trailer={videos.trailer}
          featuredPress={c.featuredPress}
          chips={c.heroChips}
          cursorVideo={t.general.cursorVideo}
        />
        <Marquee label={t.cinta.descripcion} top={t.cinta.arriba} bottom={t.cinta.abajo} />
        <About lang={lang} />
        <Programs lang={lang} />
        <Method t={t.metodo} />
        <Results t={t.resultados} hashtag={c.hashtag} reviews={c.googleReviews} shots={c.transformations} />
        <Vip lang={lang} />
        <Visit lang={lang} />
        <Press lang={lang} />
        <Team lang={lang} />
        <Faq t={t.preguntas} faqs={c.faqs} askHref={c.links.waDudas} />
        <FinalCta lang={lang} />
      </PageShell>
    </>
  );
}
