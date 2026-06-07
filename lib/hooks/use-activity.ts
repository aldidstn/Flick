"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { formatUnits } from "viem";
import { GOLDSKY_GRAPHQL_URL } from "@/lib/constants";
import { RECENT_TIPS } from "@/lib/graphql";
import type { ActivityItem } from "@/lib/types";

type RawTip = {
  id: string;
  senderName?: string | null;
  amountUSDC?: string;
  amountEURC?: string;
  amount?: string;
  message?: string | null;
  timestamp?: string;
  timestampParam?: string;
};

type RecentTipsResult = {
  usdcTips: RawTip[];
  eurcTips: RawTip[];
};

function normalizeIndexedAmount(tip: RawTip, decimalAmount?: string) {
  if (decimalAmount) return decimalAmount;
  if (!tip.amount) return "0";
  try {
    return formatUnits(BigInt(tip.amount), 6);
  } catch {
    return tip.amount;
  }
}

function normalizeIndexedTimestamp(tip: RawTip) {
  return Number(tip.timestampParam || tip.timestamp || 0);
}

export function mergeTips(data?: RecentTipsResult): ActivityItem[] {
  const usdc = data?.usdcTips.map((tip) => ({
    id: tip.id,
    token: "USDC" as const,
    senderAddress: "0x0000000000000000000000000000000000000000",
    senderName: tip.senderName,
    amount: normalizeIndexedAmount(tip, tip.amountUSDC),
    message: tip.message,
    timestamp: normalizeIndexedTimestamp(tip)
  })) || [];

  const eurc = data?.eurcTips.map((tip) => ({
    id: tip.id,
    token: "EURC" as const,
    senderAddress: "0x0000000000000000000000000000000000000000",
    senderName: tip.senderName,
    amount: normalizeIndexedAmount(tip, tip.amountEURC),
    message: tip.message,
    timestamp: normalizeIndexedTimestamp(tip)
  })) || [];

  return [...usdc, ...eurc].sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
}

export function useActivity(creatorId?: string) {
  const shouldQuery = Boolean(GOLDSKY_GRAPHQL_URL && creatorId);
  const query = useQuery<RecentTipsResult>(RECENT_TIPS, {
    variables: { creator: creatorId?.toLowerCase() },
    skip: !shouldQuery,
    fetchPolicy: "cache-and-network",
    pollInterval: 8_000
  });

  const activity = useMemo(() => mergeTips(query.data), [query.data]);

  return {
    activity,
    loading: query.loading,
    error: query.error
  };
}
