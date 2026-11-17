import { CancelPage, cancelMetadata } from "@/components/CancelPage";

export const metadata = cancelMetadata("es", "baja");

export default function CancelPlanPage() {
  return <CancelPage lang="es" kind="baja" />;
}
