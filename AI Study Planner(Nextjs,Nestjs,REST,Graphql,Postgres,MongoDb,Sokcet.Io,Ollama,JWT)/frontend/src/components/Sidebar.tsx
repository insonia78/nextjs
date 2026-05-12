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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col py-6 px-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 mb-8">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-800 text-lg">Study Planner</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link${pathname === href ? " active" : ""}`}
          >
            <Icon size={18} />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
