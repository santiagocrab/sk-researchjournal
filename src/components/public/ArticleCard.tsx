import Link from "next/link";
import { ArrowUpRight, LockKeyholeOpen } from "lucide-react";
import { displayName } from "@/lib/authors/name";

type ArticleCardArticle = {
  title: string;
  slug: string;
  firstPage?: string | null;
  lastPage?: string | null;
  doi?: string | null;
  journal: { name: string; websiteSlug: string };
  issue?: { volume: number; issueNumber: number; year: number } | null;
  category?: { name: string } | null;
  authors: Array<{
    author: { firstName: string; middleName?: string | null; lastName: string };
  }>;
};

export function ArticleCard({ article }: { article: ArticleCardArticle }) {
  const href = `/journals/${article.journal.websiteSlug}/articles/${article.slug}`;
  return (
    <li className="group relative p-6 transition-colors hover:bg-[#f8faf6] md:p-7">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px]">
        <span className="rounded bg-forest-500/10 px-2 py-1 font-semibold text-forest-500">
          {article.category?.name ?? "Research article"}
        </span>
        <span className="flex items-center gap-1 text-ink-500">
          <LockKeyholeOpen size={12} /> Open access
        </span>
        {article.issue && <span className="ml-auto text-ink-500">{article.issue.year}</span>}
      </div>
      <Link
        className="flex items-start justify-between gap-5 font-serif text-xl leading-snug tracking-[-0.015em] text-forest-900 transition hover:text-forest-500 md:text-2xl"
        href={href}
      >
        {article.title}
        <ArrowUpRight
          size={21}
          strokeWidth={1.4}
          className="mt-1 shrink-0 text-ink-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest-500"
        />
      </Link>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">
        {article.authors.map((link) => displayName(link.author)).join(", ")}
      </p>
      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        {article.journal.name}
        {article.issue && (
          <>
            {" "}
            · Vol. {article.issue.volume}, No. {article.issue.issueNumber}
            {article.firstPage
              ? ` · pp. ${article.firstPage}${article.lastPage ? `–${article.lastPage}` : ""}`
              : ""}
          </>
        )}
      </p>
    </li>
  );
}
