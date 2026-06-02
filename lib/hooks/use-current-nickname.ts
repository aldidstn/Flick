"use client";

import { useAccount, useReadContract } from "wagmi";
import { flickRegistryAbi } from "@/lib/abi";
import { FLICK_CONTRACT_ADDRESS } from "@/lib/constants";

export function useCurrentNickname() {
  const { address, isConnected } = useAccount();

  const query = useReadContract({
    address: FLICK_CONTRACT_ADDRESS,
    abi: flickRegistryAbi,
    functionName: "nicknameOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && FLICK_CONTRACT_ADDRESS && address),
      staleTime: 60_000
    }
  });

  return {
    nickname: query.data || undefined,
    loading: query.isLoading || query.isFetching,
    checked: !isConnected || !FLICK_CONTRACT_ADDRESS || query.isFetched || Boolean(query.error),
    error: query.error
  };
}
