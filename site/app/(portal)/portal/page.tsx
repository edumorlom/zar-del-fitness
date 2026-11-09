import { redirect } from "next/navigation";
import { homeOf } from "~/lib/access";
import { requireViewer } from "~/lib/auth";

export default async function Home() {
  redirect(homeOf(await requireViewer()));
}
