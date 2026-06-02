"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppKit, useAppKitState } from "@reown/appkit/react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ArrowRight, CheckCircle2, Link2, Sparkles, Wallet, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import { AppFrame } from "@/components/ui/app-frame";
import { useCurrentNickname } from "@/lib/hooks/use-current-nickname";
import { useProfileSettings } from "@/lib/hooks/use-profile-settings";
import { useTopCreators } from "@/lib/hooks/use-top-creators";
import { initialsFor } from "@/lib/format";
import type { CreatorProfile } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } }
};

const steps = [
  {
    icon: Sparkles,
    title: "Create your page",
    copy: "Claim a memorable Flick link and make it yours in a few moments."
  },
  {
    icon: Link2,
    title: "Share it anywhere",
    copy: "Drop your tip page into your bio, newsletter, stream, or launch post."
  },
  {
    icon: Zap,
    title: "Receive support",
    copy: "Fans choose an amount, add a note, and confirm with one simple flick."
  }
];

const values = ["Fast setup", "Personal public tip page", "Simple support flow", "Creator-first experience"];
const landingCtaClassName =
  "duo-button focus-ring inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-center text-sm font-black uppercase transition sm:px-6";

function LandingCta({ label = "Create Your Tip Jar", className = "" }: { label?: string; className?: string }) {
  if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) {
    return <MissingLandingCta label={label} className={className} />;
  }

  return <ConnectedLandingCta label={label} className={className} />;
}

function MissingLandingCta({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => alert("Add NEXT_PUBLIC_REOWN_PROJECT_ID to .env.local to enable Reown AppKit.")}
      className={`${landingCtaClassName} ${className}`}
    >
      <Wallet className="h-5 w-5" aria-hidden />
      {label}
    </button>
  );
}

function ConnectedLandingCta({ label, className = "" }: { label: string; className?: string }) {
  const router = useRouter();
  const { open } = useAppKit();
  const { open: modalOpen } = useAppKitState();
  const { isConnected } = useAccount();
  const { nickname, loading: nicknameLoading, checked: nicknameChecked } = useCurrentNickname();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const modalWasOpen = useRef(false);
  const ctaLabel = isConnected && nickname ? "Your Tip Jar" : label;
  const destination = nickname ? `/${nickname}` : "/dashboard";
  const isCheckingNickname = isConnected && !nicknameChecked && nicknameLoading;

  useEffect(() => {
    if (isConnected && shouldRedirect && nicknameChecked) {
      setShouldRedirect(false);
      router.push(destination);
    }
  }, [destination, isConnected, nicknameChecked, router, shouldRedirect]);

  useEffect(() => {
    if (modalOpen) {
      modalWasOpen.current = true;
      return;
    }

    if (modalWasOpen.current && shouldRedirect && !isConnected) {
      modalWasOpen.current = false;
      setShouldRedirect(false);
    }
  }, [isConnected, modalOpen, shouldRedirect]);

  async function handleClick() {
    if (isCheckingNickname) {
      return;
    }

    if (isConnected) {
      router.push(destination);
      return;
    }

    setShouldRedirect(true);
    try {
      await open();
    } catch {
      setShouldRedirect(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isCheckingNickname}
      aria-busy={isCheckingNickname}
      className={`${landingCtaClassName} ${className}`}
      title={ctaLabel}
    >
      <Wallet className="h-5 w-5" aria-hidden />
      {ctaLabel}
    </button>
  );
}

function HeroAsset() {
  return (
    <motion.div variants={item} className="relative min-w-0 lg:pl-4">
      <div className="relative mx-auto w-full max-w-[44rem]">
        <Image
          src="/hero-section.svg"
          alt="Flick creator tipping interface preview"
          width={2141}
          height={2048}
          priority
          unoptimized
          className="h-auto w-full select-none"
          draggable={false}
        />
      </div>
    </motion.div>
  );
}

function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const nickname = creator.nickname.toLowerCase();
  const { settings } = useProfileSettings(nickname);
  const displayName = settings.displayName || creator.displayName || nickname;
  const avatarUrl = settings.avatarUrl || creator.avatarUrl;
  const statusLabel = settings.profileStatus || creator.profileStatus || "Digital Creator";

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
          <span className="focus-ring inline-flex min-h-[54px] w-full items-center justify-center rounded-lg border-[3px] border-duo bg-white/70 px-5 py-3 text-lg font-black text-duo transition group-hover:-translate-y-0.5 group-hover:bg-duo-light">
            Flick to {displayName}
          </span>
        </div>
      </article>
    </Link>
  );
}

function TopCreatorsSection() {
  const { creators, loading } = useTopCreators(6);

  return (
    <section className="mx-auto w-full max-w-[1140px] px-4 pb-40 sm:px-6 lg:px-8 lg:pb-48">
      <div>
        <div>
          <p className="text-sm font-black uppercase text-graphite">Top creators</p>
          <h2 className="mt-4 max-w-2xl font-display text-5xl font-bold leading-tight text-ink">
            Flick the creators people support most.
          </h2>
        </div>
      </div>

      {creators.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard key={creator.nickname} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border-2 border-cloud bg-white px-6 py-10 text-center">
          <p className="font-bold text-graphite">
            {loading ? "Loading top creators..." : "The leaderboard will appear after creators receive their first tips."}
          </p>
        </div>
      )}
    </section>
  );
}

export function LandingPage() {
  return (
    <AppFrame>
      <motion.section
        variants={container}
        initial={false}
        animate="show"
        className="mx-auto grid w-full max-w-[1140px] items-center gap-10 px-4 pb-40 pt-8 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-48 lg:pt-10"
      >
        <div>
          <motion.p variants={item} className="text-sm font-black uppercase text-graphite">
            Personal tipping pages for creators
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-5 max-w-2xl break-words font-display text-4xl font-bold leading-[0.98] text-ink min-[420px]:text-5xl sm:text-7xl lg:text-8xl"
          >
            Receive Tips in a Flick.
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-xl text-lg font-bold leading-8 text-graphite">
            Flick helps creators set up a personal tipping page, share it instantly, and receive fast digital support from fans.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col gap-4 sm:flex-row">
            <LandingCta className="w-full sm:w-auto" />
            <Link
              href="/flickdemo"
              className="sky-link-button focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase transition sm:w-auto sm:px-6"
            >
              See example <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </motion.div>

          <motion.p variants={item} className="mt-5 text-sm font-bold text-graphite">
            Wallet, email, and Google sign-in are handled by Reown.
          </motion.p>
        </div>

        <HeroAsset />
      </motion.section>

      <TopCreatorsSection />

      <section className="mx-auto w-full max-w-[1140px] px-4 pb-40 sm:px-6 lg:px-8 lg:pb-48">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-black uppercase text-graphite">How it works</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Start simple. Stay creator-first.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:mt-12">
          {steps.map(({ icon: Icon, title, copy }, index) => (
            <motion.article
              key={title}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.42, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border-2 border-cloud bg-snow p-6"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-4xl font-bold text-duo">{index + 1}</span>
                <Icon className="h-[1.5625rem] w-[1.5625rem] text-sky" aria-hidden />
              </div>
              <h3 className="mt-5 font-display text-3xl font-bold text-ink">{title}</h3>
              <p className="mt-3 font-bold leading-7 text-graphite">{copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1140px] px-4 pb-40 sm:px-6 lg:px-8 lg:pb-48">
        <div className="grid gap-3 rounded-3xl border-2 border-cloud bg-snow p-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div key={value} className="flex items-center gap-3 rounded-2xl bg-cloud/25 px-4 py-4">
              <CheckCircle2 className="h-[1.5625rem] w-[1.5625rem] shrink-0 text-duo" aria-hidden />
              <p className="text-sm font-black uppercase text-ink">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1140px] px-4 pb-40 sm:px-6 lg:px-8 lg:pb-48">
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink px-6 py-12 text-center text-snow sm:px-12">
          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-black uppercase text-duo-light">Ready when you are</p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Turn your audience into real support.
            </h2>
            <p className="mt-4 text-base font-bold leading-7 text-silver">
              Create a Flick tip jar, share one link, and give supporters a low-friction way to show up.
            </p>
            <div className="mt-8">
              <LandingCta className="w-full sm:w-auto" />
            </div>
          </div>
        </div>
      </section>
    </AppFrame>
  );
}
