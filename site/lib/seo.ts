// SEO: la metadata de cada página y los datos estructurados (JSON-LD) que leen Google y los buscadores con IA.
// Todo sale de lib/content.ts (y por lo tanto de db/): si cambia un precio o un horario, cambia acá también.
// Cada página dice cuál es su versión en el otro idioma (hreflang), para que Google muestre la que corresponde.

import type { Metadata } from "next";
import { business, content, siteUrl, socials } from "./content";
import { LANGS, locales, otherLang, type Lang } from "./i18n";

/** "/podcasts/" → "https://zardelfitness.com.ar/podcasts/" */
export const abs = (path: string) => new URL(path, siteUrl).href;

const xHandle = socials.find((s) => s.icon === "x")?.href.split("/").pop();

/** La URL de la página en cada idioma, si existe en los dos. */
export type Alternates = Record<Lang, string>;

/**
 * Los links rel="alternate" hreflang: la página en castellano, en inglés, y "x-default" (para quien no habla
 * ninguno de los dos) la de castellano, que es la del inicio del sitio. "es" sin país: es para todo hispanohablante.
 */
export const languages = (alternates: Alternates) => ({ es: alternates.es, en: alternates.en, "x-default": alternates.es });

type PageMeta = {
  lang: Lang;
  title: string;
  description: string;
  /** La URL de la página, p. ej. "/podcasts/". Es la canónica. */
  path: string;
  /** La misma página en los dos idiomas (si no está traducida, no va). */
  alternates?: Alternates;
  /** El título tal cual, sin " | Zar del Fitness" (para el inicio). */
  absoluteTitle?: boolean;
  /** Las búsquedas a las que apunta la página (<meta name="keywords">). Ni Google ni Bing lo usan para posicionar; Bing puede tomar una lista larga como spam. */
  keywords?: string[];
  article?: { publishedTime: string; authors: string[]; section?: string };
};

/** Título, descripción, URL canónica y cómo se ve al compartir. La imagen sale del opengraph-image.tsx de cada página. */
export function pageMetadata({ lang, title, description, path, alternates, absoluteTitle, keywords, article }: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${business.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    // <meta name="author">: en las notas, el autor de la nota (el layout pone a Ronald en todas las páginas).
    ...(article && { authors: article.authors.map((name) => ({ name })) }),
    alternates: { canonical: path, ...(alternates && { languages: languages(alternates) }) },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: business.name,
      locale: locales[lang].og,
      ...(alternates && { alternateLocale: [locales[otherLang(lang)].og] }),
      ...(article
        ? { type: "article", publishedTime: article.publishedTime, authors: article.authors, section: article.section }
        : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, site: xHandle && `@${xHandle}` },
  };
}

// ---------- JSON-LD ----------

// Los mismos en los dos idiomas: son el mismo sitio, el mismo gimnasio y la misma persona.
const ids = {
  website: abs("/#sitio"),
  business: abs("/#negocio"),
  ronald: abs("/#ronald"),
};

const DAYS: Record<string, string> = {
  lunes: "Monday",
  martes: "Tuesday",
  miércoles: "Wednesday",
  jueves: "Thursday",
  viernes: "Friday",
  sábado: "Saturday",
  domingo: "Sunday",
};

// El texto en castellano y en inglés, de db/: ChatGPT y otros buscadores con IA buscan en inglés aunque les pregunten
// en español. Así el gimnasio y Ronald tienen la misma descripción en las páginas de los dos idiomas.
const bilingual = (text: (lang: Lang) => string) => LANGS.map((l) => ({ "@value": text(l), "@language": locales[l].html }));

const memberIn = (lang: Lang, id: string) => content(lang).team.find((m) => m.id === id)!;
const ronaldIn = (lang: Lang) => memberIn(lang, "ronald");

/** Las certificaciones de un entrenador (db/equipo.json, credenciales), con el nombre en los dos idiomas. */
const credentials = (id: string) =>
  memberIn("es", id).credentials.map((c, i) => ({
    "@type": "EducationalOccupationalCredential",
    name: bilingual((l) => memberIn(l, id).credentials[i].title),
    credentialCategory: "certificate",
    ...(c.issuer && { recognizedBy: { "@type": "EducationalOrganization", name: c.issuer } }),
  }));

/** El sitio, el gimnasio y Ronald: van en todas las páginas (el layout de cada idioma). */
export function siteGraph(lang: Lang) {
  const { t, pages, programs, schedule, team, press } = content(lang);
  const ronald = ronaldIn(lang);
  return [
    {
      "@type": "WebSite",
      "@id": ids.website,
      url: abs("/"),
      name: business.name,
      inLanguage: LANGS.map((l) => locales[l].html),
      publisher: { "@id": ids.business },
    },
    {
      "@type": "ExerciseGym",
      "@id": ids.business,
      name: business.googleName,
      alternateName: [business.name, business.gym, ...LANGS.map((l) => content(l).t.seo.otroNombre)],
      description: bilingual((l) => content(l).t.seo.negocio),
      slogan: bilingual((l) => content(l).t.lema),
      // Las búsquedas a las que apunta (db/textos.json, seo.palabrasClave), en los dos idiomas.
      keywords: LANGS.flatMap((l) => content(l).t.seo.palabrasClave).join(", "),
      // Presencial en Buenos Aires; el Reto online, en cualquier país (no hay un lugar "todo el mundo" en schema.org).
      areaServed: [
        { "@type": "City", name: "Buenos Aires" },
        { "@type": "Country", name: "Argentina" },
      ],
      knowsLanguage: "es",
      url: abs(pages.home),
      logo: { "@type": "ImageObject", url: abs("/img/logo.webp"), width: 666, height: 361 },
      image: [abs("/img/ronald-hero.jpg"), abs("/img/ronald-portrait.webp"), abs("/img/ronald-seated.webp")],
      telephone: business.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: business.street,
        addressLocality: "Buenos Aires",
        addressRegion: business.city,
        postalCode: business.postalCode,
        addressCountry: "AR",
      },
      geo: { "@type": "GeoCoordinates", latitude: business.lat, longitude: business.lng },
      hasMap: business.googleMaps,
      openingHoursSpecification: schedule.slots.map((s) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: schedule.dayNames.map((d) => DAYS[d]),
        opens: s.opens24,
        closes: s.closes24,
      })),
      priceRange: "$$$",
      currenciesAccepted: "ARS, USD",
      // La ficha de Google Maps también: así Google y los asistentes con IA saben que el sitio y la ficha (con sus
      // reseñas) son el mismo gimnasio.
      sameAs: [...socials.map((s) => s.href), business.googleMaps],
      founder: { "@id": ids.ronald },
      employee: team.map((m) =>
        m.id === "ronald"
          ? { "@id": ids.ronald }
          : {
              "@type": "Person",
              name: m.name,
              jobTitle: m.role,
              description: bilingual((l) => memberIn(l, m.id).bio),
              hasCredential: credentials(m.id),
            }
      ),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: t.seo.catalogo,
        itemListElement: programs.map((p) => ({
          "@type": "Offer",
          price: p.amount,
          priceCurrency: p.currencyCode,
          ...(p.monthly && {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: p.amount,
              priceCurrency: p.currencyCode,
              referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
            },
          }),
          url: abs(`${pages.home}#programas`),
          itemOffered: { "@type": "Service", name: p.title, description: p.desc, provider: { "@id": ids.business } },
        })),
      },
    },
    {
      "@type": "Person",
      "@id": ids.ronald,
      name: ronald.name,
      alternateName: ronald.nickname,
      jobTitle: t.seo.puesto,
      description: bilingual((l) => ronaldIn(l).certifications ?? ronaldIn(l).bio),
      knowsLanguage: "es",
      image: abs(ronald.img.src),
      url: abs(`${pages.home}#zar`),
      nationality: { "@type": "Country", name: "Venezuela" },
      worksFor: { "@id": ids.business },
      // Su Instagram, y X y YouTube, que son de él (@zardelfitness).
      sameAs: [ronald.handleHref, ...socials.filter((s) => s.icon === "x" || s.icon === "yt").map((s) => s.href)].filter(Boolean),
      knowsAbout: t.seo.especialidades,
      hasCredential: credentials("ronald"),
      award: [
        ...press.filter((p) => p.isAward).map((p) => `${p.src}: ${p.title}`),
        `${t.elZar.cifras.chiquinquira} 2014`,
      ],
      subjectOf: press
        .filter((p) => p.href && !p.isAward)
        .map((p) => ({ "@type": "CreativeWork", name: p.title, url: p.href, publisher: { "@type": "Organization", name: p.src } })),
    },
  ];
}

/** La página en sí. CollectionPage para el blog y los podcasts. */
export function webPageLd({ lang, path, name, description, type = "WebPage", about, keywords }: {
  lang: Lang;
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "CollectionPage";
  /** De qué trata: el gimnasio (en el inicio). */
  about?: "business";
  keywords?: string[];
}) {
  return {
    "@type": type,
    "@id": abs(path),
    url: abs(path),
    name,
    description,
    ...(keywords && { keywords: keywords.join(", ") }),
    inLanguage: locales[lang].html,
    isPartOf: { "@id": ids.website },
    ...(about && { about: { "@id": ids.business } }),
  };
}

/** Las migas de pan: Inicio › … › la página. */
export function breadcrumbLd(lang: Lang, items: { name: string; path: string }[]) {
  const { t, pages } = content(lang);
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: t.general.inicio, path: pages.home }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function faqLd(lang: Lang) {
  const { faqs, pages } = content(lang);
  return {
    "@type": "FAQPage",
    "@id": abs(`${pages.home}#preguntas`),
    mainEntity: faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Una nota del blog. */
export function articleLd(post: {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  image: string;
  words: number;
}) {
  const ronald = content(post.lang).team.find((m) => m.id === "ronald")!;
  return {
    "@type": "BlogPosting",
    "@id": abs(`${post.path}#nota`),
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: post.author === ronald.name ? { "@id": ids.ronald } : { "@type": "Person", name: post.author },
    publisher: { "@id": ids.business },
    image: abs(post.image),
    mainEntityOfPage: { "@id": abs(post.path) },
    articleSection: post.category,
    wordCount: post.words,
    inLanguage: locales[post.lang].html,
  };
}

/**
 * El video de la página de un episodio del podcast, para los resultados de video de Google. El idioma es el del
 * video (castellano), también en la página en inglés.
 */
export function videoLd(episode: { path: string; title: string; description: string; image: string; date: string; seconds: number; videoId: string }) {
  const m = Math.floor(episode.seconds / 60);
  return {
    "@type": "VideoObject",
    "@id": abs(`${episode.path}#video`),
    name: episode.title,
    description: episode.description,
    thumbnailUrl: abs(episode.image),
    uploadDate: episode.date,
    duration: `PT${Math.floor(m / 60) ? `${Math.floor(m / 60)}H` : ""}${m % 60}M${episode.seconds % 60}S`,
    embedUrl: `https://www.youtube.com/embed/${episode.videoId}`,
    inLanguage: "es",
    publisher: { "@id": ids.business },
  };
}
