"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { BRAND_LOGO, BRAND_NAME, BRAND_SHORT } from "@/lib/branding";

const links = [
  { label: "Discover", href: "/" },
  { label: "Current issue", href: "/journals/skrjet/current" },
  { label: "Archives", href: "/journals/skrjet/archive" },
  { label: "About the journal", href: "/journals/skrjet/about" },
  { label: "For authors", href: "/journals/skrjet/for-authors" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-forest-900/10 bg-[#fcfcf9]/95 backdrop-blur-xl">
      <div className="hidden border-b border-forest-900/5 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-2 text-[11px] text-ink-500">
          <span>Open scholarship. Shared progress.</span>
          <div className="flex gap-5">
            <Link href="/journals/skrjet/board" className="hover:text-forest-500">
              Editorial board
            </Link>
            <Link href="/journals/skrjet/editorial-workflow" className="hover:text-forest-500">
              Guidelines
            </Link>
            <Link href="/#contact" className="hover:text-forest-500">
              Contact
            </Link>
            <Link href="/login" className="hover:text-forest-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-4 lg:px-8">
        <Link href="/" title={BRAND_NAME} onClick={() => setOpen(false)} className="shrink-0">
          <Image
            src={BRAND_LOGO}
            alt={BRAND_SHORT}
            width={220}
            height={60}
            className="h-10 w-auto md:h-12"
            priority
          />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`header-link text-[13px] font-medium ${pathname === item.href ? "is-active text-forest-500" : "text-ink-600"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Search research"
            className="rounded-full p-2.5 text-forest-900 transition hover:bg-forest-500/10"
          >
            <Search size={19} />
          </Link>
          <Link
            href="/submit"
            className="hidden items-center gap-3 rounded-md bg-forest-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-forest-500 sm:inline-flex"
          >
            Submit paper <ArrowUpRight size={14} />
          </Link>
          <button
            ref={button}
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
            className="rounded-md border border-ink-200 p-2.5 lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="max-h-[75dvh] overflow-y-auto border-t border-ink-100 bg-[#fcfcf9] px-6 pb-6 pt-3 lg:hidden"
        >
          {[
            ...links,
            { label: "Editorial board", href: "/journals/skrjet/board" },
            { label: "Guidelines", href: "/journals/skrjet/editorial-workflow" },
            { label: "Contact", href: "/#contact" },
            { label: "Submit paper", href: "/submit" },
            { label: "Sign in", href: "/login" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className="flex items-center justify-between border-b border-ink-100 py-3 text-sm text-forest-900"
            >
              {item.label}
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
