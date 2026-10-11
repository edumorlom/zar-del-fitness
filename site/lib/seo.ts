// SEO: la metadata de cada página y los datos estructurados (JSON-LD) que leen Google y los buscadores con IA.
// Todo sale de lib/content.ts (y por lo tanto de db/): si cambia un precio o un horario, cambia acá también.

import type { Metadata } from "next";
import { awards, business, faqs, press, programs, schedule, siteUrl, socials, team } from "./content";

/** "/blog/" → "https://zardelfitness.com.ar/blog/" */
export const abs = (path: string) => new URL(path, siteUrl).href;

const xHandle = socials.find((s) => s.icon === "x")?.href.split("/").pop();

type PageMeta = {
  title: string;
  description: string;
  /** La URL de la página, p. ej. "/blog/". Es la canónica. */
  path: string;
  /** El título tal cual, sin " | Zar del Fitness" (para el inicio). */
  absoluteTitle?: boolean;
  article?: { publishedTime: string; authors: string[]; section?: string };
};

/** Título, descripción, URL canónica y cómo se ve al compartir. La imagen sale del opengraph-image.tsx de cada página. */
export function pageMetadata({ title, description, path, absoluteTitle, article }: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${business.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: business.name,
      locale: "es_AR",
      ...(article
        ? { type: "article", publishedTime: article.publishedTime, authors: article.authors, section: article.section }
        : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, site: xHandle && `@${xHandle}` },
  };
}

// ---------- JSON-LD ----------

const ids = {
  website: abs("/#sitio"),
  business: abs("/#negocio"),
  ronald: abs("/#ronald"),
};

export const DAYS: Record<string, string> = {
  lunes: "Monday",
  martes: "Tuesday",
  miércoles: "Wednesday",
  jueves: "Thursday",
  viernes: "Friday",
  sábado: "Saturday",
  domingo: "Sunday",
};

const ronald = team.find((m) => m.id === "ronald")!;

// El texto en español y en inglés: ChatGPT y otros buscadores con IA buscan en inglés aunque les pregunten en español.
// El inglés no sale de db/: si cambia el texto en español, actualizarlo a mano.
const bilingual = (es: string, en: string) => [
  { "@value": es, "@language": "es-AR" },
  { "@value": en, "@language": "en" },
];

/** El sitio, el gimnasio y Ronald: van en todas las páginas (app/layout.tsx). */
export function siteGraph() {
  return [
    {
      "@type": "WebSite",
      "@id": ids.website,
      url: abs("/"),
      name: business.name,
      inLanguage: "es-AR",
      publisher: { "@id": ids.business },
    },
    {
      "@type": "ExerciseGym",
      "@id": ids.business,
      name: business.name,
      alternateName: [business.gym, "Reto de los 25 días"],
      description: bilingual(
        "Entrenamiento personal presencial en The VIP (Colegiales, CABA) y online con el Reto de los 25 días, el método de Ronald Medina, el Zar del Fitness.",
        "Personal training in person at The VIP (Colegiales, Buenos Aires, Argentina) and online with the Reto de los 25 días (25-day challenge), the method of Ronald Medina, el Zar del Fitness."
      ),
      knowsLanguage: "es",
      url: abs("/"),
      logo: { "@type": "ImageObject", url: abs("/img/logo.webp"), width: 666, height: 361 },
      image: [abs("/img/ronald-hero.jpg"), abs("/img/ronald-portrait.webp"), abs("/img/ronald-seated.webp")],
      telephone: business.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: `${business.street}, ${business.area}`,
        addressLocality: "Buenos Aires",
        addressRegion: business.city,
        postalCode: business.postalCode,
        addressCountry: "AR",
      },
      geo: { "@type": "GeoCoordinates", latitude: business.lat, longitude: business.lng },
      hasMap: business.maps,
      openingHoursSpecification: schedule.slots.map((s) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: schedule.dayNames.map((d) => DAYS[d]),
        opens: s.opens24,
        closes: s.closes24,
      })),
      priceRange: "$$$",
      currenciesAccepted: "ARS, USD",
      sameAs: socials.map((s) => s.href),
      founder: { "@id": ids.ronald },
      employee: team.map((m) => (m.id === "ronald" ? { "@id": ids.ronald } : { "@type": "Person", name: m.name, jobTitle: m.role })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Programas de entrenamiento",
        itemListElement: programs.map((p) => ({
          "@type": "Offer",
          price: Number(p.price.replace(/\./g, "")),
          priceCurrency: p.suffix ?? p.currency,
          url: abs("/#programas"),
          itemOffered: { "@type": "Service", name: p.title, description: p.desc },
        })),
      },
    },
    {
      "@type": "Person",
      "@id": ids.ronald,
      name: ronald.name,
      alternateName: ronald.nickname,
      jobTitle: "Personal trainer",
      description: bilingual(
        ronald.certifications ?? ronald.bio,
        "Venezuelan personal trainer based in Buenos Aires, Argentina, known as el Zar del Fitness and creator of the Reto de los 25 días (25-day challenge). Certified by IPEF (Instituto Panamericano de Educación Física) in exercise prescription for people with obesity and metabolic diseases, in sports supplementation and in nutrition for muscle gain."
      ),
      knowsLanguage: "es",
      image: abs(ronald.img.src),
      url: abs("/#zar"),
      nationality: { "@type": "Country", name: "Venezuela" },
      worksFor: { "@id": ids.business },
      sameAs: [ronald.handleHref].filter(Boolean),
      knowsAbout: ["Entrenamiento personal", "Pérdida de grasa", "Musculación", "Nutrición deportiva", "Suplementación deportiva"],
      award: [
        ...awards.filter((a) => /^\d{4}$/.test(a.year)).map((a) => `${a.title} (${a.year}): ${a.text}`),
        ...press.filter((p) => p.kind === "Premio").map((p) => `${p.src}: ${p.title}`),
      ],
      subjectOf: press
        .filter((p) => p.href && p.kind !== "Premio")
        .map((p) => ({ "@type": "CreativeWork", name: p.title, url: p.href, publisher: { "@type": "Organization", name: p.src } })),
    },
  ];
}

/** La página en sí. CollectionPage para el blog. */
export function webPageLd({ path, name, description, type = "WebPage", about }: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "CollectionPage";
  /** De qué trata: el gimnasio (en el inicio). */
  about?: "business";
}) {
  return {
    "@type": type,
    "@id": abs(path),
    url: abs(path),
    name,
    description,
    inLanguage: "es-AR",
    isPartOf: { "@id": ids.website },
    ...(about && { about: { "@id": ids.business } }),
  };
}

/** Las migas de pan: Inicio › … › la página. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Inicio", path: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function faqLd() {
  return {
    "@type": "FAQPage",
    "@id": abs("/#preguntas"),
    mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Una nota del blog. */
export function articleLd(post: {
  path: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  image: string;
  words: number;
}) {
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
    inLanguage: "es-AR",
  };
}
