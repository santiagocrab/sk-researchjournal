import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, BookOpen, Globe2 } from "lucide-react";
import { BRAND_FULL, BRAND_HERO } from "@/lib/branding";

export function BrandHero({ variant = "full" }: { variant?: "full" | "banner" }) {
  if (variant === "banner")
    return (
      <section className="border-b border-forest-500/10 bg-[#edf2ee]">
        <div className="mx-auto max-w-6xl px-6 py-7 lg:px-8">
          <p className="eyebrow text-forest-500">Research · Education · Technology</p>
          <p className="mt-2 max-w-2xl font-serif text-xl text-forest-900">{BRAND_FULL}</p>
        </div>
      </section>
    );
  return (
    <section className="landing-hero relative isolate overflow-hidden bg-forest-900 text-white">
      <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
        <Image
          src={BRAND_HERO}
          alt="Sultan Kudarat State University campus"
          fill
          priority
          className="object-cover object-center"
          sizes="(min-width: 1024px) 62vw, 100vw"
        />
      </div>
      <div className="hero-shade absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.4fr_0.6fr] lg:px-8">
        <div className="hero-enter">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-8 bg-[#d8ba79]" />
            <p className="eyebrow text-[#e1c991]">Sultan Kudarat State University</p>
          </div>
          <h1 className="max-w-2xl font-serif text-[clamp(2.8rem,5.6vw,4.8rem)] font-normal leading-[1.08] tracking-[-0.045em]">
            Ideas that advance.
            <br />
            <span className="italic text-[#e1c991]">Research that matters.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
            Discover scholarship connecting education and technology, shaping new perspectives and
            making a difference beyond the page.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="#research"
              className="inline-flex min-h-12 items-center gap-6 rounded-md bg-[#e1c991] px-6 text-sm font-semibold text-forest-900 transition hover:bg-[#f0deb7]"
            >
              Find your next paper <ArrowUpRight size={17} />
            </Link>
            <Link
              href="/journals/skrjet/for-authors"
              className="inline-flex min-h-12 items-center gap-4 rounded-md border border-white/30 px-6 text-sm font-medium transition hover:bg-white/10"
            >
              Publish with us <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/70">
            <span className="flex items-center gap-2">
              <BookOpen size={15} /> Peer-reviewed scholarship
            </span>
            <span className="flex items-center gap-2">
              <Globe2 size={15} /> Open access to knowledge
            </span>
          </div>
        </div>
        <div className="hidden flex-col justify-end pb-2 lg:flex">
          <div className="border-l border-white/35 pl-6">
            <p className="eyebrow text-[#e1c991]">Rooted in community</p>
            <p className="mt-3 max-w-60 font-serif text-2xl leading-snug">
              Local perspectives.
              <br />
              Global conversations.
            </p>
            <p className="mt-4 text-xs text-white/70">Tacurong City, Philippines</p>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <p className="text-xs tracking-wide text-white/65">
            The Sultan Kudarat Research Journal of Education and Technology
          </p>
          <a href="#main" className="flex shrink-0 items-center gap-2 text-xs text-[#e1c991]">
            Discover <ArrowDown size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
