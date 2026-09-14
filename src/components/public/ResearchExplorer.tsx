"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Bookmark,
  Check,
  Eye,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

export type DiscoveryPaper = {
  id: string;
  title: string;
  href: string;
  abstract: string;
  authors: string;
  category: string;
  journal: string;
  year: number | null;
  views: number;
  keywords: string[];
};
const STORAGE_KEY = "skrjet-reading-list";

export function ResearchExplorer({ papers }: { papers: DiscoveryPaper[] }) {
  const [topic, setTopic] = useState("All topics");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [limit, setLimit] = useState(6);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(value))
        setSaved(value.filter((id): id is string => typeof id === "string"));
    } catch {
      /* Browsing works when storage is unavailable. */
    }
  }, []);
  const topics = ["All topics", ...new Set(papers.map((paper) => paper.category))];
  const filtered = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const result = papers.filter(
      (paper) =>
        (topic === "All topics" || paper.category === topic) &&
        (!savedOnly || saved.includes(paper.id)) &&
        words.every((word) =>
          `${paper.title} ${paper.authors} ${paper.abstract} ${paper.keywords.join(" ")}`
            .toLowerCase()
            .includes(word),
        ),
    );
    return sort === "popular" ? [...result].sort((a, b) => b.views - a.views) : result;
  }, [papers, topic, query, sort, savedOnly, saved]);
  const mostRead = [...papers]
    .filter((p) => p.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);
  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError("");
    } catch {
      setSaveError("Saved for this visit. Your browser could not store your reading list.");
    }
  }
  function reset() {
    setQuery("");
    setTopic("All topics");
    setSavedOnly(false);
    setLimit(6);
  }
  return (
    <section id="research" className="mb-16 scroll-mt-32">
      {mostRead.length > 0 && (
        <div className="mb-12 overflow-hidden rounded-2xl border border-forest-900/10 bg-[#edf2ee]">
          <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-6">
            <div>
              <p className="eyebrow flex items-center gap-2 text-forest-500">
                <TrendingUp size={14} /> The reader spotlight
              </p>
              <h2 className="mt-2 font-serif text-2xl">Research drawing attention.</h2>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-ink-500">
              Most viewed in this recent collection. Readership reflects interest, not research
              quality.
            </p>
          </div>
          <ol className="grid gap-5 p-6 md:grid-cols-3">
            {mostRead.map((paper, index) => (
              <li key={paper.id}>
                <Link
                  href={paper.href}
                  className="group flex h-full gap-4 rounded-lg border border-forest-900/10 bg-white/75 p-5 transition hover:bg-white"
                >
                  <span className="font-serif text-3xl italic text-forest-500/40">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="eyebrow text-forest-500">{paper.category}</p>
                    <h3 className="mt-2 font-serif text-lg leading-snug group-hover:text-forest-500">
                      {paper.title}
                    </h3>
                    <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
                      <Eye size={13} />
                      {paper.views.toLocaleString()} views
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-forest-500">Follow your curiosity</p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            Your next discovery starts here.
          </h2>
          <p className="mt-3 text-sm text-ink-500">
            Browse up to 24 recent papers. Explore a subject, preview an abstract, or save a read
            for later.
          </p>
        </div>
        <Link href="/search" className="text-link">
          Search the full archive <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="mb-6 rounded-xl border border-forest-900/10 bg-white p-4 md:sticky md:top-[7.25rem] md:z-20 md:p-5 md:shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-ink-200 bg-paper px-3">
            <Search size={18} className="shrink-0 text-ink-400" />
            <span className="sr-only">Filter recent papers</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(6);
              }}
              placeholder="Find a title, author, or idea…"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 text-sm">
            <SlidersHorizontal size={15} />
            <span className="sr-only">Sort papers</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setLimit(6);
              }}
              className="min-h-11 flex-1 bg-transparent pr-3"
            >
              <option value="latest">Latest published</option>
              <option value="popular">Most viewed</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter by topic">
          {topics.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={topic === item}
              onClick={() => {
                setTopic(item);
                setLimit(6);
              }}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${topic === item ? "border-forest-900 bg-forest-900 text-white" : "border-forest-900/10 text-ink-600 hover:border-forest-500"}`}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={savedOnly}
            onClick={() => {
              setSavedOnly(!savedOnly);
              setLimit(6);
            }}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium sm:ml-auto ${savedOnly ? "border-forest-500 bg-[#edf2ee] text-forest-900" : "border-forest-900/10 text-ink-600"}`}
          >
            <Bookmark size={13} />
            Saved ({papers.filter((p) => saved.includes(p.id)).length})
          </button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs text-ink-500">
        <p role="status">
          {filtered.length} {filtered.length === 1 ? "paper" : "papers"}
          {topic !== "All topics" ? ` in ${topic}` : " in this collection"}
        </p>
        <p>
          {savedOnly
            ? "Your reading list is stored on this device."
            : "Read the abstract before opening a paper."}
        </p>
      </div>
      {saveError && (
        <p role="status" className="mb-4 text-sm text-ink-600">
          {saveError}
        </p>
      )}
      <ul className="grid gap-5 md:grid-cols-2">
        {filtered.slice(0, limit).map((paper) => (
          <li
            key={paper.id}
            className="flex flex-col rounded-xl border border-forest-900/10 bg-white p-6 transition hover:border-forest-500/30 hover:shadow-[0_8px_30px_-20px_rgba(10,42,34,.3)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-md bg-[#edf2ee] px-2.5 py-1 text-[11px] font-semibold text-forest-500">
                {paper.category}
              </span>
              <span className="text-xs text-ink-500">{paper.year ?? "Published research"}</span>
            </div>
            <h3 className="font-serif text-2xl leading-snug tracking-tight">
              <Link href={paper.href} className="text-forest-900 hover:text-forest-500">
                {paper.title}
              </Link>
            </h3>
            <p className="mt-3 text-sm text-ink-600">
              {paper.authors || "Author information unavailable"}
            </p>
            <p className="mt-2 text-xs text-ink-500">{paper.journal}</p>
            <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-ink-600">
              {paper.abstract}
            </p>
            <details className="mt-3 text-sm">
              <summary className="w-fit cursor-pointer text-xs font-semibold text-forest-500">
                Read abstract
              </summary>
              <p className="mt-3 rounded-lg bg-paper p-4 leading-relaxed text-ink-600">
                {paper.abstract || "An abstract is not available for this paper."}
              </p>
            </details>
            <div className="mt-5 flex flex-wrap gap-2">
              {paper.keywords.slice(0, 3).map((keyword) => (
                <Link
                  key={keyword}
                  href={`/search?keyword=${encodeURIComponent(keyword)}`}
                  className="rounded-full border border-ink-100 px-2.5 py-1 text-[10px] text-ink-500 hover:border-forest-500"
                >
                  {keyword}
                </Link>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between gap-2 border-t border-forest-900/10 pt-4">
                <Link href={paper.href} className="text-link">
                  Read paper <ArrowUpRight size={15} />
                </Link>
                <button
                  type="button"
                  aria-label={`${saved.includes(paper.id) ? "Unsave" : "Save"} ${paper.title}`}
                  aria-pressed={saved.includes(paper.id)}
                  onClick={() => toggleSave(paper.id)}
                  className="flex min-h-10 items-center gap-2 rounded-md px-3 text-xs text-forest-500 hover:bg-[#edf2ee]"
                >
                  {saved.includes(paper.id) ? <Check size={15} /> : <Bookmark size={15} />}
                  {saved.includes(paper.id) ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!filtered.length && (
        <div className="rounded-xl border border-dashed border-ink-200 p-12 text-center">
          <Search size={26} className="mx-auto text-ink-400" />
          <h3 className="mt-4 font-serif text-2xl">
            {savedOnly ? "Your reading list starts with a paper." : "Let’s try another direction."}
          </h3>
          <p className="mt-3 text-sm text-ink-500">
            {savedOnly
              ? "Save papers using the bookmark button to find them here."
              : "Try fewer words, choose another topic, or search the full archive."}
          </p>
          <button
            onClick={reset}
            className="mt-5 rounded-md bg-forest-900 px-5 py-3 text-sm text-white"
          >
            Browse all recent papers
          </button>
        </div>
      )}
      <div className="mt-8 flex flex-col items-center gap-4">
        {limit < filtered.length && (
          <button
            onClick={() => setLimit(limit + 6)}
            className="flex items-center gap-4 rounded-lg border border-forest-900/20 bg-white px-7 py-3 text-sm font-semibold text-forest-900 hover:bg-[#edf2ee]"
          >
            Show more papers <ArrowDown size={16} />
          </button>
        )}
        <p className="text-xs text-ink-500">
          Showing {Math.min(limit, filtered.length)} of {filtered.length} papers ·{" "}
          <Link href="/search" className="underline underline-offset-4">
            Explore the full archive
          </Link>
        </p>
      </div>
    </section>
  );
}
