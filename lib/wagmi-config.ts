"use client";

import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { ARC_TESTNET } from "@/lib/constants";

export const arcTestnetChain = defineChain({
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: ARC_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [ARC_TESTNET.rpcHttp],
      webSocket: [ARC_TESTNET.rpcWs]
    }
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: ARC_TESTNET.explorer
    }
  },
  testnet: true
});

export const wagmiConfig = createConfig({
  chains: [arcTestnetChain],
  transports: {
    [arcTestnetChain.id]: http(ARC_TESTNET.rpcHttp)
  },
  ssr: true
});
