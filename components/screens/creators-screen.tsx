"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppFrame } from "@/components/ui/app-frame";
import { CreatorCard } from "@/components/ui/creator-card";
import { useTopCreators } from "@/lib/hooks/use-top-creators";
import type { CreatorProfile } from "@/lib/types";

type CreatorFilter = "all" | "most" | "least" | "newest" | "oldest";

const filters: { label: string; value: CreatorFilter }[] = [
  { label: "All", value: "all" },
  { label: "Most tip", value: "most" },
  { label: "Least tip", value: "least" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" }
];

function creatorTotal(creator: CreatorProfile) {
  return Number(creator.totalUsdcTipsReceived || 0) + Number(creator.totalEurcTipsReceived || 0);
}

function createdAt(creator: CreatorProfile) {
  return Number(creator.createdAt || 0);
}

function sortCreators(creators: CreatorProfile[], filter: CreatorFilter) {
  const next = [...creators];
  if (filter === "most") return next.sort((a, b) => creatorTotal(b) - creatorTotal(a));
  if (filter === "least") return next.sort((a, b) => creatorTotal(a) - creatorTotal(b));
  if (filter === "newest") return next.sort((a, b) => createdAt(b) - createdAt(a));
  if (filter === "oldest") return next.sort((a, b) => createdAt(a) - createdAt(b));
  return next.sort((a, b) => a.nickname.localeCompare(b.nickname));
}

export function CreatorsScreen() {
  const { creators, loading } = useTopCreators(100);
  const [filter, setFilter] = useState<CreatorFilter>("all");
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  const visibleCreators = useMemo(() => {
    const filtered = normalizedSearch
      ? creators.filter((creator) => creator.nickname.toLowerCase().includes(normalizedSearch))
      : creators;
    return sortCreators(filtered, filter);
  }, [creators, filter, normalizedSearch]);

  return (
    <AppFrame>
      <section className="mx-auto w-full max-w-[1140px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-graphite">Creator list</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-tight text-ink sm:text-6xl">
              Explore Flick creators.
            </h1>
          </div>

          <label className="block w-full lg:max-w-sm">
            <span className="sr-only">Search by creator nickname</span>
            <div className="flat-input flex min-h-12 items-center gap-3 px-4">
              <Search className="h-5 w-5 shrink-0 text-sky" aria-hidden />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search nickname"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 font-bold text-ink placeholder:text-silver focus:ring-0"
              />
            </div>
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Creator filters">
          {filters.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border-2 px-4 py-2 text-xs font-black uppercase transition ${
                  active
                    ? "border-duo bg-duo text-white shadow-[0_4px_0_#3fa300]"
                    : "border-cloud bg-white text-graphite hover:border-duo hover:text-duo"
                }`}
                aria-pressed={active}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm font-black uppercase text-graphite">
            {loading ? "Loading creators" : `${visibleCreators.length} creator${visibleCreators.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {visibleCreators.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCreators.map((creator) => (
              <CreatorCard key={creator.nickname} creator={creator} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border-2 border-cloud bg-white px-6 py-10 text-center">
            <p className="font-bold text-graphite">
              {loading ? "Loading creators..." : "No creators match this search yet."}
            </p>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
