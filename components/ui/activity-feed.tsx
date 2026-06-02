import { Clock3 } from "lucide-react";
import type { ActivityItem } from "@/lib/types";
import { compactAddress, formatTokenAmount } from "@/lib/format";

function relativeTime(timestamp: number) {
  const seconds = Math.max(1, Math.floor(Date.now() / 1000 - timestamp));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed({
  items,
  align = "start",
  limit = 5,
  className = ""
}: {
  items: ActivityItem[];
  align?: "start" | "center";
  limit?: number;
  className?: string;
}) {
  const isCentered = align === "center";
  const latestItems = items.slice(0, limit);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className={`flex items-center ${isCentered ? "justify-center gap-3 text-center" : "justify-between"}`}>
        <h3 className="text-sm font-black uppercase text-ink">Recent support</h3>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-graphite">
          <Clock3 className="h-[1.09375rem] w-[1.09375rem]" aria-hidden />
          Live
        </span>
      </div>

      <div className="flex-1 space-y-2">
        {latestItems.length === 0 ? (
          <div className={`rounded-xl border-2 border-cloud bg-white px-4 py-5 text-sm font-bold text-graphite ${isCentered ? "text-center" : ""}`}>
            No tips to show yet.
          </div>
        ) : null}
        {latestItems.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border-2 border-cloud bg-white px-4 py-3"
          >
            <div className={`flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between ${isCentered ? "items-center text-center min-[420px]:text-left" : ""}`}>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-ink">
                  {item.senderName || compactAddress(item.senderAddress)}
                </p>
                {item.message ? (
                  <p className="mt-1 text-sm font-bold leading-5 text-graphite">{item.message}</p>
                ) : null}
              </div>
              <div className={`shrink-0 ${isCentered ? "text-center min-[420px]:text-right" : "text-left min-[420px]:text-right"}`}>
                <p className="whitespace-nowrap text-sm font-black text-ink">
                  {formatTokenAmount(item.amount)} {item.token}
                </p>
                <p className="mt-1 text-xs font-bold text-graphite">{relativeTime(item.timestamp)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
