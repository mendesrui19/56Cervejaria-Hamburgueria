import { redirect } from "next/navigation";
import FidelizacaoScannerView from "@/views/FidelizacaoScannerView";
import { FEATURE_LOYALTY } from "@/lib/feature-flags";

export default function FidelizacaoScannerPage() {
  if (!FEATURE_LOYALTY) redirect("/sistema");
  return <FidelizacaoScannerView />;
}
