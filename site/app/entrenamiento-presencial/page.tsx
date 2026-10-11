import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Cards, PlanCard, SectionHead } from "@/components/PlanBlocks";
import { Vip } from "@/components/Vip";
import { Visit } from "@/components/Visit";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/JsonLd";
import { contact, links, pages, planInfo } from "@/lib/content";
import { breadcrumbLd, pageMetadata, serviceLd, webPageLd } from "@/lib/seo";

const premium = planInfo("premium");
const general = planInfo("general");

const path = pages.presencial;
const title = "Entrenamiento personal en Colegiales, CABA";
const description = `Entrená con Ronald Medina en The VIP, un gimnasio exclusivo en ${contact.address}: evaluación, plan personalizado y horarios a tu medida.`;

export const metadata = pageMetadata({ title, description, path });

export default function PresencialPage() {
  return (
    <PageShell>
      <JsonLd
        data={[
          webPageLd({ path, name: title, description, about: "business" }),
          breadcrumbLd([{ name: "Entrenamiento presencial", path }]),
          serviceLd({ path, name: premium.fullName, description: `${premium.summary} ${premium.description ?? ""}`.trim(), prices: premium.prices, online: false }),
          serviceLd({ path, key: "general", name: general.fullName, description: general.summary, prices: general.prices, online: false }),
        ]}
      />

      <PageHero
        crumbs={[{ name: "Entrenamiento presencial", path }]}
        eyebrow={`Presencial · ${contact.street}`}
        lines={["Entrenamiento", "personal en"]}
        accent="Colegiales, CABA."
        lead={
          <>
            <p>{premium.summary}</p>
            <p>
              <strong>{contact.gym}</strong>: {contact.address}.
            </p>
          </>
        }
        image={{ src: "/img/vip-gym.webp", w: 900, h: 840, alt: "Logo de The VIP by Zar del Fitness, Exclusive Gym" }}
      >
        <a className="btn btn--gold btn--lg" href={links.waPresencial} data-magnetic>
          <Icon name="wa" />
          <span>Reservá tu evaluación</span>
        </a>
        <a className="link-arrow" href={links.directions}>
          Cómo llegar <Icon name="arrow-ur" />
        </a>
      </PageHero>

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="Dos sistemas"
            title="Elegí cómo"
            accent="querés entrenar."
            lead="Los dos son en The VIP y con un plan individual. Cambia cuánto te acompañan el Zar y sus asistentes."
          />
          <Cards>
            <PlanCard plan={premium} cta={{ label: "Inscribirme", href: links.presencialCheckout }} more={{ label: "Todo lo que incluye", href: "#gym" }} featured />
            <PlanCard plan={general} cta={{ label: "Inscribirme", href: links.generalCheckout }} more={{ label: "Ver condiciones", href: pages.general }} />
          </Cards>
        </div>
      </section>

      <Vip />
      <Visit />
      <Faq />
      <FinalCta />
    </PageShell>
  );
}
