import { CancelPage, cancelMetadata } from "@/components/CancelPage";

export const metadata = cancelMetadata("es", "arrepentimiento");

export default function WithdrawalPage() {
  return <CancelPage lang="es" kind="arrepentimiento" />;
}
