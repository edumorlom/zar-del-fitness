import { CancelPage, cancelMetadata } from "@/components/CancelPage";

export const metadata = cancelMetadata("en", "arrepentimiento");

export default function WithdrawalPage() {
  return <CancelPage lang="en" kind="arrepentimiento" />;
}
