"use client";

interface Tab {
  id: string;
  label: string;
  badge?: number;
  disabled?: boolean;
}

interface BottomTabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function BottomTabBar({ tabs, active, onChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-brand-line bg-white/95 backdrop-blur-md safe-bottom xl:hidden">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors touch-manipulation ${
              tab.disabled
                ? "opacity-30 pointer-events-none"
                : active === tab.id
                ? "text-brand-gold"
                : "text-brand-muted"
            }`}
          >
            <span className="text-[11px] font-semibold relative">
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
