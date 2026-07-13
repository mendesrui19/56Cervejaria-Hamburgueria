import { StaffPwa } from "@/components/pwa/StaffPwa";
import { SISTEMA_PWA } from "@/lib/pwa";
import { staffPwaMetadata, staffPwaViewport } from "@/lib/staff-pwa-layout";
import SistemaView from "@/views/SistemaView";

export const metadata = staffPwaMetadata(SISTEMA_PWA);
export const viewport = staffPwaViewport(SISTEMA_PWA);

export default function SistemaPage() {
  return (
    <StaffPwa app={SISTEMA_PWA}>
      <SistemaView />
    </StaffPwa>
  );
}
