"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, ExternalLink, HeartHandshake, Loader2, X } from "lucide-react";
import { parseUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { AppFrame } from "@/components/ui/app-frame";
import { CreatorAvatar } from "@/components/ui/creator-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { TokenToggle } from "@/components/ui/token-toggle";
import { WalletButton } from "@/components/ui/wallet-button";
import { erc20Abi } from "@/lib/abi";
import { useCurrentNickname } from "@/lib/hooks/use-current-nickname";
import { useActivity } from "@/lib/hooks/use-activity";
import { useCreatorByNickname } from "@/lib/hooks/use-creator";
import { useSendTip } from "@/lib/hooks/use-flick-transactions";
import { useLiveTipEvents } from "@/lib/hooks/use-live-tip-events";
import { useProfileSettings } from "@/lib/hooks/use-profile-settings";
import { displayProfileUrl, formatTokenAmount } from "@/lib/format";
import { FLICK_CONTRACT_ADDRESS, TOKEN_ADDRESSES, TOKEN_META, type FlickToken } from "@/lib/constants";

export function TipJarScreen({ nickname }: { nickname: string }) {
  const normalized = nickname.toLowerCase();
  const { address, isConnected } = useAccount();
  const { creator, loading } = useCreatorByNickname(normalized);
  const { nickname: currentNickname } = useCurrentNickname();
  const { settings } = useProfileSettings(creator?.nickname || normalized);
  const { activity: indexedActivity } = useActivity(creator?.id);
  const liveTipJar = useLiveTipEvents({
    nickname: creator?.nickname || normalized,
    creatorId: creator?.id,
    indexedActivity,
    usdcTotal: creator?.totalUsdcTipsReceived,
    eurcTotal: creator?.totalEurcTipsReceived
  });
  const [token, setToken] = useState<FlickToken>("USDC");
  const [amount, setAmount] = useState("5");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [tipNotice, setTipNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const tx = useSendTip(token, amount);
  const tokenAddress = TOKEN_ADDRESSES[token];
  const walletBalance = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address)
    }
  });

  function updateMessageDraft(value: string) {
    setMessage(value.replace(/[<>]/g, "").slice(0, 140));
  }

  const parsedAmount = useMemo(() => {
    if (!/^\d+(\.\d{0,6})?$/.test(amount)) return 0n;
    try {
      return parseUnits(amount || "0", 6);
    } catch {
      return 0n;
    }
  }, [amount]);

  const amountError = useMemo(() => {
    if (!amount) return "Enter an amount.";
    if (!/^\d+(\.\d{0,6})?$/.test(amount)) return "Use up to 6 decimal places.";
    if (parsedAmount <= 0n) return "Amount must be greater than zero.";
    return null;
  }, [amount, parsedAmount]);

  const disabled = !isConnected || !creator || !FLICK_CONTRACT_ADDRESS || Boolean(amountError);
  const isOwner = isConnected && currentNickname?.toLowerCase() === normalized;
  const isTipBusy = tx.state === "approving" || tx.state === "confirming";
  const isTipSuccess = tx.state === "success";
  const tipButtonLabel = tx.needsApproval ? `Approve ${TOKEN_META[token].symbol} once` : "Flick to confirm";
  const visibleTipButtonLabel =
    isTipBusy ? (tx.state === "approving" ? "Approving..." : "Sending tip...") : isTipSuccess ? "Tip sent" : tipButtonLabel;
  const walletBalanceLabel = !isConnected
    ? "Connect wallet to view balance"
    : walletBalance.isLoading
      ? "Checking wallet balance..."
      : `Wallet balance: ${formatTokenAmount(walletBalance.data || 0n)} ${TOKEN_META[token].symbol}`;

  async function handleTip() {
    setTipNotice(null);
    try {
      await tx.sendTip(normalized, senderName || "Supporter", message);
      void walletBalance.refetch();
      setTipNotice({
        type: "success",
        message: `Tip sent: ${formatTokenAmount(parsedAmount)} ${TOKEN_META[token].symbol}.`
      });
      setMessage("");
    } catch (caught) {
      const rawMessage = caught instanceof Error ? caught.message : "";
      const message = rawMessage.toLowerCase().includes("rejected")
        ? "Tip confirmation was rejected."
        : rawMessage.split("\n")[0].slice(0, 140) || "Tip failed. Please try again.";
      setTipNotice({
        type: "error",
        message
      });
    } finally {
      window.setTimeout(() => tx.reset(), 1200);
    }
  }

  return (
    <AppFrame>
      <section className="mx-auto flex w-full max-w-[1060px] flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <GlassCard className="mx-auto flex w-full max-w-[760px] flex-col p-6 sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-duo-light">
              <HeartHandshake className="h-[2.1875rem] w-[2.1875rem] text-duo" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-4xl font-bold text-duo sm:text-5xl">Send a flick</h2>
              <p className="text-sm font-bold text-graphite">
                {loading ? "Resolving creator..." : creator ? "Arc Testnet USDC or EURC" : "Creator not indexed yet"}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-1 flex-col gap-5">
            <TokenToggle value={token} onChange={setToken} />

            <label className="block">
              <span className="text-sm font-black uppercase text-graphite">Amount</span>
              <div className="flat-input mt-2 flex items-center px-5 py-3">
                <input
                  value={amount}
                  onChange={(event) => {
                    const next = event.target.value.replace(/[^0-9.]/g, "");
                    const [head, ...tail] = next.split(".");
                    setAmount(tail.length > 0 ? `${head}.${tail.join("")}` : head);
                  }}
                  inputMode="decimal"
                  aria-describedby={amountError ? "tip-amount-error tip-wallet-balance" : "tip-wallet-balance"}
                  aria-invalid={Boolean(amountError)}
                  className="min-w-0 flex-1 border-0 bg-transparent font-display text-5xl font-bold text-ink focus:ring-0 sm:text-6xl"
                  aria-label="Tip amount"
                />
                <span className="text-lg font-black text-graphite">{token}</span>
              </div>
              <p id="tip-wallet-balance" className="mt-2 text-sm font-black text-graphite">
                {walletBalanceLabel}
              </p>
              {amountError ? (
                <p id="tip-amount-error" className="mt-2 text-sm font-black text-bubblegum">
                  {amountError}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-black uppercase text-graphite">Name</span>
              <input
                value={senderName}
                onChange={(event) => setSenderName(event.target.value.slice(0, 32))}
                placeholder="Supporter"
                className="flat-input mt-2 w-full px-5 py-4 font-bold text-ink placeholder:text-silver"
              />
            </label>

            <label className="flex min-h-[180px] flex-1 flex-col">
              <span className="text-sm font-black uppercase text-graphite">Message</span>
              <textarea
                value={message}
                onChange={(event) => updateMessageDraft(event.target.value)}
                placeholder="Add a note"
                rows={4}
                className="flat-input mt-2 min-h-[160px] w-full flex-1 resize-none px-5 py-4 font-bold text-ink placeholder:text-silver"
              />
            </label>
          </div>

          {!isConnected ? (
            <div className="mt-7">
              <WalletButton label="Connect to tip" />
            </div>
          ) : null}

          {!FLICK_CONTRACT_ADDRESS ? (
            <p className="mt-5 rounded-xl border-2 border-sunshine bg-white px-4 py-3 text-sm font-bold text-ink">
              Add `NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS` after deploying FlickRegistry to enable real tips.
            </p>
          ) : null}

          <div className="mt-8">
            <button
              type="button"
              disabled={disabled || isTipBusy}
              onClick={handleTip}
              className="duo-button focus-ring inline-flex min-h-14 w-full items-center justify-center gap-2 px-5 py-4 text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTipBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : isTipSuccess ? (
                <Check className="h-5 w-5" aria-hidden />
              ) : null}
              {visibleTipButtonLabel}
            </button>
          </div>
        </GlassCard>

        <div className="grid w-full grid-cols-1 items-stretch gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <CreatorAvatar nickname={normalized} imageUrl={settings.avatarUrl || creator?.avatarUrl} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="line-clamp-1 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                      {settings.displayName || creator?.displayName || normalized}
                    </h1>
                    <BadgeCheck className="h-[1.5625rem] w-[1.5625rem] shrink-0 text-sky" aria-hidden />
                  </div>
                  <p className="mt-1 text-sm font-bold text-graphite">{displayProfileUrl(normalized)}</p>
                </div>
              </div>
              {isOwner ? (
                <Link
                  href="/dashboard"
                  className="sky-link-button focus-ring inline-flex min-h-12 shrink-0 items-center justify-center p-3 transition"
                  aria-label="Manage your Flick jar"
                  title="Manage your Flick jar"
                >
                  <ExternalLink className="h-[1.5625rem] w-[1.5625rem]" aria-hidden />
                </Link>
              ) : null}
            </div>

            <p className="mx-auto mt-6 max-w-xl text-center font-bold leading-7 text-graphite">
              {settings.bio || creator?.bio || "Send a quick note and a stablecoin tip in one tactile flick."}
            </p>
            <p className="mt-4 inline-flex rounded-xl bg-duo-light px-4 py-2 text-sm font-black uppercase text-duo">
              {settings.profileStatus || creator?.profileStatus || "Verified creator"}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
              <div className="rounded-xl bg-duo-light p-5 text-center">
                <p className="text-sm font-black uppercase text-graphite">USDC</p>
                <p className="mt-3 font-display text-5xl font-bold text-duo">
                  {formatTokenAmount(liveTipJar.totalUsdcTipsReceived)}
                </p>
              </div>
              <div className="rounded-xl border-2 border-cloud p-5 text-center">
                <p className="text-sm font-black uppercase text-graphite">EURC</p>
                <p className="mt-3 font-display text-5xl font-bold text-sky">
                  {formatTokenAmount(liveTipJar.totalEurcTipsReceived)}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="flex min-h-[320px] flex-1 flex-col p-6">
            <ActivityFeed items={liveTipJar.activity} align="center" className="flex h-full flex-1 flex-col" />
          </GlassCard>
        </div>
      </section>

      {tipNotice ? (
        <div className="fixed inset-x-4 top-24 z-50 mx-auto max-w-md" role="status" aria-live="polite">
          <div
            className={`flex items-start gap-3 rounded-2xl border-2 bg-white p-4 shadow-surface ${
              tipNotice.type === "success" ? "border-duo" : "border-bubblegum"
            }`}
          >
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                tipNotice.type === "success" ? "bg-duo-light text-duo" : "bg-white text-bubblegum"
              }`}
            >
              {tipNotice.type === "success" ? (
                <Check className="h-[1.5625rem] w-[1.5625rem]" aria-hidden />
              ) : (
                <X className="h-[1.5625rem] w-[1.5625rem]" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase text-ink">
                {tipNotice.type === "success" ? "Tip sent" : "Tip failed"}
              </p>
              <p className="mt-1 text-sm font-bold leading-5 text-graphite">{tipNotice.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setTipNotice(null)}
              className="focus-ring rounded-lg p-1 text-graphite transition hover:bg-cloud/60"
              aria-label="Dismiss notification"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </AppFrame>
  );
}
