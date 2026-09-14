import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileSearch,
  LockKeyhole,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { PublicShell } from "@/components/public/Shell";
import { JournalNav } from "@/components/public/JournalNav";
import { REVIEW_CRITERIA, ROLE_GUIDE_META } from "@/lib/content/role-guide";

const reviewJourney = [
  {
    icon: UserCheck,
    title: "Consider the invitation",
    body: "Check that the manuscript is within your expertise and that you can return a careful report by the deadline.",
  },
  {
    icon: Scale,
    title: "Check for conflicts",
    body: "Review the available details and decline if any personal, professional, or financial relationship could affect your judgment.",
  },
  {
    icon: FileSearch,
    title: "Read with purpose",
    body: "Assess the research question, contribution, methods, evidence, interpretation, ethics, and presentation as a connected whole.",
  },
  {
    icon: MessageSquareText,
    title: "Write a useful report",
    body: "Explain major concerns first, point to specific passages, and suggest realistic changes that help the authors improve the work.",
  },
  {
    icon: ClipboardCheck,
    title: "Choose a recommendation",
    body: "Make sure your recommendation follows from the strengths and concerns described in your comments.",
  },
  {
    icon: CheckCircle2,
    title: "Submit with confidence",
    body: "Separate author-facing feedback from confidential editor notes, review the report once more, and submit before the due date.",
  },
] as const;

const reviewerMaterials = [
  "Review-ready manuscript",
  "Relevant supplementary files",
  "Evaluation criteria and review form",
  "Recommendation options",
  "Separate author and editor comment areas",
  "Due date and submission confirmation",
] as const;

const reviewerEthics = [
  "Treat the manuscript and all related files as confidential.",
  "Disclose any conflict of interest before accepting the invitation.",
  "Do not use unpublished findings, data, or ideas for personal advantage.",
  "Keep criticism specific, respectful, and supported by scholarly reasoning.",
  "Never request citations to increase personal or journal citation counts.",
  "Do not upload confidential manuscript content to unauthorized AI tools.",
] as const;

const principleCards = [
  {
    icon: LockKeyhole,
    title: "Confidential",
    body: "Manuscripts, reports, and editorial correspondence stay within the review process.",
  },
  {
    icon: Scale,
    title: "Independent",
    body: "Recommendations rest on the quality and integrity of the research itself.",
  },
  {
    icon: Sparkles,
    title: "Constructive",
    body: "Clear, respectful feedback helps authors and editors make the work stronger.",
  },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journal = await prisma.journal.findFirst({
    where: { websiteSlug: slug, deletedAt: null, active: true },
    select: { name: true },
  });
  return { title: journal ? `Guide for reviewers | ${journal.name}` : "Guide for reviewers" };
}

export default async function ForReviewersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journal = await prisma.journal.findFirst({
    where: { websiteSlug: slug, deletedAt: null, active: true },
  });
  if (!journal) notFound();

  return (
    <PublicShell>
      <JournalNav slug={slug} name={journal.name} />

      <section className="relative overflow-hidden rounded-2xl bg-forest-900 px-6 py-10 text-white md:px-10 md:py-14 lg:px-14">
        <div
          aria-hidden
          className="absolute -right-14 -top-24 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 right-32 h-80 w-80 rounded-full border border-white/10"
        />
        <div className="relative max-w-3xl">
          <p className="eyebrow text-[#e1c991]">Guide for reviewers</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight tracking-tight md:text-6xl">
            A thoughtful review can
            <br />
            <span className="italic text-[#e1c991]">strengthen an entire field.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            A practical guide to evaluating manuscripts for {journal.abbreviation} with rigor,
            fairness, confidentiality, and care.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login?intent=review&next=%2Fadmin%2Freviews"
              className="inline-flex min-h-12 items-center gap-5 rounded-md bg-[#e1c991] px-6 text-sm font-semibold text-forest-900 transition hover:bg-[#f0deb7]"
            >
              Open reviewer workspace <ArrowRight size={17} />
            </Link>
            <a
              href={ROLE_GUIDE_META.pdfHref}
              className="inline-flex min-h-12 items-center gap-3 rounded-md border border-white/25 px-5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Download size={16} /> Download the full guide
            </a>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {principleCards.map((item) => (
          <div key={item.title} className="rounded-xl border border-forest-900/10 bg-white p-5">
            <item.icon className="text-forest-500" size={22} strokeWidth={1.5} />
            <p className="mt-4 text-sm font-semibold text-forest-900">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0">
          <section id="before-accepting" className="scroll-mt-32">
            <p className="eyebrow text-forest-500">Start with the right decision</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">
              Before you accept
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600">
              A prompt acceptance or decline helps the editorial team protect both review quality
              and publication timelines. Accept only when all three statements are true.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                ["01", "The topic fits", "I have enough subject or methodological expertise to assess this work."],
                ["02", "The timing works", "I can read the manuscript carefully and submit by the stated deadline."],
                ["03", "My judgment is independent", "I have no relationship or interest that could compromise a fair review."],
              ].map(([number, title, body]) => (
                <div key={number} className="rounded-xl border border-forest-900/10 bg-white p-5">
                  <span className="font-serif text-2xl italic text-forest-500/35">{number}</span>
                  <h3 className="mt-4 font-serif text-xl text-forest-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="review-process" className="mt-16 scroll-mt-32">
            <p className="eyebrow text-forest-500">Invitation to recommendation</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Your review journey</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {reviewJourney.map((step, index) => (
                <li
                  key={step.title}
                  className="relative overflow-hidden rounded-xl border border-forest-900/10 bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#edf2ee] text-forest-500">
                      <step.icon size={21} strokeWidth={1.5} />
                    </div>
                    <span className="font-serif text-3xl italic text-forest-500/25">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-serif text-xl text-forest-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="materials" className="mt-16 scroll-mt-32">
            <p className="eyebrow text-forest-500">Everything in one place</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Your review materials</h2>
            <div className="mt-7 rounded-xl border border-forest-900/10 bg-[#edf2ee] p-6 md:p-8">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {reviewerMaterials.map((item) => (
                  <p key={item} className="flex items-start gap-3 text-sm text-ink-700">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-forest-500" />
                    {item}
                  </p>
                ))}
              </div>
              <div className="mt-7 flex gap-3 border-t border-forest-900/10 pt-6 text-xs leading-relaxed text-ink-600">
                <ShieldCheck size={18} className="shrink-0 text-forest-500" />
                Access is limited to your assigned manuscript and the files required to complete
                the review. Other reviewer reports and internal editorial discussions remain private.
              </div>
            </div>
          </section>

          <section id="criteria" className="mt-16 scroll-mt-32">
            <p className="eyebrow text-forest-500">A consistent scholarly standard</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">What to evaluate</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600">
              Use these criteria to build an evidence-based assessment. Explain the reasoning behind
              each concern so the editor and authors can act on it.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {REVIEW_CRITERIA.map((row, index) => (
                <div
                  key={row.criterion}
                  className={`rounded-xl border p-5 ${
                    index === REVIEW_CRITERIA.length - 1
                      ? "border-[#d9c18a] bg-[#f4e8ca] sm:col-span-2"
                      : "border-forest-900/10 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-forest-900">{row.criterion}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">{row.scale}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-forest-900/10 bg-white p-6">
              <MessageSquareText size={22} className="text-forest-500" strokeWidth={1.5} />
              <h2 className="mt-5 font-serif text-2xl text-forest-900">Comments to the authors</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                Write a clear summary, identify major and minor points, and explain what evidence or
                revision would resolve each concern. Authors will receive these comments.
              </p>
            </div>
            <div className="rounded-xl border border-forest-900/10 bg-forest-900 p-6 text-white">
              <LockKeyhole size={22} className="text-[#e1c991]" strokeWidth={1.5} />
              <h2 className="mt-5 font-serif text-2xl">Confidential editor notes</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Share sensitive ethical concerns or context needed for the decision. Keep the core
                scholarly reasons for your recommendation in the author-facing report as well.
              </p>
            </div>
          </section>

          <section id="ethics" className="mt-16 scroll-mt-32">
            <p className="eyebrow text-forest-500">Protect the integrity of review</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Reviewer ethics checklist</h2>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {reviewerEthics.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-lg bg-[#edf2ee] p-4 text-sm leading-relaxed text-ink-700"
                >
                  <Check size={16} className="mt-0.5 shrink-0 text-forest-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16 rounded-2xl bg-[#eae9df] p-7 md:p-9">
            <p className="eyebrow text-forest-500">See the full editorial context</p>
            <h2 className="mt-3 font-serif text-3xl text-forest-900">
              Know where your review makes a difference.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
              Learn how reviewer reports inform editorial decisions, revisions, and the final
              publication process.
            </p>
            <Link
              href={`/journals/${slug}/peer-review`}
              className="mt-6 inline-flex items-center gap-4 rounded-md border border-forest-900/20 px-5 py-3 text-sm font-semibold text-forest-900 transition hover:bg-white/50"
            >
              View the peer review process <ArrowRight size={16} />
            </Link>
          </section>
        </article>

        <aside className="lg:sticky lg:top-32">
          <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_12px_40px_-28px_rgba(10,42,34,.45)]">
            <div className="bg-forest-900 p-6 text-white">
              <p className="eyebrow text-[#e1c991]">Invited to review?</p>
              <h2 className="mt-3 font-serif text-3xl">Your assignment is ready.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Sign in to accept or decline, check the deadline, read the manuscript, and submit
                your report.
              </p>
            </div>
            <div className="p-5">
              <Link
                href="/login?intent=review&next=%2Fadmin%2Freviews"
                className="flex min-h-12 w-full items-center justify-between rounded-md bg-[#e1c991] px-5 text-sm font-semibold text-forest-900 transition hover:bg-[#f0deb7]"
              >
                Sign in as reviewer <ArrowRight size={17} />
              </Link>
              <p className="mt-5 flex gap-2 border-t border-forest-900/10 pt-5 text-xs leading-relaxed text-ink-500">
                <BookOpenCheck size={15} className="mt-0.5 shrink-0 text-forest-500" />
                Reviewer access is issued by invitation. Use the account connected to your
                invitation email.
              </p>
              <p className="mt-3 flex gap-2 text-xs leading-relaxed text-ink-500">
                <Clock3 size={15} className="mt-0.5 shrink-0 text-forest-500" />
                Cannot meet the deadline? Decline promptly so another reviewer can be invited.
              </p>
            </div>
          </div>
          <nav
            aria-label="On this page"
            className="mt-5 rounded-xl border border-forest-900/10 bg-white p-5"
          >
            <p className="eyebrow text-ink-500">On this page</p>
            <div className="mt-3 flex flex-col text-sm">
              {[
                ["Before accepting", "#before-accepting"],
                ["Review process", "#review-process"],
                ["Review materials", "#materials"],
                ["Evaluation criteria", "#criteria"],
                ["Reviewer ethics", "#ethics"],
              ].map(([label, href], index, links) => (
                <a
                  key={href}
                  href={href}
                  className={`${index < links.length - 1 ? "border-b border-ink-100" : ""} py-2.5 text-ink-600 hover:text-forest-500`}
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>
        </aside>
      </div>
    </PublicShell>
  );
}
