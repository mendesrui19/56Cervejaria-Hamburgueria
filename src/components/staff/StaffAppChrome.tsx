"use client";

import { StaffPwa } from "@/components/pwa/StaffPwa";
import { StaffTabletRuntime } from "@/components/staff/StaffTabletRuntime";
import { SISTEMA_PWA } from "@/lib/pwa";

/** Chrome partilhado: PWA install + runtime tablet Android. */
export function StaffAppChrome({ children }: { children: React.ReactNode }) {
  return (
    <StaffPwa app={SISTEMA_PWA}>
      <StaffTabletRuntime />
      {children}
    </StaffPwa>
  );
}
