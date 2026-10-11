import { posts } from "@/lib/blog";
import { contact, faqs, pages, programs, schedule, socials, texts } from "@/lib/content";
import { abs } from "@/lib/seo";

export const dynamic = "force-static";

// /llms.txt (llmstxt.org): el sitio resumido en Markdown para ChatGPT, Claude y otros asistentes.
// Sale de db/, como el resto del sitio: no hay que editarlo a mano.
export function GET() {
  const text = [
    "# Zar del Fitness",
    "",
    `> ${texts.hero}`,
    "",
    `Entrenamiento personal con Ronald Medina en The VIP (${contact.address}) y el Reto de los 25 días online, desde cualquier país. Las inscripciones y consultas son por WhatsApp: ${contact.phone} (${contact.phoneHref}).`,
    "",
    "## Programas",
    "",
    ...programs.map(
      (p) => `- [${p.title}](${abs("/#programas")}): ${p.currency === "$" ? "$" : `${p.currency} `}${p.price}${p.suffix ? ` ${p.suffix}` : ""}. ${p.desc}`
    ),
    "",
    "## El gimnasio",
    "",
    `- [The VIP](${abs("/#gym")}): ${contact.address}.`,
    `- Horario: ${schedule.daysLabel}, ${schedule.slots.map((s) => s.label).join(" y ")} (hora de Buenos Aires). Clases de ~${schedule.classLength}; último ingreso ${schedule.lastEntries}.`,
    "",
    "## Preguntas frecuentes",
    "",
    ...faqs.map(([q, a]) => `- ${q} ${a}`),
    "",
    "## Blog",
    "",
    `- [Blog](${abs(pages.blog)}): notas sobre entrenamiento, alimentación y salud.`,
    ...posts.map((p) => `- [${p.title}](${abs(p.path)}): ${p.description}`),
    "",
    "## Optional",
    "",
    ...socials.map((s) => `- [${s.label}](${s.href})`),
    "",
  ].join("\n");

  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
