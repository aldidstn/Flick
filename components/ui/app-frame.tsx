"use client";

import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/ui/wallet-button";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-snow">
      <header className="mx-auto flex w-full max-w-[1140px] items-center justify-between gap-3 border-b-2 border-cloud px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex shrink-0 items-center rounded-xl">
          <Image src="/logo.svg" alt="Flick" width={118} height={40} priority className="h-10 w-auto" />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {isConnected ? (
            <Link
              href="/dashboard"
              className="focus-ring inline-flex min-h-11 shrink-0 items-center rounded-xl px-2 py-2 text-sm font-black uppercase text-sky transition hover:bg-sky/10 sm:px-4"
            >
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </Link>
          ) : null}
          <WalletButton />
        </nav>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t-2 border-cloud bg-white/70">
        <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-5 px-4 py-7 text-base font-bold text-graphite sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              built by{" "}
              <a
                href="https://x.com/x_marc0"
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded-md text-ink transition hover:text-duo"
              >
                @marcopl0
              </a>
            </span>
            <span aria-hidden>·</span>
            <span>
              powered by{" "}
              <a
                href="https://www.arc.io/"
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded-md text-ink transition hover:text-duo"
              >
                Arc Network
              </a>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://docs.arc.io/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-md text-graphite transition hover:text-duo"
            >
              docs
            </a>
            <a
              href="https://github.com/aldidstn"
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-md text-graphite transition hover:text-duo"
              aria-label="GitHub"
              title="GitHub"
            >
              <Github className="h-[1.875rem] w-[1.875rem]" aria-hidden />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
