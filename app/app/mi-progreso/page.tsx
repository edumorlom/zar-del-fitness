import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hero, Results } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { requireViewer } from "~/lib/auth";
import { getCheckins, getMember } from "~/lib/data";

export const metadata: Metadata = { title: "Mi progreso" };

export default async function MyProgressPage() {
  const viewer = await requireViewer();
  if (viewer.role !== "user") redirect("/socios");
  const [member, checkins] = await Promise.all([getMember(viewer.id), getCheckins(viewer.id)]);
  if (!member) redirect("/ingresar");
  return (
    <Shell viewer={viewer}>
      <Hero member={member} checkins={checkins} you />
      <Results checkins={checkins} you manage={false} />
    </Shell>
  );
}
