"use client";

import { useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import { BaseError, ContractFunctionRevertedError, maxUint256, parseUnits } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { erc20Abi, flickRegistryAbi } from "@/lib/abi";
import { FLICK_CONTRACT_ADDRESS, TOKEN_ADDRESSES, type FlickToken } from "@/lib/constants";
import { sanitizeMessage } from "@/lib/format";
import { wagmiConfig } from "@/lib/wagmi-config";
import type { CreatorProfileSettings } from "@/lib/types";

type TransactionState = "idle" | "approving" | "confirming" | "success" | "error";

function friendlyContractError(error: unknown) {
  if (error instanceof BaseError) {
    const details = `${error.shortMessage || ""} ${error.message || ""}`.toLowerCase();
    if (details.includes("user rejected") || details.includes("rejected the request")) {
      return new Error("Tip confirmation was rejected.");
    }

    const revertError = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const name = revertError.data?.errorName;
      if (name === "CreatorAlreadyClaimed") return new Error("This wallet already claimed a Flick nickname.");
      if (name === "ReservedNickname") return new Error("That nickname is reserved.");
      if (name === "NicknameTaken") return new Error("That nickname is already claimed.");
      if (name === "InvalidNickname") return new Error("Use 3-32 lowercase letters, numbers, or underscores.");
      if (name === "CreatorNotFound") return new Error("Creator not found.");
      if (name === "EmptyAmount") return new Error("Enter an amount greater than zero.");
      if (name === "SenderNameTooLong") return new Error("Sender name must be 32 characters or fewer.");
      if (name === "MessageTooLong") return new Error("Message must be 140 characters or fewer.");
      if (name === "ProfileFieldTooLong") return new Error("One or more profile fields are too long.");
      if (name === "TransferFailed") return new Error("Token transfer failed.");
    }
  }

  if (error instanceof Error) {
    const details = error.message.toLowerCase();
    if (details.includes("user rejected") || details.includes("rejected the request")) {
      return new Error("Tip confirmation was rejected.");
    }
    if (details.includes("insufficient funds")) {
      return new Error("Not enough funds for this transaction.");
    }
  }

  return error;
}

export function useClaimNickname() {
  const writer = useWriteContract();
  const [state, setState] = useState<TransactionState>("idle");
  const [hash, setHash] = useState<Hash | undefined>();

  async function claim(nickname: string) {
    if (!FLICK_CONTRACT_ADDRESS) throw new Error("Missing NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS.");

    setState("confirming");
    try {
      const txHash = await writer.writeContractAsync({
        address: FLICK_CONTRACT_ADDRESS,
        abi: flickRegistryAbi,
        functionName: "claimNickname",
        args: [nickname]
      });
      setHash(txHash);
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      setState("success");
      return txHash;
    } catch (error) {
      setState("error");
      throw friendlyContractError(error);
    }
  }

  return { claim, state, hash, isPending: writer.isPending };
}

export function useUpdateProfile() {
  const writer = useWriteContract();
  const [state, setState] = useState<TransactionState>("idle");
  const [hash, setHash] = useState<Hash | undefined>();

  async function updateProfile(settings: CreatorProfileSettings) {
    if (!FLICK_CONTRACT_ADDRESS) throw new Error("Missing NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS.");

    setState("confirming");
    try {
      const txHash = await writer.writeContractAsync({
        address: FLICK_CONTRACT_ADDRESS,
        abi: flickRegistryAbi,
        functionName: "updateProfile",
        args: [
          settings.displayName.trim().slice(0, 48),
          settings.bio.trim().slice(0, 160),
          settings.avatarUrl.trim().slice(0, 512),
          settings.profileStatus.trim().slice(0, 48)
        ]
      });
      setHash(txHash);
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      setState("success");
      return txHash;
    } catch (error) {
      setState("error");
      throw friendlyContractError(error);
    }
  }

  return {
    updateProfile,
    reset: () => setState("idle"),
    state,
    hash,
    isPending: writer.isPending
  };
}

export function useSendTip(token: FlickToken, amount: string) {
  const { address } = useAccount();
  const writer = useWriteContract();
  const [state, setState] = useState<TransactionState>("idle");
  const [hash, setHash] = useState<Hash | undefined>();
  const parsedAmount = useMemo(() => {
    try {
      return parseUnits(amount || "0", 6);
    } catch {
      return 0n;
    }
  }, [amount]);

  const tokenAddress = TOKEN_ADDRESSES[token] as Address;

  const allowance = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && FLICK_CONTRACT_ADDRESS ? [address, FLICK_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: Boolean(address && FLICK_CONTRACT_ADDRESS && parsedAmount > 0n)
    }
  });

  async function sendTip(nickname: string, senderName: string, message: string) {
    if (!FLICK_CONTRACT_ADDRESS) throw new Error("Missing NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS.");
    if (!address) throw new Error("Connect a wallet first.");
    if (parsedAmount <= 0n) throw new Error("Enter a tip amount.");

    const needsApproval = (allowance.data || 0n) < parsedAmount;

    try {
      if (needsApproval) {
        setState("approving");
        const approvalHash = await writer.writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [FLICK_CONTRACT_ADDRESS, maxUint256]
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash });
      }

      setState("confirming");
      const txHash = await writer.writeContractAsync({
        address: FLICK_CONTRACT_ADDRESS,
        abi: flickRegistryAbi,
        functionName: token === "USDC" ? "tipUSDC" : "tipEURC",
        args: [nickname, parsedAmount, senderName.trim().slice(0, 32), sanitizeMessage(message)]
      });
      setHash(txHash);
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
      setState("success");
      return txHash;
    } catch (error) {
      setState("error");
      throw friendlyContractError(error);
    }
  }

  return {
    sendTip,
    reset: () => setState("idle"),
    state,
    hash,
    allowance: allowance.data,
    needsApproval: (allowance.data || 0n) < parsedAmount,
    isPending: writer.isPending || allowance.isLoading
  };
}
