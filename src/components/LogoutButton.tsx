"use client";

import { logoutStaff } from "@/lib/api";
import { exitStaffFullscreen } from "@/lib/staff-fullscreen";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        void exitStaffFullscreen().finally(() => {
          void logoutStaff();
        });
      }}
      className={`rounded-lg border border-brand-line text-brand-muted font-semibold touch-manipulation hover:text-red-600 hover:border-red-200 ${
        compact
          ? "text-[10px] px-2 py-1.5"
          : "text-xs px-3 py-2 min-h-[44px]"
      }`}
    >
      Sair
    </button>
  );
}
