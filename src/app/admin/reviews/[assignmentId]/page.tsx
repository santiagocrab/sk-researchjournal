import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { getReviewPacket } from "@/lib/services/review";
import { ReviewerForm } from "@/components/admin/ReviewerForm";
import { displayName } from "@/lib/services/authors";

const statusLabel: Record<string, string> = {
  INVITED: "Invitation awaiting response",
  ACCEPTED: "Review in progress",
  DECLINED: "Invitation declined",
  COMPLETED: "Review submitted",
  WITHDRAWN: "Assignment withdrawn",
};

function formatDate(value: Date | null) {
  if (!value) return "No deadline set";
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(value);
}

export default async function ReviewerAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const user = await requireSession();
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: { report: true },
  });
  if (!assignment || assignment.reviewerId !== user.id) notFound();
  const packet = await getReviewPacket(assignment.articleId, user);

  return (
    <div>
      <Link
        href="/admin/reviews"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-forest-500"
      >
        <ArrowLeft size={15} /> Back to assignments
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-forest-900 px-6 py-8 text-white md:px-9 md:py-10">
        <div
          aria-hidden
          className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e1c991] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-forest-900">
              {statusLabel[assignment.status]}
            </span>
            <span className="text-xs text-white/55">{packet.journal.abbreviation}</span>
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-3xl leading-tight tracking-tight md:text-5xl">
            {packet.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/70">
            <p className="flex items-center gap-2">
              <CalendarDays size={16} className="text-[#e1c991]" />
              {assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : "No deadline set"}
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#e1c991]" />
              Your identity is protected from the authors
            </p>
          </div>
          <p className="mt-4 flex max-w-3xl items-start gap-2 text-sm leading-relaxed text-white/70">
            <Users size={16} className="mt-0.5 shrink-0 text-[#e1c991]" />
            <span>
              Authors: {packet.authors
                .map((link: { author: { firstName: string; lastName: string } }) =>
                  displayName(link.author),
                )
                .join(", ")}
            </span>
          </p>
        </div>
      </section>

      <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <main className="min-w-0 space-y-7">
          <section className="rounded-xl border border-forest-900/10 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#edf2ee] text-forest-500">
                <BookOpenCheck size={19} />
              </div>
              <div>
                <p className="eyebrow text-ink-400">Manuscript overview</p>
                <h2 className="mt-1 font-serif text-2xl text-forest-900">Abstract</h2>
              </div>
            </div>
            <div
              className="prose-article mt-6 leading-7 text-ink-700"
              dangerouslySetInnerHTML={{ __html: packet.abstract }}
            />
          </section>

          <ReviewerForm
            assignmentId={assignment.id}
            status={assignment.status}
            existing={assignment.report}
          />
        </main>

        <aside className="space-y-5 xl:sticky xl:top-8">
          <div className="rounded-xl border border-forest-900/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <LockKeyhole size={18} className="text-forest-500" />
              <h2 className="font-serif text-xl text-forest-900">Confidentiality</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Keep the manuscript, supplementary files, and editorial correspondence private. Do
              not share or upload them to unauthorized services.
            </p>
          </div>
          <div className="rounded-xl border border-forest-900/10 bg-[#edf2ee] p-5">
            <div className="flex items-center gap-3">
              <ClipboardCheck size={18} className="text-forest-500" />
              <h2 className="font-serif text-xl text-forest-900">Strong reports</h2>
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-ink-600">
              <li>• Start with the most consequential issues.</li>
              <li>• Refer to specific sections or claims.</li>
              <li>• Explain how each concern could be resolved.</li>
              <li>• Keep your recommendation consistent with your comments.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-forest-900/10 bg-white p-5">
            <MessageSquareText size={18} className="text-forest-500" />
            <h2 className="mt-3 font-serif text-xl text-forest-900">Need guidance?</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              Review the journal criteria and ethics guidance before submitting your report.
            </p>
            <Link
              href={`/journals/${packet.journal.websiteSlug}/for-reviewers#criteria`}
              className="mt-4 inline-flex text-xs font-semibold text-forest-500 hover:text-forest-900"
            >
              Open the reviewer guide
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
