"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Scale,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/client/api";

const fieldClass =
  "mt-2 w-full rounded-lg border border-forest-900/15 bg-[#fafbf8] px-3.5 py-3 text-sm leading-relaxed text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/10";

const assessmentFields = [
  {
    name: "originality",
    label: "Originality",
    help: "Is the question, approach, evidence, or interpretation meaningfully new?",
  },
  {
    name: "significance",
    label: "Significance",
    help: "Why do the findings matter to the field, practice, policy, or future research?",
  },
  {
    name: "methodology",
    label: "Methodological rigor",
    help: "Are the design, sampling, instruments, analysis, and limitations appropriate?",
  },
  {
    name: "clarity",
    label: "Clarity and presentation",
    help: "Is the argument coherent, well organized, readable, and supported by the results?",
  },
] as const;

export function ReviewerForm({
  assignmentId,
  status,
  existing,
}: {
  assignmentId: string;
  status: string;
  existing: {
    recommendation: string;
    commentsToAuthor: string;
    submittedAt?: Date | string;
  } | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"accept" | "decline" | "submit" | null>(
    null,
  );
  const [readyToAccept, setReadyToAccept] = useState(false);

  async function invite(accept: boolean) {
    setError(null);
    setPendingAction(accept ? "accept" : "decline");
    try {
      await fetch("/api/auth/csrf");
      await api(`/api/reviews/${assignmentId}`, {
        method: "POST",
        body: JSON.stringify({ invitation: true, accept }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update invitation");
    } finally {
      setPendingAction(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPendingAction("submit");
    try {
      await fetch("/api/auth/csrf");
      await api(`/api/reviews/${assignmentId}`, {
        method: "POST",
        body: JSON.stringify({
          recommendation: form.get("recommendation"),
          originality: form.get("originality"),
          significance: form.get("significance"),
          methodology: form.get("methodology"),
          clarity: form.get("clarity"),
          commentsToAuthor: form.get("commentsToAuthor"),
          commentsToEditor: form.get("commentsToEditor"),
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setPendingAction(null);
    }
  }

  if (existing) {
    return (
      <section className="overflow-hidden rounded-xl border border-forest-900/10 bg-white">
        <div className="bg-forest-900 px-6 py-7 text-white md:px-8">
          <CheckCircle2 size={27} className="text-[#e1c991]" />
          <p className="eyebrow mt-5 text-[#e1c991]">Report received</p>
          <h2 className="mt-2 font-serif text-3xl">Thank you for completing this review.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
            Your report is now available to the editorial team. Your reviewer identity and
            confidential editor comments remain protected from the authors.
          </p>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-[14rem_minmax(0,1fr)] md:p-8">
          <div className="rounded-lg bg-[#edf2ee] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Recommendation
            </p>
            <p className="mt-2 font-serif text-xl capitalize text-forest-900">
              {existing.recommendation.replaceAll("_", " ").toLowerCase()}
            </p>
          </div>
          <div className="rounded-lg border border-forest-900/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Comments shared with authors
            </p>
            <div
              className="mt-2 text-sm leading-relaxed text-ink-600"
              dangerouslySetInnerHTML={{ __html: existing.commentsToAuthor }}
            />
          </div>
        </div>
      </section>
    );
  }

  if (status === "DECLINED") {
    return (
      <section className="flex gap-4 rounded-xl border border-ink-200 bg-white p-6 md:p-8">
        <XCircle size={24} className="shrink-0 text-ink-400" />
        <div>
          <h2 className="font-serif text-2xl text-forest-900">Invitation declined</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Your response has been recorded. The editorial team can now invite another reviewer.
          </p>
        </div>
      </section>
    );
  }

  if (status === "WITHDRAWN") {
    return (
      <section className="flex gap-4 rounded-xl border border-ink-200 bg-white p-6 md:p-8">
        <AlertCircle size={24} className="shrink-0 text-ink-400" />
        <div>
          <h2 className="font-serif text-2xl text-forest-900">Assignment withdrawn</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            The editorial team has closed this assignment. No further action is required.
          </p>
        </div>
      </section>
    );
  }

  if (status === "INVITED") {
    return (
      <section className="overflow-hidden rounded-xl border border-forest-900/10 bg-white">
        <div className="border-b border-forest-900/10 bg-[#edf2ee] px-6 py-7 md:px-8">
          <p className="eyebrow text-forest-500">Invitation decision</p>
          <h2 className="mt-3 font-serif text-3xl text-forest-900">Can you review this manuscript?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
            Check subject fit, your availability, and any competing interests before responding.
            The evaluation form will open after you accept.
          </p>
        </div>
        <div className="p-6 md:p-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "The topic fits my expertise",
              "I can meet the deadline",
              "My judgment will be independent",
            ].map((item) => (
              <p
                key={item}
                className="flex items-start gap-3 rounded-lg border border-forest-900/10 p-4 text-xs leading-relaxed text-ink-600"
              >
                <Check size={15} className="mt-0.5 shrink-0 text-forest-500" />
                {item}
              </p>
            ))}
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg bg-[#fafbf8] p-4 text-sm leading-relaxed text-ink-700">
            <input
              type="checkbox"
              checked={readyToAccept}
              onChange={(event) => setReadyToAccept(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a5c4a]"
            />
            <span>
              I have reviewed the manuscript details, deadline, and potential conflicts of
              interest, and I can provide an impartial review.
            </span>
          </label>
          <FormError error={error} />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={!readyToAccept || pendingAction !== null}
              onClick={() => invite(true)}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-forest-900 px-5 text-sm font-semibold text-white transition hover:bg-forest-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "accept" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              Accept and open review
            </button>
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => invite(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-forest-900/15 px-5 text-sm font-medium text-ink-600 transition hover:bg-ink-50 disabled:opacity-50"
            >
              {pendingAction === "decline" ? (
                <LoaderCircle size={16} className="mr-2 animate-spin" />
              ) : null}
              Decline invitation
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form className="space-y-7" onSubmit={onSubmit}>
      <section className="overflow-hidden rounded-xl border border-forest-900/10 bg-white">
        <div className="border-b border-forest-900/10 bg-[#edf2ee] px-6 py-7 md:px-8">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-forest-900 text-[#e1c991]">
              <Scale size={20} />
            </div>
            <div>
              <p className="eyebrow text-forest-500">Section 01</p>
              <h2 className="mt-2 font-serif text-3xl text-forest-900">Overall recommendation</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Choose the outcome best supported by your assessment. Editors make the final
                decision after considering all reports.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <label className="block text-sm font-semibold text-forest-900" htmlFor="recommendation">
            Recommendation
          </label>
          <select
            id="recommendation"
            className={`${fieldClass} h-12`}
            name="recommendation"
            defaultValue="MINOR_REVISION"
          >
            <option value="ACCEPT">Accept</option>
            <option value="MINOR_REVISION">Minor revision</option>
            <option value="MAJOR_REVISION">Major revision</option>
            <option value="REJECT">Reject</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-forest-900/10 bg-white">
        <div className="border-b border-forest-900/10 px-6 py-7 md:px-8">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#edf2ee] text-forest-500">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="eyebrow text-forest-500">Section 02</p>
              <h2 className="mt-2 font-serif text-3xl text-forest-900">Scholarly assessment</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Give a concise, evidence-based assessment for each area. Include strengths as well
                as concerns.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
          {assessmentFields.map((field) => (
            <label key={field.name} className="block text-sm font-semibold text-forest-900">
              {field.label}
              <span className="mt-1 block text-xs font-normal leading-relaxed text-ink-500">
                {field.help}
              </span>
              <textarea
                className={fieldClass}
                name={field.name}
                rows={6}
                required
                minLength={10}
                maxLength={8000}
                placeholder="Write a specific assessment…"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-forest-900/10 bg-white">
        <div className="border-b border-forest-900/10 bg-[#edf2ee] px-6 py-7 md:px-8">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-forest-900 text-[#e1c991]">
              <MessageSquareText size={20} />
            </div>
            <div>
              <p className="eyebrow text-forest-500">Section 03</p>
              <h2 className="mt-2 font-serif text-3xl text-forest-900">Your written report</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Keep author-facing feedback and private editorial context in their correct channels.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6 p-6 md:p-8">
          <label className="block text-sm font-semibold text-forest-900">
            Comments to the authors
            <span className="mt-1 block text-xs font-normal leading-relaxed text-ink-500">
              Summarize the contribution, list major points before minor points, and suggest
              practical improvements. The authors will receive this text.
            </span>
            <textarea
              className={fieldClass}
              name="commentsToAuthor"
              rows={10}
              required
              minLength={20}
              maxLength={20000}
              placeholder="Begin with a short summary of the manuscript and its contribution…"
            />
          </label>

          <label className="block rounded-xl bg-forest-900 p-5 text-sm font-semibold text-white md:p-6">
            <span className="flex items-center gap-2">
              <LockKeyhole size={16} className="text-[#e1c991]" /> Confidential comments to the editor
            </span>
            <span className="mt-2 block text-xs font-normal leading-relaxed text-white/60">
              Use this area for sensitive ethics concerns or decision context. Authors will not see
              these comments.
            </span>
            <textarea
              className="mt-4 w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/35 focus:border-[#e1c991] focus:ring-2 focus:ring-[#e1c991]/10"
              name="commentsToEditor"
              rows={6}
              required
              minLength={10}
              maxLength={20000}
              placeholder="Share confidential context for the editorial decision…"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#d9c18a] bg-[#f4e8ca] p-6 md:p-8">
        <div className="flex gap-4">
          <ShieldCheck size={24} className="mt-0.5 shrink-0 text-forest-900" />
          <div>
            <h2 className="font-serif text-2xl text-forest-900">Final review check</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Submitted reports cannot be edited in the workspace. Read your responses once more
              and make sure the recommendation matches your comments.
            </p>
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-700">
              <input required type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1a5c4a]" />
              <span>
                I confirm that this review is my independent assessment, contains no inappropriate
                identifying information, and is ready for editorial consideration.
              </span>
            </label>
          </div>
        </div>
        <FormError error={error} />
        <button
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md bg-forest-900 px-6 text-sm font-semibold text-white transition hover:bg-forest-500 disabled:opacity-60 sm:w-auto"
          disabled={pendingAction !== null}
          type="submit"
        >
          {pendingAction === "submit" ? (
            <>
              <LoaderCircle size={16} className="animate-spin" /> Submitting report…
            </>
          ) : (
            <>
              Submit review <ArrowRight size={16} />
            </>
          )}
        </button>
      </section>
    </form>
  );
}

function FormError({ error }: { error: string | null }) {
  return error ? (
    <p
      role="alert"
      className="mt-5 flex gap-2 rounded-md border border-crimson-100 bg-crimson-50 p-3 text-sm text-crimson-700"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      {error}
    </p>
  ) : null;
}
