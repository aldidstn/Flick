"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";
import { AppFrame } from "@/components/ui/app-frame";
import { GlassCard } from "@/components/ui/glass-card";
import { WalletButton } from "@/components/ui/wallet-button";
import { useClaimNickname } from "@/lib/hooks/use-flick-transactions";
import { useCurrentCreator } from "@/lib/hooks/use-creator";
import { useNicknameAvailability } from "@/lib/hooks/use-nickname-availability";
import { displayProfileUrl, normalizeNickname } from "@/lib/format";
import { FLICK_CONTRACT_ADDRESS } from "@/lib/constants";

export function ClaimScreen() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [rawNickname, setRawNickname] = useState("");
  const nickname = useMemo(() => normalizeNickname(rawNickname), [rawNickname]);
  const availability = useNicknameAvailability(nickname);
  const claimTx = useClaimNickname();
  const currentCreator = useCurrentCreator();
  const [error, setError] = useState<string | null>(null);
  const isClaiming = claimTx.state === "confirming";
  const availabilityTone = availability.checking
    ? "border-sky bg-white text-sky"
    : availability.available
      ? "border-duo bg-duo-light text-duo"
      : nickname
        ? "border-bubblegum bg-white text-bubblegum"
        : "border-cloud bg-cloud/30 text-graphite";

  async function handleClaim() {
    setError(null);
    try {
      await claimTx.claim(nickname);
      router.push(`/${nickname}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Claim failed.");
    }
  }

  return (
    <AppFrame>
      <section className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-black uppercase text-graphite">Creator launch</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-duo sm:text-6xl lg:text-7xl">
            Claim your public jar.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-bold leading-8 text-graphite">
            Your nickname becomes the on-chain identity supporters can remember, share, and tip.
          </p>
        </div>

        <GlassCard className="p-6 sm:p-8">
          {!isConnected ? (
            <div className="grid min-h-[30rem] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] bg-duo-light">
                  <ShieldCheck className="h-[3.125rem] w-[3.125rem] text-duo" aria-hidden />
                </div>
                <h2 className="mt-6 font-display text-4xl font-bold text-ink sm:text-5xl">Connect first</h2>
                <p className="mx-auto mt-3 max-w-sm font-bold leading-7 text-graphite">
                  Reown opens wallet, email, and Google login before nickname claiming.
                </p>
                <div className="mt-7">
                  <WalletButton label="Connect to claim" />
                </div>
              </div>
            </div>
          ) : currentCreator.profile ? (
            <div className="grid min-h-[30rem] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] bg-duo-light">
                  <CheckCircle2 className="h-[3.125rem] w-[3.125rem] text-duo" aria-hidden />
                </div>
                <h2 className="mt-6 font-display text-4xl font-bold text-ink sm:text-5xl">Nickname claimed</h2>
                <p className="mx-auto mt-3 max-w-sm font-bold leading-7 text-graphite">
                  This wallet already owns {displayProfileUrl(currentCreator.profile.nickname)}. Flick currently allows one nickname per wallet.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push(`/${currentCreator.profile?.nickname}`)}
                    className="duo-button focus-ring inline-flex min-h-12 items-center justify-center px-5 py-3 text-sm font-black uppercase transition"
                  >
                    Open jar
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="sky-link-button focus-ring inline-flex min-h-12 items-center justify-center px-5 py-3 text-sm font-black uppercase transition"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="nickname" className="text-sm font-black uppercase text-graphite">
                Your Flick URL
              </label>
              <div className="flat-input mt-3 flex flex-col overflow-hidden sm:flex-row sm:items-center">
                <span className="border-b-2 border-cloud px-5 py-4 text-lg font-black text-graphite sm:border-b-0 sm:border-r-2">
                  flick.to/
                </span>
                <input
                  id="nickname"
                  value={rawNickname}
                  onChange={(event) => setRawNickname(normalizeNickname(event.target.value))}
                  maxLength={32}
                  placeholder="aldidesign"
                  className="min-w-0 flex-1 border-0 bg-transparent px-5 py-4 text-2xl font-black text-ink placeholder:text-silver focus:ring-0 sm:text-3xl"
                />
              </div>

              <motion.div
                key={availability.message}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                aria-live="polite"
                className={`mt-3 flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-black ${availabilityTone}`}
              >
                {availability.checking ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                ) : availability.available ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
                )}
                <span>{availability.message}</span>
              </motion.div>

              <div className="mt-8 rounded-xl bg-duo-light p-5 text-ink">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-[1.5625rem] w-[1.5625rem] text-duo" aria-hidden />
                  <p className="font-black uppercase">Launch preview</p>
                </div>
                <p className="mt-5 break-words font-display text-4xl font-bold text-duo sm:text-5xl">
                  {displayProfileUrl(nickname || "nickname")}
                </p>
                <p className="mt-3 text-sm font-bold leading-6 text-graphite">
                  Claiming writes the nickname to FlickRegistry on Arc Testnet.
                </p>
              </div>

              {!FLICK_CONTRACT_ADDRESS ? (
                <p className="mt-5 rounded-xl border-2 border-sunshine bg-white px-4 py-3 text-sm font-bold text-ink">
                  Add `NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS` after deployment to enable real claiming.
                </p>
              ) : null}

              {error ? (
                <p className="mt-5 rounded-xl border-2 border-bubblegum bg-white px-4 py-3 text-sm font-bold text-ink">{error}</p>
              ) : null}

              <div className="mt-8">
                <button
                  type="button"
                  disabled={!availability.available || !FLICK_CONTRACT_ADDRESS || isClaiming}
                  onClick={handleClaim}
                  className="duo-button focus-ring inline-flex min-h-14 w-full items-center justify-center gap-2 px-5 py-4 text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isClaiming ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
                  {isClaiming ? "Claiming on Arc..." : "Claim & launch"}
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </section>
    </AppFrame>
  );
}
