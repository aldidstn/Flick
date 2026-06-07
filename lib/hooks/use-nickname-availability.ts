"use client";

import { useMemo } from "react";
import { zeroAddress } from "viem";
import { useReadContract } from "wagmi";
import { flickRegistryAbi } from "@/lib/abi";
import { FLICK_CONTRACT_ADDRESS } from "@/lib/constants";
import { validateNickname } from "@/lib/format";
import { useCreatorByNickname } from "@/lib/hooks/use-creator";

export function useNicknameAvailability(nickname: string) {
  const validationError = validateNickname(nickname);
  const graph = useCreatorByNickname(nickname);

  const contractRead = useReadContract({
    address: FLICK_CONTRACT_ADDRESS,
    abi: flickRegistryAbi,
    functionName: "creatorOf",
    args: [nickname],
    query: {
      enabled: Boolean(FLICK_CONTRACT_ADDRESS && nickname && !validationError)
    }
  });

  return useMemo(() => {
    if (!nickname) {
      return { available: false, message: "Choose your handle.", checking: false };
    }

    if (validationError) {
      return { available: false, message: validationError, checking: false };
    }

    const graphTaken = Boolean(graph.creator);
    const contractTaken = Boolean(contractRead.data && contractRead.data !== zeroAddress);

    if (graph.loading || contractRead.isLoading) {
      return { available: false, message: "Checking availability...", checking: true };
    }

    if (graphTaken || contractTaken) {
      return { available: false, message: "Nickname already used. Choose another one.", checking: false };
    }

    return { available: true, message: "Nickname available. Ready to claim.", checking: false };
  }, [contractRead.data, contractRead.isLoading, graph.creator, graph.loading, nickname, validationError]);
}
