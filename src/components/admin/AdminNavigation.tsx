"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  LayoutDashboard,
  FileText,
  Library,
  Users,
  Settings,
  ClipboardCheck,
  CalendarDays,
  Circle,
} from "lucide-react";

const icons: Record<string, typeof Circle> = {
  Dashboard: LayoutDashboard,
  Articles: FileText,
  "Article records": FileText,
  Journals: Library,
  Users,
  Authors: Users,
  "Peer review": ClipboardCheck,
  "My reviews": ClipboardCheck,
  Issues: CalendarDays,
  "System configuration": Settings,
  "Journal settings": Settings,
};
export function AdminNavigation({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = icons[item.label] ?? Circle;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-forest-900 font-medium text-white" : "text-ink-600 hover:bg-forest-500/10 hover:text-forest-500"}`}
          >
            <Icon size={16} strokeWidth={1.6} />
            {item.label}
            {active && <ArrowUpRight size={14} className="ml-auto text-[#e1c991]" />}
          </Link>
        );
      })}
    </>
  );
}
