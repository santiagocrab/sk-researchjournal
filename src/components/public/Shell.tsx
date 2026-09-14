import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/public/SiteHeader";
import { BrandHero } from "@/components/public/BrandHero";
import {
  BRAND_CONTACT,
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_PUBLISHER,
  BRAND_SHORT,
} from "@/lib/branding";

export { SiteHeader };

export function SiteFooter() {
  return (
    <footer id="contact" className="mt-auto border-t border-forest-900/10 bg-[#edf2ee]">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Image
              src={BRAND_LOGO}
              alt={BRAND_SHORT}
              width={220}
              height={60}
              className="mb-4 h-12 w-auto"
            />
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-navy-700">
              {BRAND_PUBLISHER}
            </p>
            <p className="mt-1 text-sm text-ink-600">{BRAND_CONTACT.address}</p>
            <p className="mt-3 text-sm text-ink-700">
              <a className="hover:underline" href={`tel:${BRAND_CONTACT.phone.replace(/\s/g, "")}`}>
                {BRAND_CONTACT.phone}
              </a>
              {" · "}
              <a
                className="font-medium text-navy-700 hover:underline"
                href={`mailto:${BRAND_CONTACT.email}`}
              >
                {BRAND_CONTACT.email}
              </a>
              {" · "}
              <a
                className="hover:underline"
                href={BRAND_CONTACT.website}
                target="_blank"
                rel="noreferrer"
              >
                {BRAND_CONTACT.websiteLabel}
              </a>
            </p>
          </div>
          <div className="text-sm text-ink-600 md:text-right">
            <p className="font-medium text-navy-700">{BRAND_SHORT}</p>
            <p className="mt-1 max-w-sm md:ml-auto">{BRAND_NAME}</p>
            <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 md:justify-end">
              <Link
                className="underline decoration-ink-300 underline-offset-2 hover:text-navy-700"
                href="/journals/skrjet/for-authors"
              >
                For authors
              </Link>
              <Link
                className="underline decoration-ink-300 underline-offset-2 hover:text-navy-700"
                href="/journals/skrjet/for-reviewers"
              >
                For reviewers
              </Link>
              <Link
                className="font-semibold text-forest-500 underline decoration-forest-500/30 underline-offset-2"
                href="/submit"
              >
                Submit a paper
              </Link>
              <Link
                className="underline decoration-ink-300 underline-offset-2 hover:text-navy-700"
                href="/journals/skrjet/editorial-workflow"
              >
                Guidelines
              </Link>
              <Link
                className="underline decoration-ink-300 underline-offset-2 hover:text-navy-700"
                href="/login"
              >
                Editorial login
              </Link>
              <Link
                className="underline decoration-ink-300 underline-offset-2 hover:text-navy-700"
                href="/search"
              >
                Search
              </Link>
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-ink-100 pt-6 text-xs text-ink-500">
          © {new Date().getFullYear()} {BRAND_PUBLISHER}. {BRAND_SHORT} open scholarly publishing.
        </p>
      </div>
    </footer>
  );
}

export function PublicShell({
  children,
  hero,
}: {
  children: React.ReactNode;
  /** Override the default compact journal banner. Pass null to hide. */
  hero?: React.ReactNode | null;
}) {
  const banner = hero === undefined ? <BrandHero variant="banner" /> : hero;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {banner}
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
