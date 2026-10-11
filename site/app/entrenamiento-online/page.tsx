import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { Cards, Details, Includes, PlanCard, SectionHead, Steps } from "@/components/PlanBlocks";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/JsonLd";
import { links, pages, planInfo } from "@/lib/content";
import { breadcrumbLd, pageMetadata, serviceLd, webPageLd } from "@/lib/seo";

const online = planInfo("reto-online");
const intl = planInfo("reto-internacional");

const path = pages.online;
const title = "Entrenamiento online: Reto de los 25 días";
const description =
  "Entrená online con Ronald Medina: rutina en video para casa o gym, plan de alimentación y suplementación individual, controles y asistencia por WhatsApp.";

export const metadata = pageMetadata({ title, description, path });

export default function OnlinePage() {
  return (
    <PageShell>
      <JsonLd
        data={[
          webPageLd({ path, name: title, description }),
          breadcrumbLd([{ name: "Entrenamiento online", path }]),
          serviceLd({ path, name: online.fullName, description: `${online.description} ${online.summary}`, prices: online.prices, online: true }),
          serviceLd({ path, key: "internacional", name: intl.fullName, description: `${intl.description} ${intl.summary}`, prices: intl.prices, online: true }),
        ]}
      />

      <PageHero
        crumbs={[{ name: "Entrenamiento online", path }]}
        eyebrow="Online · Argentina e internacional"
        lines={["Entrenamiento", "online: reto de"]}
        accent="los 25 días."
        lead={
          <p>
            {online.description} {online.summary}
          </p>
        }
        image={{ src: "/img/ronald-white.webp", w: 749, h: 1024, alt: "Ronald Medina, el Zar del Fitness, con los brazos cruzados" }}
      >
        <a className="btn btn--gold btn--lg" href={links.retoOnline} data-magnetic>
          <span>Empezar el reto</span>
          <span className="btn__price">{online.prices[0].text}</span>
        </a>
        <a className="link-arrow" href="#internacional">
          ¿Vivís fuera de Argentina? <Icon name="arrow" />
        </a>
      </PageHero>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Qué incluye" title="Un plan hecho" accent="sólo para vos." lead="Cada plan es individual y se diseña a partir de tu evaluación." />
          <Includes items={online.highlights.map((h) => ({ title: h }))} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="Paso a paso" title="Del día 1" accent="al día 25." />
          <Steps />
          {online.details.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Details details={online.details} />
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SectionHead eyebrow="Precios" title="Desde Argentina" accent="o desde cualquier país." />
          <Cards>
            <PlanCard plan={online} cta={{ label: "Inscribirme", href: links.retoOnline }} featured />
            <PlanCard plan={intl} id="internacional" cta={{ label: "Quiero empezar", href: links.waInternacional }} />
          </Cards>
        </div>
      </section>

      <Faq />
      <FinalCta />
    </PageShell>
  );
}
