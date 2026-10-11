// Contenido del sitio. Todo lo que puede cambiar vive en db/, en la raíz del repo: precios, planes, horarios, contacto,
// preguntas frecuentes y equipo (compartidos con el asistente telefónico), y todos los textos del sitio, en castellano
// y en inglés (db/textos.json). Acá queda lo propio del sitio: links, imágenes y qué planes se muestran.
// content(lang) devuelve todo ya resuelto en un idioma.

import equipo from "@db/equipo.json";
import gimnasio from "@db/gimnasio.json";
import horarios from "@db/horarios.json";
import planes from "@db/planes.json";
import preguntas from "@db/preguntas.json";
import textos from "@db/textos.json";
import trayectoria from "@db/trayectoria.json";
import type { IconName } from "@/components/Icon";
import { checkTranslated, fill, homePath, localePath, localize, locales, text, type Lang } from "./i18n";

const WA_NUMBER = gimnasio.whatsapp.replace(/\D/g, "");

export const wa = (message: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

// 100000 → "100.000" en castellano, "100,000" en inglés
const thousands = (n: number, lang: Lang) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "es" ? "." : ",");

// ["lunes", "miércoles", "viernes"] → "lunes, miércoles y viernes"
const list = (items: string[], and: string) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}` : items[0];

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const { calle, barrio, ciudad, codigoPostal } = gimnasio.direccion;
const mapsQuery = encodeURIComponent(`${calle}, ${barrio}, Buenos Aires`);

// "https://zardelfitness.com.ar", de db/gimnasio.json.
export const siteUrl = `https://${gimnasio.sitioWeb}`;

// Los datos del negocio para Google (datos estructurados), de db/gimnasio.json.
export const business = {
  name: gimnasio.nombre,
  gym: gimnasio.gimnasio,
  phone: `+${WA_NUMBER}`,
  street: calle,
  area: barrio,
  city: ciudad,
  postalCode: codigoPostal,
  lat: gimnasio.coordenadas.latitud,
  lng: gimnasio.coordenadas.longitud,
  maps: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
};

// El ícono de cada red de db/gimnasio.json.
const socialIcons: Record<string, IconName> = {
  Instagram: "ig",
  Facebook: "fb",
  YouTube: "yt",
  TikTok: "tt",
  "X (Twitter)": "x",
};

export const socials = gimnasio.redes.map(({ red, url }) => {
  const icon = socialIcons[red];
  if (!icon) throw new Error(`Falta el ícono de "${red}" (db/gimnasio.json) en site/lib/content.ts`);
  return { label: red, icon, href: url };
});

export const videos = {
  trailer: "QyVRVi3y6IQ",
  historia: "eZF-MLaF45g",
};

// Todos los textos de db/textos.json tienen que estar en los dos idiomas, salvo estos datos.
checkTranslated(textos, "db/textos.json", ["numero", "precioDelPlan"]);

export type ProgramArtVariant = "online" | "premium" | "general" | "reto";

// Un texto de db/: en los dos idiomas, o sólo en castellano si lo usa únicamente el asistente telefónico.
type Txt = string | { es: string; en: string };
type Txts = string[] | { es: string[]; en: string[] };

// Un plan de db/planes.json.
type Plan = {
  id: string;
  nombre: Txt;
  etiqueta: Txt;
  precios: { monto: number; moneda: string }[];
  resumen: Txt;
  descripcion?: Txt;
  destacados?: Txts;
  incluye?: { titulo: Txt; texto?: Txt }[];
};

const plans = planes as Plan[];

function plan(id: string) {
  const found = plans.find((p) => p.id === id);
  if (!found) throw new Error(`No existe el plan "${id}" en db/planes.json`);
  return found;
}

// Las tarjetas de "Programas", en orden: el plan de db/planes.json, su ilustración, su botón y el mensaje de WhatsApp.
const cards: {
  id: string;
  art: ProgramArtVariant;
  cta: "inscribirme" | "quieroEmpezar";
  message: keyof typeof textos.whatsapp;
  featured?: boolean;
}[] = [
  { id: "reto-online", art: "online", cta: "inscribirme", message: "retoOnline" },
  { id: "premium", art: "premium", cta: "inscribirme", message: "premium", featured: true },
  { id: "general", art: "general", cta: "inscribirme", message: "general" },
  { id: "reto-internacional", art: "reto", cta: "quieroEmpezar", message: "internacional" },
];

// Las fotos de "Resultados". `alt` elige el texto de db/textos.json (resultados.fotoAlumno, fotoAlumna o fotoDosAlumnos).
type ShotAlt = "fotoAlumno" | "fotoAlumna" | "fotoDosAlumnos";
const shot = (n: string, w: number, h: number, alt: ShotAlt = "fotoAlumno") => ({ src: `/img/t${n}.webp`, w, h, alt });

const gallery = [
  [
    shot("03", 900, 860),
    shot("09", 900, 888),
    shot("13", 900, 900),
    shot("04", 1100, 782, "fotoDosAlumnos"),
    shot("10", 600, 593, "fotoAlumna"),
    shot("02", 600, 599),
  ],
  [
    shot("11", 900, 923),
    shot("05", 600, 602, "fotoAlumna"),
    shot("07", 900, 746),
    shot("12", 600, 603),
    shot("01", 900, 900, "fotoAlumna"),
    shot("08", 600, 597),
    shot("06", 900, 804),
  ],
];

export type Shot = { src: string; w: number; h: number; alt: string };

// La foto de cada persona de db/equipo.json, por su id.
const teamPhotos: Record<string, { src: string; w: number; h: number }> = {
  ronald: { src: "/img/ronald-hero.jpg", w: 1218, h: 1291 },
  edwards: { src: "/img/edwards-chacin.jpg", w: 1320, h: 1447 },
};

// Los días como los cuenta Date.getDay(): 0 es domingo. En db/horarios.json van en castellano.
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
// En inglés salen de Intl ("Monday"); el 1/1/2023 fue domingo.
const weekdayEn = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const dayName = (n: number, lang: Lang) => (lang === "es" ? WEEKDAYS[n] : weekdayEn.format(new Date(Date.UTC(2023, 0, 1 + n))));

// "14:30" → 14.5
const hours = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
};
// "08:00" → "8:00"
const clock = (time: string) => time.replace(/^0/, "");

// 80 → "1 h 20 min"
const duration = (minutes: number) =>
  [Math.floor(minutes / 60) && `${Math.floor(minutes / 60)} h`, minutes % 60 && `${minutes % 60} min`]
    .filter(Boolean)
    .join(" ");

const slots = horarios.turnos.map((t) => ({
  from: hours(t.abre),
  to: hours(t.cierra),
  opens: clock(t.abre),
  closes: clock(t.cierra),
  lastEntry: clock(t.ultimoIngreso),
  label: `${clock(t.abre)} – ${clock(t.cierra)}`,
  // Como en db/horarios.json ("08:00"), para Google.
  opens24: t.abre,
  closes24: t.cierra,
}));
const openDays = horarios.dias.map((d) => WEEKDAYS.indexOf(d));

export const stats = { peopleEvaluated: gimnasio.personasEvaluadas };

function build(lang: Lang) {
  const t = localize(textos, lang, "db/textos.json");
  const home = homePath(lang);
  const pages = { home, blog: localePath(lang, "/blog/") };

  const links = {
    retoOnline: wa(t.whatsapp.retoOnline),
    hashtag: `https://www.instagram.com/explore/tags/${gimnasio.hashtag.replace(/^#/, "").toLowerCase()}/`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
    mapEmbed: `https://www.google.com/maps?q=${mapsQuery}&output=embed`,
    waInfo: wa(t.whatsapp.informacion),
    waPresencial: wa(t.whatsapp.presencial),
    waDudas: wa(t.whatsapp.dudas),
  };

  const contact = {
    phone: gimnasio.whatsapp,
    phoneHref: `https://wa.me/${WA_NUMBER}`,
    street: `${calle}, ${barrio}`,
    address: `${calle}, ${barrio}, ${ciudad}`,
    gym: `${gimnasio.gimnasio} · ${t.general.gimnasioExclusivo}`,
  };

  // Con el inicio adelante ("/#programas") para que también funcionen desde las otras páginas.
  const nav = [
    { href: `${home}#programas`, label: t.menu.programas },
    { href: `${home}#metodo`, label: t.menu.metodo },
    { href: `${home}#resultados`, label: t.menu.resultados },
    { href: `${home}#zar`, label: t.menu.zar },
    { href: `${home}#gym`, label: t.menu.gym },
    { href: `${home}#faq`, label: t.menu.faq },
    { href: pages.blog, label: t.menu.blog },
  ];

  const where = (p: Plan, field: string) => `db/planes.json (plan "${p.id}", ${field})`;

  /** El precio principal de un plan: "$100.000" (en inglés "ARS 100,000", para que no se confunda con dólares) o "USD 100". */
  const price = (id: string) => {
    const { monto, moneda } = plan(id).precios[0];
    return moneda === "ARS" && lang === "es" ? `$${thousands(monto, lang)}` : `${moneda} ${thousands(monto, lang)}`;
  };

  const programs = cards.map(({ id, art, cta, message, featured }) => {
    const p = plan(id);
    const { monto, moneda } = p.precios[0];
    return {
      id,
      tag: text(p.etiqueta, lang, where(p, "etiqueta")),
      title: text(p.nombre, lang, where(p, "nombre")),
      amount: monto,
      currencyCode: moneda,
      currency: moneda === "ARS" ? "$" : moneda,
      price: thousands(monto, lang),
      suffix: moneda === "ARS" ? "ARS" : undefined,
      desc: text(p.resumen, lang, where(p, "resumen")),
      features: p.destacados ? text(p.destacados, lang, where(p, "destacados")) : [],
      art: { variant: art, label: t.programas.ilustraciones[art] },
      cta: { label: t.programas[cta], href: wa(t.whatsapp[message]) },
      featured,
    };
  });

  // La sección The VIP: lo que incluye el Sistema Premium.
  const premium = plan("premium");
  const vipNote = premium.descripcion ? text(premium.descripcion, lang, where(premium, "descripcion")) : "";
  const perks = (premium.incluye ?? []).map(({ titulo, texto }, i) => ({
    title: text(titulo, lang, where(premium, `incluye[${i}].titulo`)),
    text: texto ? text(texto, lang, where(premium, `incluye[${i}].texto`)) : "",
  }));

  const transformations: Shot[][] = gallery.map((row) => row.map((s) => ({ ...s, alt: t.resultados[s.alt] })));

  // Horario del gimnasio (hora de Buenos Aires), de db/horarios.json. Horas en decimal: 14.5 = 14:30.
  // "lunes a viernes" si los días son seguidos, o "lunes, miércoles y viernes".
  const names = openDays.map((d) => dayName(d, lang));
  const together = openDays.length > 2 && openDays.every((d, i) => i === 0 || d === openDays[i - 1] + 1);
  const daysText = together
    ? fill(t.horario.desdeHasta, { desde: names[0], hasta: names[names.length - 1] })
    : list(names, t.horario.y);
  const partOfDay = (hour: number) => (hour < 12 ? t.horario.manana : hour < 20 ? t.horario.tarde : t.horario.noche);

  const schedule = {
    timeZone: horarios.zonaHoraria,
    days: openDays,
    dayNames: horarios.dias,
    /** "Lunes a viernes" */
    daysLabel: capitalize(daysText),
    /** "lunes a viernes", en medio de una frase */
    daysText,
    slots,
    /** "8:00 a 12:00 y 14:30 a 21:00" */
    slotsText: list(slots.map((s) => fill(t.horario.desdeHasta, { desde: s.opens, hasta: s.closes })), t.horario.y),
    // "11:00 por la mañana y 20:00 por la tarde"
    lastEntries: list(slots.map((s) => `${s.lastEntry} ${partOfDay(s.from)}`), t.horario.y),
    classLength: duration(horarios.minutosPorClase),
    // La línea de horarios va de una hora antes de abrir a una después de cerrar.
    range: {
      from: Math.floor(Math.min(...slots.map((s) => s.from))) - 1,
      to: Math.ceil(Math.max(...slots.map((s) => s.to))) + 1,
    },
  };

  const press = trayectoria.prensa.map((p, i) => ({
    src: p.medio,
    title: text(p.titulo, lang, `db/trayectoria.json prensa[${i}].titulo`),
    kind: text(p.tipo, lang, `db/trayectoria.json prensa[${i}].tipo`),
    isAward: p.tipo.es === "Premio",
    href: p.link,
    preview: p.imagen,
  }));

  // La nota de prensa que se destaca en el inicio (con "destacadoEnInicio" en db/trayectoria.json), si hay.
  const featured = trayectoria.prensa.find((p) => p.destacadoEnInicio);
  const featuredPress = featured && {
    label: text(featured.destacadoEnInicio, lang, "db/trayectoria.json prensa.destacadoEnInicio"),
    title: text(featured.titulo, lang, "db/trayectoria.json prensa.titulo"),
    href: featured.link,
  };

  const awards = trayectoria.premios.map((a, i) => ({
    // La fecha es un año, o un texto en los dos idiomas ("Hoy").
    year: localize(a.fecha, lang, `db/trayectoria.json premios[${i}].fecha`),
    title: text(a.titulo, lang, `db/trayectoria.json premios[${i}].titulo`),
    text: text(a.texto, lang, `db/trayectoria.json premios[${i}].texto`),
  }));

  const team = equipo.map((m) => {
    const img = teamPhotos[m.id];
    if (!img) throw new Error(`Falta la foto de ${m.nombre} (db/equipo.json) en site/lib/content.ts`);
    const field = (f: string) => `db/equipo.json (${m.id}, ${f})`;
    return {
      id: m.id,
      nickname: "apodo" in m ? text(m.apodo, lang, field("apodo")) : undefined,
      certifications: "certificaciones" in m ? text(m.certificaciones, lang, field("certificaciones")) : undefined,
      role: text(m.rol, lang, field("rol")),
      name: m.nombre,
      bio: text(m.bio, lang, field("bio")),
      img,
      handle: m.instagram,
      handleHref: m.instagram && `https://www.instagram.com/${m.instagram.replace(/^@/, "")}/`,
    };
  });

  const faqs = preguntas.map(({ pregunta, respuesta }, i) => ({
    q: text(pregunta, lang, `db/preguntas.json [${i}].pregunta`),
    a: text(respuesta, lang, `db/preguntas.json [${i}].respuesta`),
  }));

  // Los destacados del inicio ("Online $100.000"): el precio de un plan, o un texto.
  const heroChips = t.inicio.destacados.map((d) => ({
    label: d.titulo,
    value: "precioDelPlan" in d && d.precioDelPlan ? price(d.precioDelPlan) : "texto" in d ? (d.texto ?? "") : "",
  }));

  return {
    lang,
    locale: locales[lang],
    t,
    pages,
    links,
    hashtag: { text: gimnasio.hashtag, href: links.hashtag },
    contact,
    nav,
    price,
    programs,
    vipNote,
    perks,
    transformations,
    schedule,
    press,
    featuredPress,
    awards,
    team,
    faqs,
    heroChips,
    peopleEvaluated: thousands(gimnasio.personasEvaluadas, lang),
  };
}

export type Content = ReturnType<typeof build>;

const built = new Map<Lang, Content>();

/** Todo el contenido del sitio en un idioma. Se arma una vez por idioma. */
export function content(lang: Lang): Content {
  if (!built.has(lang)) built.set(lang, build(lang));
  return built.get(lang)!;
}
