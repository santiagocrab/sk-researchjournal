import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/db-safe";
import { SearchBar } from "@/components/public/SearchBar";
import { ResearchExplorer } from "@/components/public/ResearchExplorer";
import { displayName } from "@/lib/authors/name";
import { sanitizePlainText } from "@/lib/sanitize";
import { BRAND_FULL, BRAND_SHORT, BRAND_TAGLINE } from "@/lib/branding";

const homeArticleInclude = {
  metrics: true,
  keywords: true,
  journal: true,
  issue: true,
  category: true,
  authors: { include: { author: true }, orderBy: { authorOrder: "asc" as const } },
} satisfies Prisma.ArticleInclude;

export type HomeJournal = Prisma.JournalGetPayload<object>;
export type HomeArticle = Prisma.ArticleGetPayload<{ include: typeof homeArticleInclude }>;

export async function loadHomeCatalog() {
  return withDatabase(async () => {
    const journals = await prisma.journal.findMany({
      where: { deletedAt: null, active: true },
      orderBy: { name: "asc" },
    });
    // Keep SKRJET first on the public home catalog.
    journals.sort((a, b) => {
      if (a.websiteSlug === "skrjet") return -1;
      if (b.websiteSlug === "skrjet") return 1;
      return a.name.localeCompare(b.name);
    });
    const articles = await prisma.article.findMany({
      where: { deletedAt: null, status: "PUBLISHED", journal: { active: true, deletedAt: null } },
      include: homeArticleInclude,
      orderBy: { publishedAt: "desc" },
      take: 24,
    });
    return { journals, articles };
  });
}

export function HomeHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "max-w-xl" : "max-w-3xl"}>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-500">
        {BRAND_SHORT}
      </p>
      <h1
        className={`mt-2 font-sans font-bold uppercase tracking-wide text-navy-900 ${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"}`}
      >
        {BRAND_FULL}
      </h1>
      <p className={`mt-4 text-ink-700 ${compact ? "text-base" : "text-lg"}`}>{BRAND_TAGLINE}</p>
      <p className={`mt-3 text-ink-600 ${compact ? "text-sm" : "text-base"}`}>
        Peer-reviewed research in education and technology. Published bi-annually by Sultan Kudarat
        State University.
      </p>
      <SearchBar />
      <p className="mt-3 text-sm text-ink-600">
        <Link className="underline" href="/search">
          Search with filters
        </Link>
        {" · "}
        <Link className="underline" href="/journals/skrjet/current">
          Current issue
        </Link>
        {" · "}
        <Link className="underline" href="/journals/skrjet/for-authors">
          Submissions
        </Link>
      </p>
    </div>
  );
}

export function HomeCatalogSections({
  journals,
  articles,
}: {
  journals: HomeJournal[];
  articles: HomeArticle[];
}) {
  return (
    <>
      <section
        aria-label="Find research"
        className="search-panel relative -mt-16 mb-16 rounded-xl border border-forest-900/10 bg-white p-6 shadow-[0_12px_45px_-20px_rgba(10,42,34,0.25)] md:p-8"
      >
        <div className="grid items-center gap-5 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow text-forest-500">Start with a question</p>
            <h2 className="mt-2 font-serif text-2xl tracking-tight">Find your next perspective.</h2>
          </div>
          <div>
            <SearchBar />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
              <span>Explore:</span>
              <Link href="/search?q=education" className="hover:text-forest-500 hover:underline">
                Education
              </Link>
              <Link href="/search?q=technology" className="hover:text-forest-500 hover:underline">
                Technology
              </Link>
              <Link
                href="/search"
                className="ml-auto flex items-center gap-1 font-semibold text-forest-500"
              >
                Advanced search <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <ResearchExplorer
        papers={articles.map((article) => ({
          id: article.id,
          title: article.title,
          href: `/journals/${article.journal.websiteSlug}/articles/${article.slug}`,
          abstract: sanitizePlainText(article.abstract),
          authors: article.authors.map((link) => displayName(link.author)).join(", "),
          category: article.category?.name ?? "Research",
          journal: article.journal.name,
          year: article.issue?.year ?? article.publicationDate?.getFullYear() ?? null,
          views: article.metrics.find((metric) => metric.metricType === "PAGE_VIEW")?.value ?? 0,
          keywords: article.keywords.map((keyword) => keyword.keyword),
        }))}
      />
      <section className="border-t border-forest-900/10 pt-12">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-forest-500">Dedicated to discovery</p>
            <h2 className="mt-2 font-serif text-3xl">Our journals</h2>
          </div>
          <Link href="/journals" className="text-link">
            Explore all <ArrowRight size={16} />
          </Link>
        </div>
        <ul className="grid gap-5 md:grid-cols-2">
          {journals.map((journal, index) => (
            <li key={journal.id}>
              <Link
                href={`/journals/${journal.websiteSlug}`}
                className="group flex h-full gap-5 rounded-xl border border-forest-900/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-forest-500/30 hover:shadow-lg"
              >
                <div className="journal-spine flex w-16 shrink-0 flex-col justify-between rounded-sm bg-forest-900 px-3 py-4 text-[#e1c991]">
                  <BookOpen size={22} strokeWidth={1.2} />
                  <span className="text-[10px] tracking-widest">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="eyebrow text-forest-500">{journal.abbreviation}</p>
                  <h3 className="mt-2 font-serif text-xl leading-snug transition group-hover:text-forest-500">
                    {journal.name}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-500">
                    {journal.description.replace(/<[^>]+>/g, "")}
                  </p>
                  <span className="mt-4 flex items-center gap-2 text-xs font-semibold text-forest-500">
                    Explore journal <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-xl bg-[#eae9df] px-7 py-9 md:flex-row md:items-center md:px-10">
        <div>
          <p className="eyebrow text-forest-500">A shared pursuit of progress</p>
          <h2 className="mt-3 font-serif text-2xl md:text-3xl">
            Good research starts a conversation.
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Meet the people guiding scholarship at SKRJET.
          </p>
        </div>
        <Link
          href="/journals/skrjet/board"
          className="inline-flex shrink-0 items-center gap-5 rounded-md border border-forest-900/20 px-5 py-3 text-sm font-semibold text-forest-900 transition hover:bg-white/50"
        >
          Meet the editorial board <ArrowUpRight size={17} />
        </Link>
      </section>
    </>
  );
}
