import { StaffAppChrome } from "@/components/staff/StaffAppChrome";
import { SISTEMA_PWA } from "@/lib/pwa";
import { staffPwaMetadata, staffPwaViewport } from "@/lib/staff-pwa-layout";

export const metadata = staffPwaMetadata({
  ...SISTEMA_PWA,
  title: "Cozinha — Cinquenta & Seis",
  shortName: "Cozinha",
});
export const viewport = staffPwaViewport(SISTEMA_PWA);

export default function CozinhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffAppChrome>{children}</StaffAppChrome>;
}
