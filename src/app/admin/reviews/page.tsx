import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { listMyReviewAssignments } from "@/lib/services/review";

const statusLabel: Record<string, string> = {
  INVITED: "Response needed",
  ACCEPTED: "Review in progress",
  DECLINED: "Declined",
  COMPLETED: "Submitted",
  WITHDRAWN: "Withdrawn",
};

const statusClass: Record<string, string> = {
  INVITED: "bg-[#f4e8ca] text-[#66531f]",
  ACCEPTED: "bg-[#dcebe4] text-forest-900",
  DECLINED: "bg-ink-100 text-ink-500",
  COMPLETED: "bg-forest-900 text-white",
  WITHDRAWN: "bg-ink-100 text-ink-500",
};

function formatDate(value: Date | null) {
  if (!value) return "No date set";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(value);
}

function deadlineLabel(value: Date | null, status: string) {
  if (!value) return "No deadline set";
  if (status === "COMPLETED") return `Submitted by ${formatDate(value)}`;
  const today = new Date();
  const due = new Date(value);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due ${formatDate(value)}`;
}

export default async function MyReviewsPage() {
  const user = await requireSession();
  if (
    user.role !== Role.REVIEWER &&
    user.role !== Role.SUPER_ADMIN &&
    user.role !== Role.EDITOR_IN_CHIEF
  ) {
    redirect("/admin");
  }

  const assignments = await listMyReviewAssignments(user.id);
  const active = assignments.filter((item) => item.status === "INVITED" || item.status === "ACCEPTED");
  const completed = assignments.filter((item) => item.status === "COMPLETED");
  const dueSoon = active.filter((item) => {
    if (!item.dueDate) return false;
    const days = (item.dueDate.getTime() - Date.now()) / 86_400_000;
    return days <= 7;
  });

  return (
    <div>
      <section className="relative overflow-hidden rounded-2xl bg-forest-900 px-6 py-9 text-white md:px-9 md:py-11">
        <div
          aria-hidden
          className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10"
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-[#e1c991]">Reviewer workspace</p>
            <h1 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">
              Your review assignments
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
              Respond to invitations, keep an eye on deadlines, and submit clear, constructive
              reports from one focused workspace.
            </p>
          </div>
          <Link
            href="/journals/skrjet/for-reviewers"
            className="inline-flex min-h-11 w-fit items-center gap-3 rounded-md border border-white/20 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Open reviewer guide <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section aria-label="Assignment summary" className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-600">Active</p>
            <ClipboardCheck size={19} className="text-forest-500" />
          </div>
          <p className="mt-4 font-serif text-4xl text-forest-900">{active.length}</p>
          <p className="mt-1 text-xs text-ink-500">Waiting for a response or report</p>
        </div>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-600">Due soon</p>
            <Clock3 size={19} className="text-forest-500" />
          </div>
          <p className="mt-4 font-serif text-4xl text-forest-900">{dueSoon.length}</p>
          <p className="mt-1 text-xs text-ink-500">Due within seven days or overdue</p>
        </div>
        <div className="rounded-xl border border-forest-900/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-600">Completed</p>
            <CheckCircle2 size={19} className="text-forest-500" />
          </div>
          <p className="mt-4 font-serif text-4xl text-forest-900">{completed.length}</p>
          <p className="mt-1 text-xs text-ink-500">Reports successfully submitted</p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-forest-500">Your review queue</p>
            <h2 className="mt-2 font-serif text-3xl text-forest-900">Assignments</h2>
          </div>
          {assignments.length ? (
            <p className="text-sm text-ink-500">
              {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {assignments.length ? (
          <div className="mt-6 space-y-4">
            {assignments.map((assignment) => {
              const deadline = deadlineLabel(assignment.dueDate, assignment.status);
              const urgent =
                assignment.dueDate &&
                assignment.status !== "COMPLETED" &&
                assignment.status !== "DECLINED" &&
                assignment.status !== "WITHDRAWN" &&
                assignment.dueDate.getTime() < Date.now() + 7 * 86_400_000;
              return (
                <article
                  key={assignment.id}
                  className="group overflow-hidden rounded-xl border border-forest-900/10 bg-white transition hover:border-forest-500/30 hover:shadow-[0_16px_45px_-35px_rgba(10,42,34,.5)]"
                >
                  <div className="grid md:grid-cols-[minmax(0,1fr)_13rem]">
                    <div className="p-6 md:p-7">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusClass[assignment.status]}`}
                        >
                          {statusLabel[assignment.status]}
                        </span>
                        <span className="text-xs text-ink-400">
                          {assignment.article.journal.abbreviation}
                        </span>
                      </div>
                      <h3 className="mt-4 max-w-3xl font-serif text-2xl leading-snug text-forest-900">
                        {assignment.article.title}
                      </h3>
                      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-500">
                        <p className="flex items-center gap-2">
                          <Clock3 size={14} className={urgent ? "text-crimson-700" : "text-forest-500"} />
                          <span className={urgent ? "font-semibold text-crimson-700" : ""}>{deadline}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-forest-500" />
                          Your reviewer identity is protected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center border-t border-forest-900/10 bg-[#f8faf7] p-6 md:border-l md:border-t-0">
                      <Link
                        href={`/admin/reviews/${assignment.id}`}
                        className="flex min-h-11 w-full items-center justify-between rounded-md bg-forest-900 px-4 text-sm font-semibold text-white transition group-hover:bg-forest-500"
                      >
                        {assignment.status === "INVITED"
                          ? "Respond now"
                          : assignment.status === "ACCEPTED"
                            ? "Continue review"
                            : assignment.status === "COMPLETED"
                              ? "View submission"
                              : "View assignment"}
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 grid min-h-80 place-items-center rounded-2xl border border-dashed border-forest-900/20 bg-white px-6 py-12 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#edf2ee] text-forest-500">
                <FileSearch size={25} strokeWidth={1.4} />
              </div>
              <h3 className="mt-5 font-serif text-2xl text-forest-900">Your queue is clear</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                New invitations will appear here when an editor assigns a manuscript to you. We
                will also send a notice to your registered email address.
              </p>
              <Link
                href="/journals/skrjet/for-reviewers"
                className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-forest-500 hover:text-forest-900"
              >
                Read the reviewer guide <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </section>

      <aside className="mt-10 flex flex-col gap-5 rounded-xl border border-forest-900/10 bg-[#edf2ee] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <BookOpenCheck size={22} className="mt-0.5 shrink-0 text-forest-500" />
          <div>
            <p className="font-serif text-xl text-forest-900">A good review is specific and actionable.</p>
            <p className="mt-1 text-sm text-ink-500">
              Lead with major points, cite the relevant section, and explain what would resolve the concern.
            </p>
          </div>
        </div>
        <Link
          href="/journals/skrjet/for-reviewers#criteria"
          className="shrink-0 text-sm font-semibold text-forest-500 hover:text-forest-900"
        >
          View criteria
        </Link>
      </aside>
    </div>
  );
}
