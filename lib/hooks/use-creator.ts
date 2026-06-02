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
  creators: CreatorProfile[];
};

type CreatorByWalletResult = {
  creator: CreatorProfile | null;
};

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
      enabled: Boolean(FLICK_CONTRACT_ADDRESS) && !query.data?.creators?.[0]
    }
  });

  const graphCreator = query.data?.creators?.[0];
  const contractOwner = contractRead.data && contractRead.data !== zeroAddress ? contractRead.data : undefined;

  const creator = useMemo<CreatorProfile | undefined>(() => {
    if (graphCreator) return graphCreator;
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
  const id = address?.toLowerCase();
  const shouldQuery = Boolean(GOLDSKY_GRAPHQL_URL && id);
  const query = useQuery<CreatorByWalletResult>(CREATOR_BY_WALLET, {
    variables: { id },
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

  const nickname = contractRead.data || query.data?.creator?.nickname;
  const profile = query.data?.creator || (address && nickname
    ? {
        id: address,
        nickname,
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
