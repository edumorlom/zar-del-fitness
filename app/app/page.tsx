import { redirect } from "next/navigation";
import { requireViewer } from "~/lib/auth";

// El socio va a su progreso; el coach y el admin, a la lista de socios.
export default async function Home() {
  const viewer = await requireViewer();
  redirect(viewer.role === "user" ? "/mi-progreso" : "/socios");
}
