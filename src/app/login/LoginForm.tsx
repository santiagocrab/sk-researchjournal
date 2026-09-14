"use client";

import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { BRAND_SHORT } from "@/lib/branding";

const fieldClass = "mt-2 h-12 rounded-md border-ink-200 bg-[#fafbf8]";

export default function LoginForm({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const submitting = params.get("intent") === "submit";
  const reviewing = params.get("intent") === "review";
  const [mode, setMode] = useState<"signin" | "signup">(
    !reviewing && params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function establishSession(email: string, password: string) {
    await fetch("/api/auth/csrf");
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error)
      throw new Error("Your account was created, but sign-in failed. Please sign in.");
    router.push(params.get("next") || "/admin");
    router.refresh();
  }

  async function onSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await establishSession(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setPending(false);
    }
  }

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }
    const email = String(form.get("email") ?? "");
    try {
      await fetch("/api/auth/csrf");
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.get("firstName"),
          middleName: form.get("middleName") || null,
          lastName: form.get("lastName"),
          email,
          affiliation: form.get("affiliation"),
          country: form.get("country"),
          orcid: form.get("orcid") || null,
          password,
        }),
      });
      await establishSession(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account");
      setPending(false);
    }
  }

  return (
    <div
      id="editorial-login"
      className={
        embedded
          ? "bg-white"
          : "mx-auto max-w-md rounded-xl border border-ink-100 bg-white p-8 shadow-sm"
      }
    >
      <div className="pb-6 text-forest-900">
        <p className="eyebrow text-forest-500">
          {reviewing ? "Reviewer access" : submitting ? "Begin your submission" : BRAND_SHORT}
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight">
          {mode === "signin"
            ? reviewing
              ? "Open your assignments."
              : "Welcome back."
            : "Join the research community."}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          {mode === "signin"
            ? reviewing
              ? "Use the account linked to your invitation to respond and complete your review."
              : submitting
              ? "Sign in to continue to your submissions workspace."
              : "Sign in to your account to pick up where you left off."
            : "Create a free author account, then start and track your manuscript."}
        </p>
      </div>

      {reviewing ? (
        <div className="mb-6 flex gap-3 rounded-lg border border-forest-900/10 bg-[#edf2ee] p-4 text-xs leading-relaxed text-ink-600">
          <ShieldCheck size={18} className="shrink-0 text-forest-500" />
          Reviewer accounts are created by invitation. If you cannot access your account, reply to
          the invitation email or contact the editorial office.
        </div>
      ) : (
        <div
          className="mb-6 grid grid-cols-2 rounded-lg bg-ink-50 p-1"
          role="tablist"
          aria-label="Account access"
        >
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => {
                setMode(value);
                setError(null);
              }}
              className={`rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                mode === value
                  ? "bg-white text-forest-900 shadow-sm"
                  : "text-ink-500 hover:text-forest-500"
              }`}
            >
              {value === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      {mode === "signin" ? (
        <form className="space-y-5" onSubmit={onSignIn}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="name@university.edu"
              className={fieldClass}
            />
          </div>
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            visible={showPassword}
            setVisible={setShowPassword}
          />
          <FormError error={error} />
          <Button
            className="h-12 w-full bg-forest-900 hover:bg-forest-500"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <>
                <LoaderCircle size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={onRegister}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                autoComplete="given-name"
                className={fieldClass}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                autoComplete="family-name"
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@university.edu"
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="affiliation">Institution or affiliation</Label>
            <Input
              id="affiliation"
              name="affiliation"
              required
              autoComplete="organization"
              placeholder="University or organization"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                required
                autoComplete="country-name"
                placeholder="Philippines"
                className={fieldClass}
              />
            </div>
            <div>
              <Label htmlFor="orcid">
                ORCID iD <span className="font-normal text-ink-400">(optional)</span>
              </Label>
              <Input
                id="orcid"
                name="orcid"
                placeholder="0000-0000-0000-0000"
                className={fieldClass}
              />
            </div>
          </div>
          <PasswordField
            id="signup-password"
            label="Create password"
            autoComplete="new-password"
            visible={showPassword}
            setVisible={setShowPassword}
          />
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              className={fieldClass}
            />
          </div>
          <div className="rounded-lg bg-[#edf2ee] p-4 text-xs leading-relaxed text-ink-600">
            <p className="flex gap-2">
              <Check size={14} className="mt-0.5 shrink-0 text-forest-500" />
              Use 12+ characters with uppercase, lowercase, and a number.
            </p>
            <p className="mt-2 flex gap-2">
              <Check size={14} className="mt-0.5 shrink-0 text-forest-500" />
              Your account is created with author access only.
            </p>
          </div>
          <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-600">
            <input required type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1a5c4a]" />
            <span>
              I confirm that the information above is accurate and agree to follow the journal’s
              publication and ethics policies.
            </span>
          </label>
          <FormError error={error} />
          <Button
            className="h-12 w-full bg-forest-900 hover:bg-forest-500"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <>
                <LoaderCircle size={16} className="animate-spin" /> Creating account…
              </>
            ) : (
              <>
                Create author account <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-ink-500">
        {reviewing ? (
          <Link className="underline underline-offset-4" href="/journals/skrjet/for-reviewers">
            Return to the reviewer guide
          </Link>
        ) : (
          <>
            Readers can{" "}
            <Link className="underline underline-offset-4" href="/">
              continue browsing
            </Link>{" "}
            without an account.
          </>
        )}
      </p>
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  return error ? (
    <p
      role="alert"
      className="rounded-md border border-crimson-100 bg-crimson-50 p-3 text-sm text-crimson-700"
    >
      {error}
    </p>
  ) : null;
}

function PasswordField({
  id,
  label,
  autoComplete,
  visible,
  setVisible,
}: {
  id: string;
  label: string;
  autoComplete: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2">
        <Input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          className="h-12 rounded-md border-ink-200 bg-[#fafbf8] pr-12"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 px-3 text-ink-500"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
