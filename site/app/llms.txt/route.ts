import { posts } from "@/lib/blog";
import { contact, faqs, pages, programs, schedule, socials, texts } from "@/lib/content";
import { abs, DAYS } from "@/lib/seo";

export const dynamic = "force-static";

// Cada plan en inglés, por su id en db/planes.json. Los precios sí salen de db/; si cambia un plan, actualizar su texto.
const programsInEnglish: Record<string, string> = {
  "reto-online":
    "Monthly, online, for people in Argentina: train at home or at the gym with videos designed for your plan, at your own pace and on your own schedule.",
  premium:
    "Monthly, in person at The VIP: train directly with Ronald and his two premium assistants in a private gym, with hours that adapt to you.",
  general:
    "Monthly, in person at The VIP: train directly with Ronald and his team of assistants, whenever suits you within the gym's hours.",
  "reto-internacional":
    "Monthly, online, from any country outside Argentina: the same method, with WhatsApp follow-up throughout the challenge.",
};

function inEnglish(p: (typeof programs)[number]) {
  const text = programsInEnglish[p.id];
  if (!text) throw new Error(`Falta el texto en inglés del plan "${p.id}" en site/app/llms.txt/route.ts`);
  return `- [${p.title}](${abs("/#programas")}): ${p.suffix ?? p.currency} ${p.price.replace(/\./g, ",")}. ${text}`;
}

// /llms.txt (llmstxt.org): el sitio resumido en Markdown para ChatGPT, Claude y otros asistentes.
// Sale de db/, como el resto del sitio: no hay que editarlo a mano, salvo los textos en inglés.
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
    // Para los asistentes que buscan en inglés aunque les pregunten en español.
    "## In English",
    "",
    `Personal training with Ronald Medina, *el Zar del Fitness*, a Venezuelan certified personal trainer based in Buenos Aires, Argentina. His method is about losing body fat without losing muscle, with training, nutrition and coaching personalized for each person and results every 25 days. He trains people in person at The VIP, a private gym in Colegiales, Buenos Aires, and online from any country with the Reto de los 25 días (25-day challenge). Sign-up and questions by WhatsApp: ${contact.phone} (${contact.phoneHref}). The website is in Spanish.`,
    "",
    ...programs.map(inEnglish),
    `- [The VIP](${abs("/#gym")}): ${contact.street}, Buenos Aires, Argentina. Open ${schedule.dayNames.map((d) => DAYS[d]).join(", ")}, ${schedule.slots.map((s) => s.label).join(" and ")} (Buenos Aires time). Sessions last about ${schedule.classLength}.`,
    "",
    "## Optional",
    "",
    ...socials.map((s) => `- [${s.label}](${s.href})`),
    "",
  ].join("\n");

  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
