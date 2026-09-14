import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileCheck2,
  FileText,
  FolderUp,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { PublicShell } from "@/components/public/Shell";
import { JournalNav } from "@/components/public/JournalNav";
import {
  AUTHOR_CHECKLIST,
  AUTHOR_DECLARATIONS,
  FILE_NAMING,
  FOUR_FILE_PACKAGE,
  ROLE_GUIDE_META,
} from "@/lib/content/role-guide";

const submissionSteps = [
  {
    icon: UserPlus,
    title: "Create your author account",
    body: "Use an email you check regularly. Your author profile keeps your identity, affiliation, and ORCID iD connected to your submissions.",
  },
  {
    icon: FileText,
    title: "Describe your research",
    body: "Enter the manuscript title, abstract, article type, authors, keywords, and other metadata used by editors and discovery services.",
  },
  {
    icon: FolderUp,
    title: "Upload the submission package",
    body: "Add the cover letter, title page, anonymous manuscript, and any relevant supplementary material as separate files.",
  },
  {
    icon: FileCheck2,
    title: "Review and submit",
    body: "Check your author order, declarations, and files. Submit when every required item is complete, then follow progress from your workspace.",
  },
] as const;

const fileIcons = [FileText, UserPlus, LockKeyhole, FolderUp] as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journal = await prisma.journal.findFirst({
    where: { websiteSlug: slug, deletedAt: null, active: true },
    select: { name: true },
  });
  return { title: journal ? `Guide for authors | ${journal.name}` : "Guide for authors" };
}

export default async function ForAuthorsPage({ params }: { params: Promise<{ slug: string }> }) {
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
          className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 right-28 h-72 w-72 rounded-full border border-white/10"
        />
        <div className="relative max-w-3xl">
          <p className="eyebrow text-[#e1c991]">Guide for authors</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight tracking-tight md:text-6xl">
            Your research deserves
            <br />
            <span className="italic text-[#e1c991]">to be discovered.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Everything you need to prepare a clear, complete, and review-ready submission to{" "}
            {journal.abbreviation}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="inline-flex min-h-12 items-center gap-5 rounded-md bg-[#e1c991] px-6 text-sm font-semibold text-forest-900 transition hover:bg-[#f0deb7]"
            >
              Submit your manuscript <ArrowRight size={17} />
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
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <BookOpenCheck className="text-forest-500" size={22} />
          <p className="mt-4 text-sm font-semibold text-forest-900">Double-blind review</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Identity files stay separate from the anonymous manuscript.
          </p>
        </div>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <CircleDollarSign className="text-forest-500" size={22} />
          <p className="mt-4 text-sm font-semibold text-forest-900">No submission fee</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Submission and publication are free of charge.
          </p>
        </div>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <ShieldCheck className="text-forest-500" size={22} />
          <p className="mt-4 text-sm font-semibold text-forest-900">Ethical publishing</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Originality, disclosure, and author approval are required.
          </p>
        </div>
      </div>

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0">
          <section id="how-to-submit" className="scroll-mt-32">
            <p className="eyebrow text-forest-500">From manuscript to editorial desk</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">How to submit</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600">
              Prepare your files first, then complete these four stages. You can save a draft and
              return before formally submitting it.
            </p>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {submissionSteps.map((step, index) => (
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

          <section id="files" className="mt-16 scroll-mt-32">
            <p className="eyebrow text-forest-500">Prepare before uploading</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Your four-file package</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              Keeping identifying information separate protects the integrity of double-blind
              review.
            </p>
            <div className="mt-7 space-y-4">
              {FOUR_FILE_PACKAGE.map((item, index) => {
                const Icon = fileIcons[index];
                return (
                  <div
                    key={item.file}
                    className="grid gap-5 rounded-xl border border-forest-900/10 bg-white p-6 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-forest-900 text-[#e1c991]">
                      <Icon size={21} strokeWidth={1.4} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-xl text-forest-900">{item.file}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.required ? "bg-[#f4e8ca] text-forest-900" : "bg-ink-50 text-ink-500"}`}
                        >
                          {item.required ? "Required" : "If applicable"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-ink-600">{item.content}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <LockKeyhole size={13} />
                      {item.visibility}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-16 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-forest-900/10 bg-[#edf2ee] p-6">
              <h2 className="font-serif text-2xl text-forest-900">Name files clearly</h2>
              <p className="mt-2 text-sm text-ink-600">
                Replace “Surname” with the corresponding author’s family name.
              </p>
              <ul className="mt-5 space-y-2">
                {FILE_NAMING.map((name) => (
                  <li
                    key={name}
                    className="overflow-x-auto rounded-md border border-forest-900/10 bg-white px-3 py-2 font-mono text-xs text-ink-700"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-forest-900/10 bg-white p-6">
              <h2 className="font-serif text-2xl text-forest-900">Protect anonymous review</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Remove author names, affiliations, acknowledgments, identifying institutional
                references, and revealing file metadata from the anonymous manuscript.
              </p>
              <Link href={`/journals/${slug}/peer-review`} className="text-link mt-5">
                Understand peer review <ArrowRight size={15} />
              </Link>
            </div>
          </section>

          <section id="checklist" className="mt-16 scroll-mt-32">
            <p className="eyebrow text-forest-500">One last check</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">Ready-to-submit checklist</h2>
            <div className="mt-7 grid gap-x-8 gap-y-3 rounded-xl border border-forest-900/10 bg-white p-6 sm:grid-cols-2">
              {AUTHOR_CHECKLIST.map((item) => (
                <p
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-ink-700"
                >
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-forest-500" />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="font-serif text-3xl tracking-tight">Author declarations</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Every submitting author confirms these statements before sending a manuscript to the
              journal.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {AUTHOR_DECLARATIONS.map((item) => (
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
            <p className="eyebrow text-forest-500">Need the editorial process?</p>
            <h2 className="mt-3 font-serif text-3xl text-forest-900">
              Know what happens after submission.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
              See how technical checks, editorial screening, reviewer assignment, decisions,
              revisions, and publication fit together.
            </p>
            <Link
              href={`/journals/${slug}/editorial-workflow`}
              className="mt-6 inline-flex items-center gap-4 rounded-md border border-forest-900/20 px-5 py-3 text-sm font-semibold text-forest-900 transition hover:bg-white/50"
            >
              View the editorial workflow <ArrowRight size={16} />
            </Link>
          </section>
        </article>

        <aside className="lg:sticky lg:top-32">
          <div className="overflow-hidden rounded-xl border border-forest-900/10 bg-white shadow-[0_12px_40px_-28px_rgba(10,42,34,.45)]">
            <div className="bg-forest-900 p-6 text-white">
              <p className="eyebrow text-[#e1c991]">Ready when you are</p>
              <h2 className="mt-3 font-serif text-3xl">Start your submission.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Create a free author account or sign in to continue an existing manuscript.
              </p>
            </div>
            <div className="p-5">
              <Link
                href="/submit"
                className="flex min-h-12 w-full items-center justify-between rounded-md bg-[#e1c991] px-5 text-sm font-semibold text-forest-900 transition hover:bg-[#f0deb7]"
              >
                Submit now <ArrowRight size={17} />
              </Link>
              <Link
                href="/login?intent=submit&next=%2Fadmin%2Fsubmissions"
                className="mt-3 flex min-h-11 w-full items-center justify-center rounded-md border border-forest-900/15 px-4 text-sm font-medium text-forest-900 hover:bg-[#edf2ee]"
              >
                I already have an account
              </Link>
              <div className="mt-5 border-t border-forest-900/10 pt-5 text-xs leading-relaxed text-ink-500">
                <p className="flex gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-forest-500" />
                  Save your work as a draft.
                </p>
                <p className="mt-2 flex gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-forest-500" />
                  Track review and editorial decisions.
                </p>
                <p className="mt-2 flex gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-forest-500" />
                  No submission or publication fees.
                </p>
              </div>
            </div>
          </div>
          <nav
            aria-label="On this page"
            className="mt-5 rounded-xl border border-forest-900/10 bg-white p-5"
          >
            <p className="eyebrow text-ink-500">On this page</p>
            <div className="mt-3 flex flex-col text-sm">
              <a
                href="#how-to-submit"
                className="border-b border-ink-100 py-2.5 text-ink-600 hover:text-forest-500"
              >
                How to submit
              </a>
              <a
                href="#files"
                className="border-b border-ink-100 py-2.5 text-ink-600 hover:text-forest-500"
              >
                Required files
              </a>
              <a href="#checklist" className="py-2.5 text-ink-600 hover:text-forest-500">
                Final checklist
              </a>
            </div>
          </nav>
        </aside>
      </div>
    </PublicShell>
  );
}
