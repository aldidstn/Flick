"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { formatUnits } from "viem";
import { TOP_CREATOR_EVENTS } from "@/lib/graphql";
import { GOLDSKY_GRAPHQL_URL } from "@/lib/constants";
import type { CreatorProfile } from "@/lib/types";

type TopCreatorsResult = {
  creatorClaimeds: {
    id: string;
    creator: string;
    nickname: string;
    timestampParam?: string;
  }[];
  usdcTipSents: {
    id: string;
    creator: string;
    amount: string;
  }[];
  eurcTipSents: {
    id: string;
    creator: string;
    amount: string;
  }[];
  profileUpdateds: {
    id: string;
    creator: string;
    nickname: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    profileStatus?: string;
    timestampParam?: string;
  }[];
};

function creatorTotal(creator: CreatorProfile) {
  return Number(creator.totalUsdcTipsReceived || 0) + Number(creator.totalEurcTipsReceived || 0);
}

function normalizeAddress(value: string) {
  return value.toLowerCase();
}

function amountToNumber(value?: string) {
  if (!value) return 0;
  try {
    return Number(formatUnits(BigInt(value), 6));
  } catch {
    return Number(value) || 0;
  }
}

export function useTopCreators(limit = 6) {
  const shouldQuery = Boolean(GOLDSKY_GRAPHQL_URL);
  const query = useQuery<TopCreatorsResult>(TOP_CREATOR_EVENTS, {
    variables: { creatorLimit: 100, tipLimit: 500, profileLimit: 500 },
    skip: !shouldQuery,
    fetchPolicy: "cache-and-network",
    pollInterval: 12_000
  });

  const creators = useMemo(() => {
    const byNickname = new Map<string, CreatorProfile>();
    const usdcTotals = new Map<string, number>();
    const eurcTotals = new Map<string, number>();
    const profiles = new Map<string, TopCreatorsResult["profileUpdateds"][number]>();

    for (const tip of query.data?.usdcTipSents || []) {
      const creator = normalizeAddress(tip.creator);
      usdcTotals.set(creator, (usdcTotals.get(creator) || 0) + amountToNumber(tip.amount));
    }

    for (const tip of query.data?.eurcTipSents || []) {
      const creator = normalizeAddress(tip.creator);
      eurcTotals.set(creator, (eurcTotals.get(creator) || 0) + amountToNumber(tip.amount));
    }

    for (const profile of query.data?.profileUpdateds || []) {
      const nickname = profile.nickname.toLowerCase();
      if (!profiles.has(nickname)) profiles.set(nickname, profile);
    }

    for (const claim of query.data?.creatorClaimeds || []) {
      const creator = normalizeAddress(claim.creator);
      const nickname = claim.nickname.toLowerCase();
      const profile = profiles.get(nickname);
      byNickname.set(nickname, {
        id: creator,
        nickname,
        totalUsdcTipsReceived: String(usdcTotals.get(creator) || 0),
        totalEurcTipsReceived: String(eurcTotals.get(creator) || 0),
        createdAt: claim.timestampParam || "0",
        displayName: profile?.displayName,
        bio: profile?.bio,
        avatarUrl: profile?.avatarUrl,
        profileStatus: profile?.profileStatus
      });
    }

    return Array.from(byNickname.values())
      .sort((a, b) => creatorTotal(b) - creatorTotal(a))
      .slice(0, limit);
  }, [limit, query.data?.creatorClaimeds, query.data?.eurcTipSents, query.data?.profileUpdateds, query.data?.usdcTipSents]);

  return {
    creators,
    loading: query.loading,
    error: query.error
  };
}
