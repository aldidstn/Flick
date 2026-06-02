"use client";

import { clsx } from "clsx";
import { CircleDollarSign, Euro } from "lucide-react";
import type { FlickToken } from "@/lib/constants";
import { TOKEN_META } from "@/lib/constants";

const tokenIcons = {
  USDC: CircleDollarSign,
  EURC: Euro
};

export function TokenToggle({
  value,
  onChange
}: {
  value: FlickToken;
  onChange: (value: FlickToken) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border-2 border-cloud bg-white p-1.5">
      {(Object.keys(TOKEN_META) as FlickToken[]).map((token) => {
        const Icon = tokenIcons[token];
        return (
          <button
            key={token}
            type="button"
            onClick={() => onChange(token)}
            aria-pressed={value === token}
            className={clsx(
              "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold transition",
              value === token ? "bg-duo-light text-ink " : "text-graphite hover:bg-cloud/40"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {token}
          </button>
        );
      })}
    </div>
  );
}
