"use client";

import Link from "next/link";
import { initialsFor } from "@/lib/format";
import type { CreatorProfile } from "@/lib/types";

export function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const nickname = creator.nickname.toLowerCase();
  const displayName = creator.displayName || nickname;
  const avatarUrl = creator.avatarUrl;
  const statusLabel = creator.profileStatus || "Digital Creator";

  return (
    <Link
      href={`/${nickname}`}
      className="focus-ring group block rounded-2xl transition hover:-translate-y-1 hover:shadow-surface"
      aria-label={`Open ${displayName}'s Flick tip jar`}
    >
      <article className="relative flex flex-col items-center overflow-hidden rounded-2xl bg-white px-6 pb-6 pt-9 text-center ring-2 ring-inset ring-[#C7C7CC]">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 420 560"
          fill="none"
          aria-hidden
          preserveAspectRatio="none"
        >
          <path
            opacity="0.1"
            d="M505.41 100.006C505.961 97.084 506.249 94.069 506.249 90.986C506.249 64.4841 484.972 43 458.725 43C442.666 43 428.467 51.043 419.865 63.3575C411.606 56.3566 400.954 52.1402 389.327 52.1402C363.332 52.1402 342.212 73.2136 341.809 99.364H341.803C312.641 99.364 289 123.235 289 152.682C289 182.129 312.641 206 341.803 206H497.197C526.359 206 550 182.129 550 152.682C550 126.056 530.672 103.99 505.41 100.006Z"
            fill="#2F80ED"
          />
          <path
            opacity="0.1"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M-43.9074 395.5L-128 346.909L-66.019 239.591L18.1225 288.098L18.17 191H142.134L142.181 288.098L226.322 239.591L288.304 346.909L204.21 395.5L288.304 444.091L226.322 551.409L142.181 502.903L142.134 600H18.17L18.1225 502.903L-66.019 551.409L-128 444.091L-43.9074 395.5Z"
            fill="#F8B3B8"
          />
          <path
            opacity="0.1"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M359.543 317.598C422.322 244.888 483.586 352.438 389.797 369.858C483.586 388.036 421.565 494.829 359.543 422.118C391.31 513.005 268.023 512.249 299.79 422.118C237.012 494.829 175.746 388.036 269.536 369.858C174.99 352.438 237.012 245.645 299.79 317.598C267.267 227.467 391.31 227.467 359.543 317.598ZM329.288 356.225C336.852 356.225 343.659 362.284 343.659 369.858C343.659 377.432 336.852 384.249 329.288 384.249C321.725 384.249 315.673 377.432 315.673 369.858C315.673 362.284 321.725 356.225 329.288 356.225Z"
            fill="#EB5757"
          />
          <path
            opacity="0.1"
            d="M61.8651 -13.1035C62.1654 -15.6322 65.8346 -15.6322 66.1349 -13.1035L68.652 8.10962C71.9021 35.5015 93.4985 57.0979 120.89 60.3481L142.103 62.8651C144.632 63.1654 144.632 66.8346 142.103 67.1349L120.89 69.652C93.4985 72.9021 71.9021 94.4985 68.652 121.89L66.1349 143.103C65.8346 145.632 62.1654 145.632 61.8651 143.103L59.3481 121.89C56.0979 94.4985 34.5015 72.9021 7.10962 69.652L-14.1035 67.1349C-16.6322 66.8346 -16.6322 63.1654 -14.1035 62.8651L7.10962 60.3481C34.5015 57.0979 56.0979 35.5015 59.3481 8.10962L61.8651 -13.1035Z"
            fill="#F2994A"
          />
        </svg>

        <div className="relative z-10 w-full">
          <h3 className="line-clamp-1 font-display text-4xl font-bold leading-none text-black">
            {displayName}
          </h3>
          <p className="mt-3 line-clamp-1 text-base font-black capitalize text-graphite">{statusLabel}</p>
        </div>

        <div className="relative z-10 mt-8 grid h-48 w-48 place-items-center overflow-hidden rounded-full bg-white shadow-surface sm:h-56 sm:w-56">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-6xl font-bold text-duo">{initialsFor(displayName || nickname)}</span>
          )}
        </div>

        <div className="relative z-10 mt-8 w-full">
          <span className="focus-ring inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-duo bg-white px-4 py-3 text-sm font-black uppercase text-duo transition group-hover:bg-duo-light">
            Flick to {displayName}
          </span>
        </div>
      </article>
    </Link>
  );
}
