import { StaffPwa } from "@/components/pwa/StaffPwa";
import { FIDELIZACAO_PWA } from "@/lib/pwa";
import { staffPwaMetadata, staffPwaViewport } from "@/lib/staff-pwa-layout";

export const metadata = staffPwaMetadata(FIDELIZACAO_PWA);
export const viewport = staffPwaViewport(FIDELIZACAO_PWA);

export default function FidelizacaoClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffPwa app={FIDELIZACAO_PWA}>{children}</StaffPwa>;
}
