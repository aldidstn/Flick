"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Wallet } from "lucide-react";
import { compactAddress } from "@/lib/format";
import { useCurrentNickname } from "@/lib/hooks/use-current-nickname";

export function WalletButton({ label = "Connect" }: { label?: string }) {
  if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) {
    return <MissingProjectButton label={label} />;
  }

  return <ConnectedWalletButton label={label} />;
}

function MissingProjectButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => alert("Add NEXT_PUBLIC_REOWN_PROJECT_ID to .env.local to enable Reown AppKit.")}
      className="duo-button focus-ring inline-flex min-h-12 max-w-[9rem] items-center justify-center gap-2 px-4 py-3 text-sm font-black uppercase transition sm:max-w-none sm:px-5"
      title={label}
    >
      <Wallet className="h-5 w-5" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function ConnectedWalletButton({ label }: { label: string }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { nickname } = useCurrentNickname();
  const connectedLabel = nickname || compactAddress(address);
  const buttonClassName = isConnected
    ? "focus-ring inline-flex min-h-12 max-w-[9rem] items-center justify-center gap-2 rounded-xl border-2 border-duo bg-white px-4 py-3 text-sm font-black uppercase text-duo transition hover:bg-duo-light sm:max-w-[14rem] sm:px-5"
    : "duo-button focus-ring inline-flex min-h-12 max-w-[9rem] items-center justify-center gap-2 px-4 py-3 text-sm font-black uppercase transition sm:max-w-[14rem] sm:px-5";

  return (
    <button
      type="button"
      onClick={() => open()}
      className={buttonClassName}
      title={isConnected ? connectedLabel : label}
    >
      <Wallet className="h-5 w-5" aria-hidden />
      <span className="min-w-0 truncate">{isConnected ? connectedLabel : label}</span>
    </button>
  );
}
