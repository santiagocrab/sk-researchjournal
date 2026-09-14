"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function JournalNav({ slug, name }: { slug: string; name: string }) {
  const pathname = usePathname();
  const links = [
    ["Home", `/journals/${slug}`],
    ["About", `/journals/${slug}/about`],
    ["Current issue", `/journals/${slug}/current`],
    ["Archive", `/journals/${slug}/archive`],
    ["Editorial board", `/journals/${slug}/board`],
    ["For authors", `/journals/${slug}/for-authors`],
    ["For reviewers", `/journals/${slug}/for-reviewers`],
    ["Editorial workflow", `/journals/${slug}/editorial-workflow`],
    ["Peer review", `/journals/${slug}/peer-review`],
    ["Announcements", `/journals/${slug}/announcements`],
    ["Submit now", "/submit"],
  ];
  return (
    <nav
      aria-label={`${name} sections`}
      className="mb-8 flex gap-2 overflow-x-auto rounded-lg border border-forest-900/10 bg-white p-2 text-sm text-ink-700"
    >
      {links.map(([label, href]) => (
        <Link
          key={href}
          aria-current={pathname === href ? "page" : undefined}
          className={`shrink-0 rounded-md px-3 py-2 transition ${
            label === "Submit now"
              ? "ml-auto flex items-center gap-2 bg-[#e1c991] font-semibold text-forest-900 hover:bg-[#f0deb7]"
              : pathname === href
                ? "bg-forest-900 text-white"
                : "hover:bg-forest-500/10 hover:text-forest-500"
          }`}
          href={href}
        >
          {label} {label === "Submit now" ? <ArrowUpRight size={14} /> : null}
        </Link>
      ))}
    </nav>
  );
}
