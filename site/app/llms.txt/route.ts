import { posts } from "@/lib/blog";
import { content, socials } from "@/lib/content";
import { fill, type Lang } from "@/lib/i18n";
import { abs } from "@/lib/seo";

export const dynamic = "force-static";

// Los planes, en un idioma: "- [Reto de los 25 días](…/#programas): $100.000 ARS. Entrená en casa…".
function programLines(lang: Lang, withTag = false) {
  const { programs, pages } = content(lang);
  return programs.map(
    (p) =>
      `- [${p.title}](${abs(`${pages.home}#programas`)})${withTag ? ` (${p.tag})` : ""}: ${p.currency === "$" ? "$" : `${p.currency} `}${p.price}${p.suffix ? ` ${p.suffix}` : ""}. ${p.desc}`
  );
}

// The VIP: la dirección y el horario, en un idioma.
function gymLines(lang: Lang) {
  const { t, contact, pages, schedule } = content(lang);
  return [
    `- [The VIP](${abs(`${pages.home}#gym`)}): ${contact.address}.`,
    `- ${fill(t.seo.llms.horario, {
      dias: schedule.daysLabel,
      franjas: schedule.slots.map((s) => s.label).join(` ${t.horario.y} `),
      duracion: schedule.classLength,
      ultimoIngreso: schedule.lastEntries,
    })}`,
  ];
}

const plain = (text: string) => text.replace(/\*+([^*]+)\*+/g, "$1");

// Quién es Ronald, sus premios, la prensa y el equipo, en un idioma: es lo que la gente le pregunta a un asistente
// ("¿quién es el Zar del Fitness?", "¿es bueno?"). `h` es el nivel de los títulos ("##" o "###").
function ronaldLines(lang: Lang, h: string) {
  const { t, awards, press, team } = content(lang);
  const pressLine = (p: (typeof press)[number]) => {
    const name = `${p.src}: ${p.title}`;
    return `- ${p.href ? `[${name}](${p.href})` : name} (${p.kind})`;
  };
  return [
    `${h} ${t.seo.llms.ronald}`,
    "",
    t.elZar.parrafos.map(plain).join("\n\n"),
    "",
    `${h}# ${t.seo.llms.premios}`,
    "",
    ...press.filter((p) => p.isAward).map(pressLine),
    ...awards.map((a) => `- ${a.year} · ${a.title}: ${a.text}`),
    "",
    `${h}# ${t.seo.llms.prensa}`,
    "",
    ...press.filter((p) => !p.isAward).map(pressLine),
    "",
    `${h}# ${t.equipo.antetitulo}`,
    "",
    ...team.map((m) => `- ${m.name} (${m.role}): ${m.certifications ?? m.bio}`),
  ];
}

// /llms.txt (llmstxt.org): el sitio resumido en Markdown para ChatGPT, Claude y otros asistentes.
// Sale de db/, como el resto del sitio (los textos en inglés también): no hay que editarlo a mano.
export function GET() {
  const { t, contact, faqs, pages } = content("es");
  const en = content("en");
  const resumen = (lang: Lang) =>
    fill(content(lang).t.seo.llms.resumen, { direccion: contact.address, telefono: contact.phone, link: contact.phoneHref });
  const text = [
    "# Zar del Fitness",
    "",
    `> ${t.inicio.descripcion}`,
    "",
    resumen("es"),
    "",
    `## ${t.seo.llms.programas}`,
    "",
    ...programLines("es"),
    "",
    `## ${t.seo.llms.gimnasio}`,
    "",
    ...gymLines("es"),
    "",
    ...ronaldLines("es", "##"),
    "",
    `## ${t.seo.llms.preguntas}`,
    "",
    ...faqs.map(({ q, a }) => `- ${q} ${a}`),
    "",
    `## ${t.menu.blog}`,
    "",
    `- [${t.menu.blog}](${abs(pages.blog)}): ${t.seo.llms.blog}`,
    ...posts.es.map((p) => `- [${p.title}](${abs(p.path)}): ${p.description}`),
    "",
    // Para los asistentes que buscan en inglés aunque les pregunten en español.
    "## In English",
    "",
    `${plain(en.t.inicio.descripcion)} ${resumen("en")}`,
    "",
    `- [${en.t.seo.llms.otroIdioma}](${abs(en.pages.home)}): ${en.t.seo.inicio.descripcion}`,
    ...programLines("en", true),
    ...gymLines("en"),
    `- [${en.t.menu.blog}](${abs(en.pages.blog)}): ${en.t.seo.llms.blog}`,
    "",
    ...ronaldLines("en", "###"),
    "",
    "## Optional",
    "",
    ...socials.map((s) => `- [${s.label}](${s.href})`),
    "",
  ].join("\n");

  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
