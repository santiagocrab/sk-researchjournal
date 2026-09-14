import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { PublicShell } from "@/components/public/Shell";
import { SearchBar } from "@/components/public/SearchBar";
import { FacetFilters } from "@/components/public/FacetFilters";
import { ArticleCard } from "@/components/public/ArticleCard";
import { getSearchFacets, searchArticles } from "@/lib/services/search";
import { searchQuerySchema } from "@/lib/validation/schemas";

export const metadata = { title: "Search articles" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = searchQuerySchema.parse({
    ...raw,
    q: Array.isArray(raw.q) ? raw.q[0] : raw.q,
    year: raw.year,
    journal: raw.journal,
    category: raw.category,
  });
  const filters = {
    q: parsed.q,
    keyword: parsed.keyword,
    author: parsed.author,
    title: parsed.title,
    years: parsed.year,
    journalSlugs: parsed.journal,
    volume: parsed.volume,
    issue: parsed.issue,
    categories: parsed.category,
  };
  const [result, facets] = await Promise.all([
    searchArticles({ ...filters, page: parsed.page }),
    getSearchFacets(filters),
  ]);
  const query = parsed.q.trim();
  const entries: [string, string][] = Object.entries(raw).flatMap(([name, value]) =>
    value === undefined
      ? []
      : (Array.isArray(value) ? value : [value]).map((item) => [name, item] as [string, string]),
  );
  const pageHref = (page: number) => {
    const params = new URLSearchParams(entries);
    params.set("page", String(page));
    return `/search?${params.toString()}`;
  };
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <PublicShell hero={null}>
      <div className="mb-8 rounded-2xl border border-forest-900/10 bg-[#edf2ee] p-6 md:p-10">
        <p className="eyebrow text-forest-500">The research library</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">
          {query ? `Results for “${query}”` : "A question opens a world."}
        </h1>
        <p className="mb-6 mt-3 text-sm text-ink-600">
          Find published work by title, author, keyword, or field of study.
        </p>
        <SearchBar
          defaultValue={query}
          preserved={entries.filter(([name]) => !["q", "page"].includes(name))}
        />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-32">
          <FacetFilters
            query={query}
            years={facets.years}
            categories={facets.categories}
            journals={facets.journals}
            preserved={entries.filter(([name]) =>
              ["keyword", "author", "title", "volume", "issue"].includes(name),
            )}
          />
        </aside>
        <div>
          <p className="text-sm text-ink-600">
            {query || parsed.year.length || parsed.journal.length || parsed.category.length
              ? `${result.total} result${result.total === 1 ? "" : "s"}`
              : `${result.total} published article${result.total === 1 ? "" : "s"}`}
          </p>
          {result.articles.length ? (
            <ul className="mt-4 divide-y divide-forest-900/10 overflow-hidden rounded-xl border border-forest-900/10 bg-white">
              {result.articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-white p-10 text-center">
              <Search className="mx-auto text-ink-400" />
              <h2 className="mt-4 font-serif text-2xl">No papers found here yet.</h2>
              <p className="mt-3 text-sm text-ink-500">
                Try a broader term or clear a filter to explore more research.
              </p>
              <Link href="/search" className="text-link mt-5">
                Browse all papers <ArrowRight size={16} />
              </Link>
            </div>
          )}
          {pageCount > 1 && (
            <nav
              aria-label="Search result pages"
              className="mt-7 flex items-center justify-between gap-4 text-sm"
            >
              {parsed.page > 1 ? (
                <Link href={pageHref(parsed.page - 1)} className="text-link">
                  <ArrowLeft size={16} /> Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-ink-500">
                Page {parsed.page} of {pageCount}
              </span>
              {parsed.page < pageCount ? (
                <Link href={pageHref(parsed.page + 1)} className="text-link">
                  Next <ArrowRight size={16} />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
