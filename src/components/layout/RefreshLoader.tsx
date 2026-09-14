"use client";

import { useEffect } from "react";
import { BookOpen } from "lucide-react";

/** Mounted once in the root layout; client-side navigation never activates it. */
export function RefreshLoader() {
  useEffect(() => {
    const finish = () => document.documentElement.removeAttribute("data-refresh-loading");
    let frame = 0;
    const ready = () => {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(finish);
      });
    };
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready, { once: true });
    window.addEventListener("pageshow", finish);
    const timeout = window.setTimeout(finish, 2200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      window.removeEventListener("load", ready);
      window.removeEventListener("pageshow", finish);
      finish();
    };
  }, []);

  return (
    <div className="refresh-loader" role="status" aria-label="Preparing the journal">
      <div className="refresh-loader-mark">
        <BookOpen size={34} strokeWidth={1.3} />
      </div>
      <span className="mt-6 text-xs font-semibold tracking-[0.35em]">SKRJET</span>
      <p className="mt-3 font-serif text-3xl">Your next discovery awaits.</p>
      <p className="mt-3 text-sm text-ink-500">Preparing your research library</p>
      <div className="refresh-loader-track">
        <span />
      </div>
    </div>
  );
}
