import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCheckin } from "~/app/actions";
import { Form } from "~/components/Form";
import { MemberForm } from "~/components/MemberForm";
import { Hero, Results, Title } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { canManage } from "~/lib/access";
import { requireViewer } from "~/lib/auth";
import { getCheckins, getCoaches, getMember } from "~/lib/data";
import { todayISO } from "~/lib/format";

export const metadata: Metadata = { title: "Socio" };

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const member = await getMember(id);
  // Un socio que no es suyo es, para el coach, un socio que no existe.
  if (!member || !canManage(viewer, member)) notFound();
  const [checkins, coaches] = await Promise.all([getCheckins(id), viewer.role === "admin" ? getCoaches() : []]);

  return (
    <Shell viewer={viewer}>
      <Link className="back" href="/socios">
        ← Socios
      </Link>
      <Hero member={member} checkins={checkins} you={false} />

      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">01</span> Nueva medición
            </p>
            <Title plain="Cargar" accent="control" />
          </div>
        </div>
        <Form action={addCheckin} submit="Guardar control" reset className="card form" key={checkins.length}>
          <input type="hidden" name="member_id" value={member.id} />
          <div className="fields fields--3">
            <label className="field">
              <span className="field__label">Fecha</span>
              <input name="date" type="date" required defaultValue={todayISO()} max={todayISO()} />
            </label>
            <label className="field">
              <span className="field__label">Peso (kg)</span>
              <input name="weight_kg" required inputMode="decimal" placeholder="80,9" pattern="\d{2,3}([.,]\d)?" />
            </label>
            <label className="field">
              <span className="field__label">% Graso</span>
              <input name="body_fat_pct" required inputMode="decimal" placeholder="14,2" pattern="\d{1,2}([.,]\d)?" />
            </label>
          </div>
          <p className="field__hint">La masa magra y la grasa en kg se calculan solas.</p>
        </Form>
      </section>

      <Results checkins={checkins} you={false} manage number="02" />

      <section>
        <div className="block__head">
          <div>
            <p className="eyebrow">
              <span className="num">{checkins.length ? "04" : "03"}</span> {viewer.role === "admin" ? "Cuenta" : "Plan"}
            </p>
            <Title plain="Datos del" accent="socio" />
          </div>
        </div>
        <MemberForm viewer={viewer} member={member} coaches={coaches} />
      </section>
    </Shell>
  );
}
