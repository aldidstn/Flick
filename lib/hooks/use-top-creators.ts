"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { TOP_CREATORS_BY_EURC, TOP_CREATORS_BY_USDC } from "@/lib/graphql";
import { GOLDSKY_GRAPHQL_URL } from "@/lib/constants";
import type { CreatorProfile } from "@/lib/types";

type TopCreatorsResult = {
  creators: CreatorProfile[];
};

function creatorTotal(creator: CreatorProfile) {
  return Number(creator.totalUsdcTipsReceived || 0) + Number(creator.totalEurcTipsReceived || 0);
}

export function useTopCreators(limit = 6) {
  const shouldQuery = Boolean(GOLDSKY_GRAPHQL_URL);
  const querySize = Math.max(limit * 2, 12);

  const usdcQuery = useQuery<TopCreatorsResult>(TOP_CREATORS_BY_USDC, {
    variables: { first: querySize },
    skip: !shouldQuery,
    fetchPolicy: "cache-and-network"
  });

  const eurcQuery = useQuery<TopCreatorsResult>(TOP_CREATORS_BY_EURC, {
    variables: { first: querySize },
    skip: !shouldQuery,
    fetchPolicy: "cache-and-network"
  });

  const creators = useMemo(() => {
    const byNickname = new Map<string, CreatorProfile>();

    for (const creator of [...(usdcQuery.data?.creators || []), ...(eurcQuery.data?.creators || [])]) {
      byNickname.set(creator.nickname.toLowerCase(), creator);
    }

    return Array.from(byNickname.values())
      .sort((a, b) => creatorTotal(b) - creatorTotal(a))
      .slice(0, limit);
  }, [eurcQuery.data?.creators, limit, usdcQuery.data?.creators]);

  return {
    creators,
    loading: usdcQuery.loading || eurcQuery.loading,
    error: usdcQuery.error || eurcQuery.error
  };
}
