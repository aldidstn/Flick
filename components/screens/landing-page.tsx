"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppKit, useAppKitState } from "@reown/appkit/react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { CheckCircle2, Link2, Sparkles, Wallet, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import { AppFrame } from "@/components/ui/app-frame";
import { CreatorCard } from "@/components/ui/creator-card";
import { useCurrentNickname } from "@/lib/hooks/use-current-nickname";
import { useTopCreators } from "@/lib/hooks/use-top-creators";

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

function TopCreatorsSection() {
  const { creators, loading } = useTopCreators(6);

  return (
    <section id="top-creators" className="mx-auto w-full max-w-[1140px] scroll-mt-24 px-4 pb-40 sm:px-6 lg:px-8 lg:pb-48">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-graphite">Top creators</p>
          <h2 className="mt-4 max-w-2xl font-display text-5xl font-bold leading-tight text-ink">
            Flick the creators people support most.
          </h2>
        </div>
        <Link
          href="/creators"
          className="sky-link-button focus-ring inline-flex min-h-12 w-full items-center justify-center px-5 py-3 text-sm font-black uppercase transition sm:w-auto"
        >
          View all
        </Link>
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

          <motion.div variants={item} className="mt-9">
            <LandingCta className="w-full sm:w-auto" />
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
