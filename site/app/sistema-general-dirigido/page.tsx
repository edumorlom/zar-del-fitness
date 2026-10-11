import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Cards, Details, Includes, PlanCard, SectionHead } from "@/components/PlanBlocks";
import { Visit } from "@/components/Visit";
import { FinalCta } from "@/components/FinalCta";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/JsonLd";
import { contact, links, pages, planInfo } from "@/lib/content";
import { breadcrumbLd, pageMetadata, serviceLd, webPageLd } from "@/lib/seo";

const general = planInfo("general");
const premium = planInfo("premium");

const path = pages.general;
const title = "Sistema General Dirigido: gimnasio en Colegiales";
const description = `Entrenamiento supervisado por el equipo del Zar del Fitness en The VIP (${contact.street}): consulta inicial, plan y controles mensuales.`;

export const metadata = pageMetadata({ title, description, path });

export default function GeneralPage() {
  return (
    <PageShell>
      <JsonLd
        data={[
          webPageLd({ path, name: title, description }),
          breadcrumbLd([
            { name: "Entrenamiento presencial", path: pages.presencial },
            { name: general.name, path },
          ]),
          serviceLd({ path, name: general.fullName, description: general.summary, prices: general.prices, online: false }),
        ]}
      />

      <PageHero
        crumbs={[
          { name: "Entrenamiento presencial", path: pages.presencial },
          { name: general.name, path },
        ]}
        eyebrow={general.tag}
        lines={["Sistema General"]}
        accent="Dirigido."
        lead={<p>{general.summary}</p>}
      >
        <a className="btn btn--gold btn--lg" href={links.generalCheckout} data-magnetic>
          <span>Inscribirme</span>
          <span className="btn__price">{general.prices[0].text}</span>
        </a>
        <a className="link-arrow" href={pages.presencial}>
          Compararlo con el Sistema Premium <Icon name="arrow" />
        </a>
      </PageHero>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Qué incluye" title="Entrenamiento" accent="supervisado." />
          <Includes items={general.includes} />
          {general.details.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Details details={general.details} />
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead
            eyebrow="Precios"
            title="General o"
            accent="Premium."
            lead={premium.description}
          />
          <Cards>
            <PlanCard plan={general} cta={{ label: "Inscribirme", href: links.generalCheckout }} featured />
            <PlanCard plan={premium} cta={{ label: "Inscribirme", href: links.presencialCheckout }} more={{ label: "Ver el Sistema Premium", href: pages.presencial }} />
          </Cards>
        </div>
      </section>

      <Visit />
      <FinalCta />
    </PageShell>
  );
}
