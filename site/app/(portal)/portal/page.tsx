import { redirect } from "next/navigation";
import { requireViewer } from "~/lib/auth";

// El cliente va a su progreso; el coach y el admin, al dashboard.
export default async function Home() {
  const viewer = await requireViewer();
  redirect(viewer.role === "user" ? "/mi-progreso" : "/dashboard");
}
