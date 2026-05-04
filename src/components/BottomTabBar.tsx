import { BarChart3, CalendarDays, Home, PencilLine, Settings } from "lucide-react";
import { AppTab } from "../types/sales";
import clsx from "clsx";

interface BottomTabBarProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const tabs: Array<{ id: AppTab; label: string; icon: typeof Home }> = [
  { id: "home", label: "홈", icon: Home },
  { id: "input", label: "입력", icon: PencilLine },
  { id: "closed", label: "휴무", icon: CalendarDays },
  { id: "report", label: "리포트", icon: BarChart3 },
  { id: "settings", label: "설정", icon: Settings },
];

export function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-orange-100 bg-white/90 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onChange(id)}
              className={clsx(
                "flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs font-medium transition",
                activeTab === id
                  ? "bg-brand-500 text-white shadow-soft"
                  : "text-stone-500 hover:bg-orange-50",
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
