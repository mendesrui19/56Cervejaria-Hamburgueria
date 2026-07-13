import { StaffPwa } from "@/components/pwa/StaffPwa";
import { STAFF_PWA_APPS } from "@/lib/pwa";
import { staffPwaMetadata, staffPwaViewport } from "@/lib/staff-pwa-layout";

const app = STAFF_PWA_APPS.caixa;

export const metadata = staffPwaMetadata(app);
export const viewport = staffPwaViewport(app);

export default function CaixaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffPwa app={app}>{children}</StaffPwa>;
}
