"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client/api";
import { ArrowRight, FilePlus2, LoaderCircle, X } from "lucide-react";

export function NewArticleButton({ journals }: { journals: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [journalId, setJournalId] = useState(journals[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, pending]);

  async function create() {
    setError(null);
    setPending(true);
    try {
      await fetch("/api/auth/csrf");
      const result = await api<{ article: { id: string } }>("/api/articles", {
        method: "POST",
        body: JSON.stringify({ journalId }),
      });
      router.push(`/admin/articles/${result.article.id}/wizard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create article");
      setPending(false);
    }
  }

  if (!journals.length) return null;
  return (
    <div>
      <button
        className="inline-flex min-h-11 items-center gap-3 rounded-md bg-forest-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-forest-500"
        type="button"
        onClick={() => setOpen(true)}
      >
        <FilePlus2 size={17} /> Start new submission
      </button>
      {open ? (
        <div className="bg-forest-950/65 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-submission-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-5 bg-forest-900 p-6 text-white">
              <div>
                <p className="eyebrow text-[#e1c991]">New manuscript</p>
                <h2 id="new-submission-title" className="mt-2 font-serif text-3xl">
                  Start a submission.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  We’ll create a private draft and take you to the guided submission workspace.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-forest-900" htmlFor="journal">
                Choose a journal
              </label>
              <p className="mt-1 text-xs text-ink-500">
                Select the publication that best fits your research.
              </p>
              <select
                id="journal"
                className="mt-3 min-h-12 w-full rounded-md border border-ink-200 bg-paper px-3 py-2 text-sm"
                value={journalId}
                disabled={pending}
                onChange={(event) => setJournalId(event.target.value)}
              >
                {journals.map((journal) => (
                  <option key={journal.id} value={journal.id}>
                    {journal.name}
                  </option>
                ))}
              </select>
              <div className="mt-5 rounded-lg bg-[#edf2ee] p-4 text-xs leading-relaxed text-ink-600">
                Your draft is private. You can add metadata and files, save your progress, and
                submit only when everything is ready.
              </div>
              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-md border border-crimson-100 bg-crimson-50 p-3 text-sm text-crimson-700"
                >
                  {error}
                </p>
              ) : null}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="rounded-md px-4 py-2 text-sm text-ink-600 hover:bg-ink-50"
                  type="button"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={pending || !journalId}
                  className="inline-flex min-h-11 items-center gap-3 rounded-md bg-forest-900 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-500 disabled:opacity-60"
                  type="button"
                  onClick={create}
                >
                  {pending ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" /> Creating draft…
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
