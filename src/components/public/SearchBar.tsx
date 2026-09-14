import { Search, ArrowRight } from "lucide-react";

export function SearchBar({
  defaultValue = "",
  compact = false,
  preserved = [],
}: {
  defaultValue?: string;
  compact?: boolean;
  preserved?: [string, string][];
}) {
  return (
    <form
      action="/search"
      role="search"
      className={`flex min-w-0 items-center gap-2 rounded-lg border border-forest-900/15 bg-[#f8f8f3] p-1.5 focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/10 ${compact ? "w-full max-w-lg" : "w-full"}`}
    >
      {preserved.map(([name, value], index) => (
        <input key={`${name}-${index}`} type="hidden" name={name} value={value} />
      ))}
      <Search size={19} className="ml-2 hidden shrink-0 text-ink-400 sm:block" aria-hidden />
      <label className="sr-only" htmlFor={compact ? "nav-article-search" : "article-search"}>
        Search articles, authors, or keywords
      </label>
      <input
        id={compact ? "nav-article-search" : "article-search"}
        name="q"
        defaultValue={defaultValue}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus-visible:outline-none"
        placeholder="Articles, authors, or keywords…"
        type="search"
        autoComplete="off"
      />
      <button
        className="flex min-h-10 shrink-0 items-center gap-3 rounded-md bg-forest-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-forest-500"
        type="submit"
      >
        Search <ArrowRight size={15} className="hidden sm:block" />
      </button>
    </form>
  );
}
