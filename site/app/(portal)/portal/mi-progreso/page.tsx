import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hero, Results } from "~/components/Progress";
import { Shell } from "~/components/Shell";
import { requireViewer } from "~/lib/auth";
import { getCheckins, getClient, getOpenAppointment } from "~/lib/data";

export const metadata: Metadata = { title: "Mi progreso" };

export default async function MyProgressPage() {
  const viewer = await requireViewer();
  if (viewer.role !== "user") redirect("/dashboard");
  const [client, checkins, appointment] = await Promise.all([getClient(viewer.id), getCheckins(viewer.id), getOpenAppointment(viewer.id)]);
  if (!client) redirect("/ingresar");
  return (
    <Shell viewer={viewer}>
      <Hero client={client} checkins={checkins} you appointment={appointment} />
      <Results checkins={checkins} you manage={false} />
    </Shell>
  );
}
