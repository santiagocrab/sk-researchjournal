import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { listMySubmissions } from "@/lib/services/review";
import { AuthorRevisionForm } from "@/components/admin/AuthorRevisionForm";
import { NewArticleButton } from "@/components/admin/NewArticleButton";
import { formatArticleStatus } from "@/lib/lifecycle/article";
import { ArrowUpRight, ClipboardCheck, FileText, SearchCheck } from "lucide-react";

export default async function SubmissionsPage() {
  const user = await requireSession();
  const articles = await listMySubmissions(user.id);
  const journals = await prisma.journal.findMany({
    where: { deletedAt: null, active: true },
    select: { id: true, name: true },
  });
  return (
    <div className="pb-12">
      <div className="flex flex-wrap items-end justify-between gap-6 rounded-2xl bg-forest-900 p-7 text-white md:p-9">
        <div>
          <p className="eyebrow text-[#e1c991]">Author workspace</p>
          <h1 className="mt-3 font-serif text-4xl">My submissions</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
            Start a manuscript, return to a draft, and follow editorial decisions from one place.
          </p>
        </div>
        <NewArticleButton journals={journals} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <FileText size={20} className="text-forest-500" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">{articles.length}</p>
          <p className="text-xs text-ink-500">Total manuscripts</p>
        </div>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <SearchCheck size={20} className="text-forest-500" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {
              articles.filter((article) =>
                ["SUBMITTED", "FOR_REVIEW", "REVISION_REQUIRED", "REVISED"].includes(
                  article.status,
                ),
              ).length
            }
          </p>
          <p className="text-xs text-ink-500">In editorial review</p>
        </div>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <ClipboardCheck size={20} className="text-forest-500" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {articles.filter((article) => article.status === "PUBLISHED").length}
          </p>
          <p className="text-xs text-ink-500">Published</p>
        </div>
      </div>

      <div className="mt-9 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-forest-500">Your research journey</p>
          <h2 className="mt-2 font-serif text-2xl text-forest-900">Manuscripts</h2>
        </div>
        <Link href="/journals/skrjet/for-authors" className="text-link">
          Author guide <ArrowUpRight size={15} />
        </Link>
      </div>
      <ul className="mt-5 grid gap-5 lg:grid-cols-2">
        {articles.map((article) => (
          <li
            key={article.id}
            className="flex flex-col rounded-xl border border-forest-900/10 bg-white p-6 transition hover:border-forest-500/30 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#edf2ee] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-forest-500">
                {formatArticleStatus(article.status)}
              </span>
              <span className="text-xs text-ink-400">{article.journal.abbreviation}</span>
            </div>
            <Link
              className="mt-5 font-serif text-2xl leading-snug text-forest-900 hover:text-forest-500"
              href={`/admin/articles/${article.id}/wizard`}
            >
              {article.title}
            </Link>
            {article.editorialDecisions[0] ? (
              <div className="mt-5 rounded-lg bg-paper p-4 text-sm">
                <p className="font-semibold text-forest-900">
                  Latest decision: {article.editorialDecisions[0].decision.replaceAll("_", " ")}
                </p>
                <div
                  className="mt-2 line-clamp-3 leading-relaxed text-ink-600"
                  dangerouslySetInnerHTML={{
                    __html: article.editorialDecisions[0].letterToAuthors,
                  }}
                />
              </div>
            ) : null}
            {article.status === "REVISION_REQUIRED" ? (
              <AuthorRevisionForm articleId={article.id} />
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-4 border-t border-forest-900/10 pt-5 text-sm">
              <Link className="text-link" href={`/admin/articles/${article.id}/wizard`}>
                Open manuscript <ArrowUpRight size={15} />
              </Link>
              <Link
                className="text-xs text-ink-500 hover:text-forest-500"
                href={`/admin/review/${article.id}`}
              >
                Review history
              </Link>
            </div>
          </li>
        ))}
        {!articles.length ? (
          <li className="col-span-full rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
            <FileText size={30} className="mx-auto text-ink-300" />
            <h3 className="mt-5 font-serif text-2xl text-forest-900">
              Your first manuscript starts here.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
              Prepare the four-file package, then start a private draft. Nothing is sent to editors
              until you choose to submit.
            </p>
            <div className="mt-6 flex justify-center">
              <NewArticleButton journals={journals} />
            </div>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
