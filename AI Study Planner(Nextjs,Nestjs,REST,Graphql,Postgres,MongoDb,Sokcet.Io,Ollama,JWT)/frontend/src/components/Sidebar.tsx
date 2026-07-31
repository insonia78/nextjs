"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  CheckSquare,
  TrendingUp,
  Sparkles,
  Calendar,
  FileText,
  Settings,
  X,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "My Plans", icon: BookOpen },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: BarChart2 },
  { href: "/statistics", label: "Statistics", icon: TrendingUp },
  { href: "/ai", label: "AI Recommendations", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-gray-900/40 transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-gray-100 bg-white px-3 py-6 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="mb-8 flex items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">Study Planner</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${pathname === href ? " active" : ""}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
