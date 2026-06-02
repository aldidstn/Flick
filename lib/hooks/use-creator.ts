"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { CREATOR_BY_NICKNAME, CREATOR_BY_WALLET } from "@/lib/graphql";
import { FLICK_CONTRACT_ADDRESS, GOLDSKY_GRAPHQL_URL } from "@/lib/constants";
import { flickRegistryAbi } from "@/lib/abi";
import type { CreatorProfile } from "@/lib/types";

type CreatorByNicknameResult = {
  creatorClaimeds: CreatorClaimEvent[];
};

type CreatorByWalletResult = {
  creatorClaimeds: CreatorClaimEvent[];
};

type CreatorClaimEvent = {
  id: string;
  creator: string;
  nickname: string;
  timestampParam?: string;
};

function eventToCreator(event: CreatorClaimEvent): CreatorProfile {
  return {
    id: event.creator.toLowerCase(),
    nickname: event.nickname.toLowerCase(),
    totalUsdcTipsReceived: "0",
    totalEurcTipsReceived: "0",
    createdAt: event.timestampParam || "0"
  };
}

export function useCreatorByNickname(nickname: string) {
  const normalized = nickname.toLowerCase();
  const shouldQuery = Boolean(GOLDSKY_GRAPHQL_URL);
  const query = useQuery<CreatorByNicknameResult>(CREATOR_BY_NICKNAME, {
    variables: { nickname: normalized },
    skip: !shouldQuery,
    fetchPolicy: "cache-and-network",
    pollInterval: 8_000
  });

  const contractRead = useReadContract({
    address: FLICK_CONTRACT_ADDRESS,
    abi: flickRegistryAbi,
    functionName: "creatorOf",
    args: [normalized],
    query: {
      enabled: Boolean(FLICK_CONTRACT_ADDRESS) && !query.data?.creatorClaimeds?.[0]
    }
  });

  const graphCreator = query.data?.creatorClaimeds?.[0];
  const contractOwner = contractRead.data && contractRead.data !== zeroAddress ? contractRead.data : undefined;

  const creator = useMemo<CreatorProfile | undefined>(() => {
    if (graphCreator) return eventToCreator(graphCreator);
    if (contractOwner) {
      return {
        id: contractOwner,
        nickname: normalized,
        totalUsdcTipsReceived: "0",
        totalEurcTipsReceived: "0",
        createdAt: "0"
      };
    }
    return undefined;
  }, [contractOwner, graphCreator, normalized]);

  return {
    creator,
    loading: query.loading || contractRead.isLoading,
    error: query.error || contractRead.error
  };
}

export function useCurrentCreator() {
  const { address } = useAccount();
  const creator = address?.toLowerCase();
  const shouldQuery = Boolean(GOLDSKY_GRAPHQL_URL && creator);
  const query = useQuery<CreatorByWalletResult>(CREATOR_BY_WALLET, {
    variables: { creator },
    skip: !shouldQuery,
    fetchPolicy: "cache-and-network",
    pollInterval: 8_000
  });

  const contractRead = useReadContract({
    address: FLICK_CONTRACT_ADDRESS,
    abi: flickRegistryAbi,
    functionName: "nicknameOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(FLICK_CONTRACT_ADDRESS && address)
    }
  });

  const graphCreator = query.data?.creatorClaimeds?.[0];
  const nickname = contractRead.data || graphCreator?.nickname;
  const profile = graphCreator ? eventToCreator(graphCreator) : (address && nickname
    ? {
        id: address,
        nickname: nickname.toLowerCase(),
        totalUsdcTipsReceived: "0",
        totalEurcTipsReceived: "0",
        createdAt: "0"
      }
    : undefined);

  return {
    profile,
    loading: query.loading || contractRead.isLoading,
    error: query.error || contractRead.error
  };
}
