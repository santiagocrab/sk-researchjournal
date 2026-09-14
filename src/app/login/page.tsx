import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, BookOpen, FileCheck2, MessageSquareText, ShieldCheck, Users } from "lucide-react";
import { PublicShell } from "@/components/public/Shell";
import LoginForm from "./LoginForm";

export const metadata = { title: "Account access" };

export default async function LoginRoute({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const reviewing = (await searchParams).intent === "review";
  const highlights = reviewing
    ? [
        {
          icon: FileCheck2,
          label: "Respond to invitations",
          text: "Accept or decline promptly after checking expertise, timing, and conflicts.",
        },
        {
          icon: BookOpen,
          label: "Review securely",
          text: "Open the assigned manuscript and evaluation criteria in one workspace.",
        },
        {
          icon: MessageSquareText,
          label: "Submit useful feedback",
          text: "Keep author comments separate from confidential notes to the editor.",
        },
      ]
    : [
        {
          icon: BookOpen,
          label: "Build your submission",
          text: "Add metadata and upload every required manuscript file.",
        },
        {
          icon: Users,
          label: "Follow peer review",
          text: "Track decisions and respond to requests for revision.",
        },
        {
          icon: FileCheck2,
          label: "Keep everything together",
          text: "Your manuscripts and editorial history stay in one workspace.",
        },
      ];

  return (
    <PublicShell hero={null}>
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-forest-500"
      >
        <ArrowLeft size={15} /> Back to the journal
      </Link>
      <section className="mx-auto mb-8 grid max-w-5xl overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-[0_18px_60px_-35px_rgba(10,42,34,0.3)] lg:grid-cols-2">
        <div className="relative order-2 overflow-hidden bg-forest-900 px-8 py-12 text-white md:px-12 md:py-16 lg:order-1">
          <div
            aria-hidden
            className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full border border-white/10"
          />
          <p className="eyebrow text-[#e1c991]">
            {reviewing ? "The reviewer workspace" : "The submission workspace"}
          </p>
          <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
            {reviewing ? "Help rigorous research" : "Give your research"}
            <br />
            <span className="italic text-[#e1c991]">
              {reviewing ? "earn readers’ trust." : "room to make an impact."}
            </span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70">
            {reviewing
              ? "Your independent assessment helps editors make fair decisions and helps authors improve their work."
              : "Create an author account, submit your manuscript, and follow its journey from editorial screening to publication."}
          </p>
          <div className="mt-10 space-y-5">
            {highlights.map((item) => (
              <div key={item.label} className="flex gap-4">
                <item.icon size={21} strokeWidth={1.4} className="mt-1 shrink-0 text-[#e1c991]" />
                <div>
                  <h2 className="text-sm font-medium">{item.label}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          {reviewing ? (
            <p className="mt-10 flex max-w-sm gap-3 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/60">
              <ShieldCheck size={17} className="shrink-0 text-[#e1c991]" />
              Your identity and confidential editor notes are protected from authors.
            </p>
          ) : null}
        </div>
        <div className="order-1 flex flex-col justify-center px-6 py-10 md:p-12 lg:order-2">
          <Suspense
            fallback={
              <div
                className="h-80 animate-pulse rounded-xl bg-ink-50"
                aria-label="Preparing sign-in form"
              />
            }
          >
            <LoginForm embedded />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  );
}
