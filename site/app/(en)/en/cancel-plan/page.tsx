import { CancelPage, cancelMetadata } from "@/components/CancelPage";

export const metadata = cancelMetadata("en", "baja");

export default function CancelPlanPage() {
  return <CancelPage lang="en" kind="baja" />;
}
