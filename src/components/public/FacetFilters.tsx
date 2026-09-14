"use client";

import Link from "next/link";
import type { SearchFacetOption } from "@/lib/search/query";

function FacetGroup({
  legend,
  name,
  options,
}: {
  legend: string;
  name: string;
  options: SearchFacetOption[];
}) {
  if (!options.length) return null;
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-semibold uppercase tracking-wide text-ink-800">
        {legend}
      </legend>
      <ul className="mt-3 space-y-2">
        {options.map((option) => (
          <li key={`${name}-${option.value}`}>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-800">
              <input
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a5c4a]"
                type="checkbox"
                name={name}
                value={option.value}
                defaultChecked={option.selected}
              />
              <span className="flex-1">{option.label}</span>
              <span className="text-xs text-ink-500">{option.count}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export function FacetFilters({
  query,
  years,
  categories,
  journals,
  preserved = [],
}: {
  query: string;
  years: SearchFacetOption[];
  categories: SearchFacetOption[];
  journals: SearchFacetOption[];
  preserved?: [string, string][];
}) {
  return (
    <form
      action="/search"
      method="get"
      className="rounded-xl border border-forest-900/10 bg-white p-5"
    >
      {query ? <input type="hidden" name="q" value={query} /> : null}
      {preserved.map(([name, value], index) => (
        <input key={`${name}-${index}`} type="hidden" name={name} value={value} />
      ))}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Refine your search</h2>
        <Link
          href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
          className="text-xs text-forest-500 underline"
        >
          Clear
        </Link>
      </div>
      <FacetGroup legend="Year" name="year" options={years} />
      <FacetGroup legend="Category" name="category" options={categories} />
      <FacetGroup legend="JOURNAL" name="journal" options={journals} />
      <button
        className="mt-6 w-full rounded-md bg-forest-900 px-4 py-3 text-sm font-semibold text-white hover:bg-forest-500"
        type="submit"
      >
        Apply filters
      </button>
    </form>
  );
}
