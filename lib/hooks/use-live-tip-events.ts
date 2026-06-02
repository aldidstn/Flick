"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { usePublicClient, useReadContracts, useWatchContractEvent } from "wagmi";
import { flickRegistryAbi } from "@/lib/abi";
import { FLICK_CONTRACT_ADDRESS, FLICK_DEPLOY_BLOCK, type FlickToken } from "@/lib/constants";
import type { ActivityItem } from "@/lib/types";

type LiveTip = ActivityItem & {
  amountNumber: number;
};

type TokenTotals = Record<FlickToken, number>;
type PersistedTipLog = {
  transactionHash: string;
  logIndex: number;
  args: {
    creator?: Address;
    sender?: Address;
    nickname?: string;
    amount?: bigint;
    senderName?: string;
    message?: string;
    timestamp?: bigint;
  };
};

function toNumber(value?: string | number | null) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeAddress(value?: string | null) {
  return value?.toLowerCase();
}

function toActivityTip({
  id,
  token,
  senderAddress,
  senderName,
  amount,
  message,
  timestamp
}: {
  id: string;
  token: FlickToken;
  senderAddress?: Address;
  senderName?: string;
  amount?: bigint;
  message?: string;
  timestamp?: bigint;
}): LiveTip | undefined {
  if (!amount || amount <= 0n) return undefined;

  const amountString = formatUnits(amount, 6);
  return {
    id,
    token,
    senderAddress: senderAddress || "0x0000000000000000000000000000000000000000",
    senderName,
    amount: amountString,
    amountNumber: toNumber(amountString),
    message,
    timestamp: Number(timestamp || BigInt(Math.floor(Date.now() / 1000)))
  };
}

function mergeActivity(...groups: ActivityItem[][]) {
  const byId = new Map<string, ActivityItem>();
  for (const group of groups) {
    for (const item of group) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  }
  return Array.from(byId.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 12);
}

function activityTotal(items: ActivityItem[], token: FlickToken) {
  return items
    .filter((item) => item.token === token)
    .reduce((total, item) => total + toNumber(item.amount), 0);
}

function isExternalSupport(item: ActivityItem, creatorAddress?: string) {
  if (!creatorAddress) return true;
  return normalizeAddress(item.senderAddress) !== creatorAddress;
}

export function useLiveTipEvents({
  nickname,
  creatorId,
  indexedActivity,
  usdcTotal,
  eurcTotal
}: {
  nickname: string;
  creatorId?: string;
  indexedActivity: ActivityItem[];
  usdcTotal?: string | null;
  eurcTotal?: string | null;
}) {
  const [liveTips, setLiveTips] = useState<LiveTip[]>([]);
  const [historicalTips, setHistoricalTips] = useState<LiveTip[]>([]);
  const normalizedNickname = nickname.toLowerCase();
  const normalizedCreatorId = normalizeAddress(creatorId);
  const creatorAddress = normalizedCreatorId as Address | undefined;
  const canMatchTips = Boolean(normalizedNickname || normalizedCreatorId);
  const publicClient = usePublicClient();
  const graphTotals = useMemo<TokenTotals>(
    () => ({
      USDC: toNumber(usdcTotal),
      EURC: toNumber(eurcTotal)
    }),
    [eurcTotal, usdcTotal]
  );
  const contractTotals = useReadContracts({
    contracts: FLICK_CONTRACT_ADDRESS && creatorAddress
      ? [
          {
            address: FLICK_CONTRACT_ADDRESS,
            abi: flickRegistryAbi,
            functionName: "totalUsdcTipsReceived",
            args: [creatorAddress]
          },
          {
            address: FLICK_CONTRACT_ADDRESS,
            abi: flickRegistryAbi,
            functionName: "totalEurcTipsReceived",
            args: [creatorAddress]
          }
        ]
      : [],
    query: {
      enabled: Boolean(FLICK_CONTRACT_ADDRESS && creatorAddress),
      refetchInterval: 8_000
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function loadHistoricalTips() {
      if (!publicClient || !FLICK_CONTRACT_ADDRESS || !creatorAddress) {
        setHistoricalTips([]);
        return;
      }

      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = FLICK_DEPLOY_BLOCK > latestBlock ? latestBlock : FLICK_DEPLOY_BLOCK;
        const step = 50_000n;
        const tips: LiveTip[] = [];

        for (let start = fromBlock; start <= latestBlock; start += step + 1n) {
          const end = start + step > latestBlock ? latestBlock : start + step;
          const [usdcLogs, eurcLogs] = await Promise.all([
            publicClient.getLogs({
              address: FLICK_CONTRACT_ADDRESS,
              abi: flickRegistryAbi,
              eventName: "UsdcTipSent",
              args: { creator: creatorAddress },
              fromBlock: start,
              toBlock: end
            } as never),
            publicClient.getLogs({
              address: FLICK_CONTRACT_ADDRESS,
              abi: flickRegistryAbi,
              eventName: "EurcTipSent",
              args: { creator: creatorAddress },
              fromBlock: start,
              toBlock: end
            } as never)
          ]);

          for (const log of usdcLogs as unknown as PersistedTipLog[]) {
            const tip = toActivityTip({
              id: `${log.transactionHash}-${log.logIndex}`,
              token: "USDC",
              senderAddress: log.args.sender,
              senderName: log.args.senderName,
              amount: log.args.amount,
              message: log.args.message,
              timestamp: log.args.timestamp
            });
            if (tip) tips.push(tip);
          }

          for (const log of eurcLogs as unknown as PersistedTipLog[]) {
            const tip = toActivityTip({
              id: `${log.transactionHash}-${log.logIndex}`,
              token: "EURC",
              senderAddress: log.args.sender,
              senderName: log.args.senderName,
              amount: log.args.amount,
              message: log.args.message,
              timestamp: log.args.timestamp
            });
            if (tip) tips.push(tip);
          }
        }

        if (!cancelled) {
          setHistoricalTips(mergeActivity(tips) as LiveTip[]);
        }
      } catch {
        if (!cancelled) {
          setHistoricalTips([]);
        }
      }
    }

    loadHistoricalTips();
    const interval = window.setInterval(loadHistoricalTips, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [creatorAddress, publicClient]);

  const receiveLiveTip = useCallback(
    ({
      id,
      token,
      creator,
      senderAddress,
      senderName,
      nickname: eventNickname,
      amount,
      message,
      timestamp
    }: {
      id: string;
      token: FlickToken;
      creator?: Address;
      senderAddress?: Address;
      senderName?: string;
      nickname?: string;
      amount?: bigint;
      message?: string;
      timestamp?: bigint;
    }) => {
      const eventCreator = normalizeAddress(creator);
      const matchesNickname = eventNickname?.toLowerCase() === normalizedNickname;
      const matchesCreator = Boolean(eventCreator && normalizedCreatorId && eventCreator === normalizedCreatorId);

      if (!matchesNickname && !matchesCreator) return;

      setLiveTips((current) => {
        if (current.some((tip) => tip.id === id)) return current;
        const tip = toActivityTip({ id, token, senderAddress, senderName, amount, message, timestamp });
        return tip ? [tip, ...current].slice(0, 12) : current;
      });
    },
    [normalizedCreatorId, normalizedNickname]
  );

  useWatchContractEvent({
    address: FLICK_CONTRACT_ADDRESS,
    abi: flickRegistryAbi,
    eventName: "UsdcTipSent",
    enabled: Boolean(FLICK_CONTRACT_ADDRESS && canMatchTips),
    onLogs: (logs) => {
      for (const log of logs) {
        receiveLiveTip({
          id: `${log.transactionHash}-${log.logIndex}`,
          token: "USDC",
          creator: log.args.creator,
          senderAddress: log.args.sender,
          senderName: log.args.senderName,
          nickname: log.args.nickname,
          amount: log.args.amount,
          message: log.args.message,
          timestamp: log.args.timestamp
        });
      }
    }
  });

  useWatchContractEvent({
    address: FLICK_CONTRACT_ADDRESS,
    abi: flickRegistryAbi,
    eventName: "EurcTipSent",
    enabled: Boolean(FLICK_CONTRACT_ADDRESS && canMatchTips),
    onLogs: (logs) => {
      for (const log of logs) {
        receiveLiveTip({
          id: `${log.transactionHash}-${log.logIndex}`,
          token: "EURC",
          creator: log.args.creator,
          senderAddress: log.args.sender,
          senderName: log.args.senderName,
          nickname: log.args.nickname,
          amount: log.args.amount,
          message: log.args.message,
          timestamp: log.args.timestamp
        });
      }
    }
  });

  const activity = useMemo(
    () =>
      mergeActivity(liveTips, historicalTips, indexedActivity).filter((item) =>
        isExternalSupport(item, normalizedCreatorId)
      ),
    [historicalTips, indexedActivity, liveTips, normalizedCreatorId]
  );

  const contractUsdc = contractTotals.data?.[0]?.result ? toNumber(formatUnits(contractTotals.data[0].result, 6)) : 0;
  const contractEurc = contractTotals.data?.[1]?.result ? toNumber(formatUnits(contractTotals.data[1].result, 6)) : 0;
  const historicalUsdc = activityTotal(activity, "USDC");
  const historicalEurc = activityTotal(activity, "EURC");

  return {
    activity,
    totalUsdcTipsReceived: Math.max(graphTotals.USDC, contractUsdc, historicalUsdc),
    totalEurcTipsReceived: Math.max(graphTotals.EURC, contractEurc, historicalEurc)
  };
}
