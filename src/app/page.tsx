import Link from "next/link";
import { BrandHero } from "@/components/public/BrandHero";
import { PublicShell } from "@/components/public/Shell";
import { HomeCatalogSections, loadHomeCatalog } from "@/components/public/HomeContent";

export default async function HomePage() {
  const result = await loadHomeCatalog();

  if (!result.ok) {
    return (
      <PublicShell hero={<BrandHero />}>
        <section className="max-w-2xl">
          <h1 className="font-serif text-4xl text-ink-950">Site is up, database is not</h1>
          <p className="mt-4 text-lg text-ink-700">{result.message}</p>
          <ol className="mt-6 list-decimal space-y-2 pl-5 text-ink-700">
            <li>
              Set <code className="rounded bg-ink-100 px-1">DATABASE_URL</code> in Vercel →
              Environment Variables (type Secret) to your Neon or Supabase Postgres URL.
            </li>
            <li>Redeploy the project.</li>
            <li>
              From your machine, run{" "}
              <code className="rounded bg-ink-100 px-1">npx prisma migrate deploy</code> with that
              same <code className="rounded bg-ink-100 px-1">DATABASE_URL</code>.
            </li>
          </ol>
          <p className="mt-6 text-sm text-ink-600">
            Status check:{" "}
            <Link className="underline" href="/api/health">
              /api/health
            </Link>
          </p>
        </section>
      </PublicShell>
    );
  }

  const { journals, articles } = result.data;

  return (
    <PublicShell hero={<BrandHero />}>
      <HomeCatalogSections journals={journals} articles={articles} />
    </PublicShell>
  );
}
