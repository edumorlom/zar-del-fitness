import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Form } from "~/components/Form";
import { Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { payWithMercadoPago } from "~/payment-actions";
import { homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getClient } from "~/lib/data";
import { longDate } from "~/lib/format";
import { getLang } from "~/lib/lang";
import { mpConfigured } from "~/lib/mercadopago";
import { canPayOnline } from "~/lib/payments";
import { settleMercadoPago } from "~/lib/payments-data";
import { pick } from "@/lib/i18n";

export const generateMetadata = async (): Promise<Metadata> => ({ title: pick(await getLang())("Tu pago", "Your payment") });

/**
 * Adonde vuelve el cliente desde Mercado Pago (back_urls), con ?payment_id=…&status=…. El pago se confirma con Mercado
 * Pago acá mismo, sin esperar su aviso: si está aprobado, el pase ya queda extendido (y el aviso, cuando llegue, no lo
 * extiende otra vez). Sin pago (volvió sin pagar: payment_id=null), "no se completó".
 */
export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ payment_id?: string; collection_id?: string }> }) {
  const viewer = await requireViewer();
  if (!viewer.scopes.includes("user")) redirect(homeOf(viewer));
  const sp = await searchParams;
  const id = [sp.payment_id, sp.collection_id].find((v) => v && /^\d{1,20}$/.test(v));
  const settled = id ? await settleMercadoPago(id) : null;
  // Sólo se muestra un pago propio: con el id de otro, como si no hubiera pago.
  const r = settled && "clientId" in settled && settled.clientId !== viewer.id ? null : settled;
  const client = await getClient(viewer.id);
  if (!client) redirect("/portal/ingresar");
  const lang = await getLang();
  const tr = pick(lang);
  // Probar de nuevo, sólo si no pagó: en proceso, en revisión o sin respuesta de Mercado Pago, podría cobrarse dos veces.
  const failed = !r || r.state === "rejected" || r.state === "unknown" || r.state === "reversed";
  const retry = failed && mpConfigured() && canPayOnline(client);

  const view =
    r?.state === "approved"
      ? {
          chip: ["chip chip--gold", tr("Pago aprobado", "Payment approved")],
          title: [tr("Pase", "Pass"), tr("renovado", "renewed")],
          text: r.passAfter
            ? tr(`Tu pase vence el ${longDate(r.passAfter).toLowerCase()}.`, `Your pass now expires on ${longDate(r.passAfter, "en")}.`)
            : tr("Tu pase ya está extendido.", "Your pass has been extended."),
          note: tr("Mercado Pago te manda el comprobante a tu correo.", "Mercado Pago emails you the receipt."),
        }
      : r?.state === "pending" || r?.state === "review"
        ? {
            chip: ["chip chip--due", tr("En proceso", "In process")],
            title: [tr("Tu pago está", "Your payment is"), tr("en proceso", "in process")],
            text:
              r.state === "pending"
                ? tr("Cuando Mercado Pago lo apruebe, tu pase se extiende solo: no hace falta que hagas nada.", "Once Mercado Pago approves it, your pass is extended automatically: you don't need to do anything.")
                : tr("Lo está revisando el equipo: te avisamos apenas esté.", "The team is reviewing it: we'll let you know as soon as it's done."),
            note: null,
          }
        : r?.state === "error"
          ? {
              chip: ["chip chip--due", tr("Confirmando", "Confirming")],
              title: [tr("Estamos confirmando", "We're confirming"), tr("tu pago", "your payment")],
              text: tr(
                "Mercado Pago todavía no nos respondió. Si el pago se aprobó, tu pase se extiende solo en unos minutos.",
                "Mercado Pago hasn't answered yet. If the payment went through, your pass is extended automatically in a few minutes."
              ),
              note: null,
            }
          : {
              chip: ["chip chip--warn", tr("No se completó", "Not completed")],
              title: [tr("El pago no", "The payment wasn't"), tr("se completó", "completed")],
              text: tr("No se te cobró nada. Podés probar de nuevo, con otro medio si querés, o pagar en el gimnasio.", "You weren't charged. You can try again, with another method if you like, or pay at the gym."),
              note: null,
            };

  return (
    <Shell viewer={viewer}>
      <section className="narrow">
        <p className="eyebrow">
          <span className="dot" /> {tr("Tu pase", "Your pass")}
        </p>
        <Title as="h1" plain={view.title[0]} accent={view.title[1]} className="h2" />
        <div className="card turn" data-reveal>
          <span className={view.chip[0]}>{view.chip[1]}</span>
          <p className="fact">{view.text}</p>
          {view.note && <p className="muted">{view.note}</p>}
          {retry && (
            <Form action={payWithMercadoPago} submit={tr("Probar de nuevo", "Try again")} button="btn btn--gold btn--sm" />
          )}
        </div>
        <Link className="back" href="/portal/mi-progreso">
          ← {tr("Mi progreso", "My progress")}
        </Link>
      </section>
    </Shell>
  );
}
