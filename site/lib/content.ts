// Contenido del sitio. Lo que puede cambiar (precios, planes, horarios, contacto, preguntas frecuentes y equipo)
// vive en db/, en la raíz del repo, y lo comparte con el asistente telefónico. Acá queda lo propio del sitio:
// links, textos, imágenes y qué planes se muestran.

import equipo from "@db/equipo.json";
import gimnasio from "@db/gimnasio.json";
import horarios from "@db/horarios.json";
import planes from "@db/planes.json";
import preguntas from "@db/preguntas.json";
import textos from "@db/textos.json";
import trayectoria from "@db/trayectoria.json";
import type { IconName } from "@/components/Icon";

const WA_NUMBER = gimnasio.whatsapp.replace(/\D/g, "");

export const wa = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

// 100000 → "100.000"
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// "lunes, miércoles y viernes"
const list = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}` : items[0];

const { calle, barrio, ciudad, codigoPostal } = gimnasio.direccion;
const mapsQuery = encodeURIComponent(`${calle}, ${barrio}, Buenos Aires`);

// "https://zardelfitness.com.ar", de db/gimnasio.json.
export const siteUrl = `https://${gimnasio.sitioWeb}`;

// Las páginas del sitio. Las de los programas y la de Ronald usan las mismas URLs que el sitio anterior,
// para no perder lo que Google ya tenía indexado.
export const pages = {
  online: "/entrenamiento-online/",
  presencial: "/entrenamiento-presencial/",
  general: "/sistema-general-dirigido/",
  ronald: "/sobre-ronald/",
  blog: "/blog/",
};

export const links = {
  retoOnline: wa("Hola! Quiero inscribirme en el Reto de los 25 días online"),
  presencialCheckout: wa("Hola! Quiero inscribirme en el Sistema Premium presencial"),
  generalCheckout: wa("Hola! Quiero inscribirme en el Sistema General Dirigido"),
  hashtag: "https://www.instagram.com/explore/tags/loscuerposdelzar/",
  directions: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
  mapEmbed: `https://www.google.com/maps?q=${mapsQuery}&output=embed`,
  waInfo: wa("Hola! Quiero información sobre los sistemas de entrenamiento del Zar."),
  waPresencial: wa("Hola! Quiero consultar sobre el Entrenamiento Presencial"),
  waInternacional: wa("Hola! Quiero el Reto de los 25 días online internacional"),
  waDudas: wa("Hola! Tengo una duda sobre el reto"),
};

export const contact = {
  phone: gimnasio.whatsapp,
  phoneHref: `https://wa.me/${WA_NUMBER}`,
  street: `${calle}, ${barrio}`,
  address: `${calle}, ${barrio}, ${ciudad}`,
  gym: `${gimnasio.gimnasio} · Exclusive Gym`,
};

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

export const stats = {
  peopleEvaluated: gimnasio.personasEvaluadas,
  peopleEvaluatedText: thousands(gimnasio.personasEvaluadas),
};

// Con "/" adelante para que también funcionen desde las otras páginas.
export const nav = [
  { href: "/#programas", label: "Programas" },
  { href: "/#metodo", label: "Método" },
  { href: "/#resultados", label: "Resultados" },
  { href: "/#zar", label: "El Zar" },
  { href: "/#gym", label: "The VIP" },
  { href: "/#faq", label: "FAQ" },
  { href: pages.blog, label: "Blog" },
];

export const videos = {
  trailer: "QyVRVi3y6IQ",
  historia: "eZF-MLaF45g",
};

export type ProgramArtVariant = "online" | "premium" | "general" | "reto";

export type Program = {
  tag: string;
  title: string;
  currency: string;
  price: string;
  suffix?: string;
  desc: string;
  features: string[];
  art: { variant: ProgramArtVariant; label: string };
  cta: { label: string; href: string };
  /** La página del programa, con todos los detalles. */
  page: string;
  featured?: boolean;
};

// Un plan de db/planes.json.
type Plan = {
  id: string;
  nombre: string;
  nombreCompleto?: string;
  etiqueta: string;
  precios: { monto: number; moneda: string }[];
  periodo: string;
  formasDePago?: string;
  resumen: string;
  descripcion?: string;
  destacados?: string[];
  incluye?: { titulo: string; texto?: string }[];
  detalles?: { titulo: string; puntos: string[] }[];
};

const plans: Plan[] = planes;

function plan(id: string) {
  const found = plans.find((p) => p.id === id);
  if (!found) throw new Error(`No existe el plan "${id}" en db/planes.json`);
  return found;
}

/** El precio principal de un plan, como "$100.000" o "USD 100". */
export function price(id: string) {
  return money(plan(id).precios[0]);
}

// Las tarjetas de "Programas", en orden. Los datos de cada plan están en db/planes.json.
const cards: { id: string; art: Program["art"]; cta: Program["cta"]; page: string; featured?: boolean }[] = [
  {
    id: "reto-online",
    art: { variant: "online", label: "Sistema Online de entrenamiento" },
    cta: { label: "Inscribirme", href: links.retoOnline },
    page: pages.online,
  },
  {
    id: "premium",
    art: { variant: "premium", label: "Sistema Premium de entrenamiento" },
    cta: { label: "Inscribirme", href: links.presencialCheckout },
    page: pages.presencial,
    featured: true,
  },
  {
    id: "general",
    art: { variant: "general", label: "Sistema General Dirigido" },
    cta: { label: "Inscribirme", href: links.generalCheckout },
    page: pages.general,
  },
  {
    id: "reto-internacional",
    art: { variant: "reto", label: "Sello: comienza el reto de los 25 días, internacional" },
    cta: { label: "Quiero empezar", href: links.waInternacional },
    page: `${pages.online}#internacional`,
  },
];

export const programs: Program[] = cards.map(({ id, ...card }) => {
  const p = plan(id);
  const { monto, moneda } = p.precios[0];
  return {
    tag: p.etiqueta,
    title: p.nombre,
    currency: moneda === "ARS" ? "$" : moneda,
    price: thousands(monto),
    suffix: moneda === "ARS" ? "ARS" : undefined,
    desc: p.resumen,
    features: p.destacados ?? [],
    ...card,
  };
});

const money = ({ monto, moneda }: { monto: number; moneda: string }) =>
  `${moneda === "ARS" ? "$" : `${moneda} `}${thousands(monto)}`;

/** Todo lo de un plan de db/planes.json, para su página. */
export function planInfo(id: string) {
  const p = plan(id);
  return {
    name: p.nombre,
    fullName: p.nombreCompleto ?? p.nombre,
    tag: p.etiqueta,
    prices: p.precios.map((pr) => ({ amount: pr.monto, currency: pr.moneda, text: money(pr) })),
    period: p.periodo,
    payment: p.formasDePago,
    summary: p.resumen,
    description: p.descripcion,
    highlights: p.destacados ?? [],
    includes: (p.incluye ?? []).map(({ titulo, texto }) => ({ title: titulo, text: texto })),
    details: (p.detalles ?? []).map(({ titulo, puntos }) => ({ title: titulo, points: puntos })),
  };
}

export const steps = textos.metodo.pasos.map(({ numero, titulo, texto }) => ({ n: numero, title: titulo, text: texto }));

export const benefits = [
  ["Bajar tu % de grasa", "sin sacrificar músculo"],
  ["Bajar talles de pantalón", "o vestido"],
  ["Tonificar y desarrollar", "masa muscular"],
  ["Construir buenos", "hábitos alimenticios"],
  ["Ganar un estilo de vida", "saludable"],
] as const;

export type Shot = { src: string; w: number; h: number; alt: string };
const shot = (n: string, w: number, h: number, alt = "Transformación de un alumno: antes y después"): Shot => ({
  src: `/img/t${n}.webp`, w, h, alt,
});

export const transformations: Shot[][] = [
  [
    shot("03", 900, 860),
    shot("09", 900, 888),
    shot("13", 900, 900),
    shot("04", 1100, 782, "Dos transformaciones de alumnos: antes y después"),
    shot("10", 600, 593, "Transformación de una alumna: antes y después"),
    shot("02", 600, 599),
  ],
  [
    shot("11", 900, 923),
    shot("05", 600, 602, "Transformación de una alumna: antes y después"),
    shot("07", 900, 746),
    shot("12", 600, 603),
    shot("01", 900, 900, "Transformación de una alumna: antes y después"),
    shot("08", 600, 597),
    shot("06", 900, 804),
  ],
];

// La sección The VIP: lo que incluye el Sistema Premium.
const premium = plan("premium");
export const vipNote = premium.descripcion ?? "";
export const perks = (premium.incluye ?? []).map(({ titulo, texto }) => [titulo, texto ?? ""] as const);

// Los días como los cuenta Date.getDay(): 0 es domingo.
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// "14:30" → 14.5
const hours = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
};
// "08:00" → "8:00"
const clock = (time: string) => time.replace(/^0/, "");

// "Lunes a viernes" si los días son seguidos, o "Lunes, miércoles y viernes".
function daysLabel(days: string[]) {
  const n = days.map((d) => WEEKDAYS.indexOf(d));
  const together = days.length > 2 && n.every((d, i) => i === 0 || d === n[i - 1] + 1);
  const text = together ? `${days[0]} a ${days[days.length - 1]}` : list(days);
  return text[0].toUpperCase() + text.slice(1);
}

const partOfDay = (hour: number) => (hour < 12 ? "por la mañana" : hour < 20 ? "por la tarde" : "por la noche");

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

// Horario del gimnasio (hora de Buenos Aires), de db/horarios.json. Horas en decimal: 14.5 = 14:30.
export const schedule = {
  timeZone: horarios.zonaHoraria,
  days: horarios.dias.map((d) => WEEKDAYS.indexOf(d)),
  dayNames: horarios.dias,
  daysLabel: daysLabel(horarios.dias),
  slots,
  // "11:00 por la mañana y 20:00 por la tarde"
  lastEntries: list(slots.map((s) => `${s.lastEntry} ${partOfDay(s.from)}`)),
  classLength: duration(horarios.minutosPorClase),
  // La línea de horarios va de una hora antes de abrir a una después de cerrar.
  range: {
    from: Math.floor(Math.min(...slots.map((s) => s.from))) - 1,
    to: Math.ceil(Math.max(...slots.map((s) => s.to))) + 1,
  },
};

export const press = trayectoria.prensa.map((p) => ({
  src: p.medio,
  title: p.titulo,
  kind: p.tipo,
  href: p.link,
  preview: p.imagen,
}));

// La nota de prensa que se destaca en el inicio (con "destacadoEnInicio" en db/trayectoria.json), si hay.
const featured = trayectoria.prensa.find((p) => p.destacadoEnInicio);
export const featuredPress = featured && {
  label: featured.destacadoEnInicio!,
  title: featured.titulo,
  href: featured.link,
};

export const awards = trayectoria.premios.map(({ fecha, titulo, texto }) => ({ year: fecha, title: titulo, text: texto }));

// La foto de cada persona de db/equipo.json, por su id.
const teamPhotos: Record<string, { src: string; w: number; h: number }> = {
  ronald: { src: "/img/ronald-hero.jpg", w: 1218, h: 1291 },
  edwards: { src: "/img/edwards-chacin.jpg", w: 1320, h: 1447 },
};

export const team = equipo.map((m) => {
  const img = teamPhotos[m.id];
  if (!img) throw new Error(`Falta la foto de ${m.nombre} (db/equipo.json) en site/lib/content.ts`);
  return {
    id: m.id,
    nickname: m.apodo,
    certifications: m.certificaciones,
    role: m.rol,
    name: m.nombre,
    bio: m.bio,
    img,
    handle: m.instagram,
    handleHref: m.instagram && `https://www.instagram.com/${m.instagram.replace(/^@/, "")}/`,
  };
});

export const faqs = preguntas.map(({ pregunta, respuesta }) => [pregunta, respuesta] as const);

// Los párrafos del sitio, de db/textos.json. Pueden tener *cursiva* y **negrita** (ver components/Rich.tsx).
export const texts = {
  motto: textos.lema,
  hero: textos.inicio.descripcion,
  about: textos.elZar.parrafos,
  quote: `“${textos.elZar.cita}”`,
  programs: textos.programas.introduccion,
  team: textos.equipo.introduccion,
  faq: textos.preguntas.introduccion,
};

// Los destacados del inicio ("Online $100.000"): el precio de un plan, o un texto.
export const heroChips = textos.inicio.destacados.map((d) => ({
  label: d.titulo,
  value: d.precioDelPlan ? price(d.precioDelPlan) : (d.texto ?? ""),
}));
