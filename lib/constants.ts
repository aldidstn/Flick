import type { Address } from "viem";

export const ARC_TESTNET = {
  id: 5042002,
  name: "Arc Testnet",
  rpcHttp: "https://rpc.testnet.arc.network",
  rpcWs: "wss://rpc.testnet.arc.network",
  explorer: "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  }
} as const;

export const TOKEN_ADDRESSES = {
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x3600000000000000000000000000000000000000") as Address,
  EURC: (process.env.NEXT_PUBLIC_EURC_ADDRESS ||
    "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a") as Address
} as const;

export const TOKEN_META = {
  USDC: { symbol: "USDC", label: "Dollar tips", decimals: 6 },
  EURC: { symbol: "EURC", label: "Euro tips", decimals: 6 }
} as const;

export type FlickToken = keyof typeof TOKEN_META;

export const FLICK_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS as Address | undefined;

export const FLICK_DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_FLICK_DEPLOY_BLOCK || "0");

export const FLICK_BASE_URL = process.env.NEXT_PUBLIC_FLICK_BASE_URL || "http://localhost:3000";

export const GOLDSKY_GRAPHQL_URL = process.env.NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL || "";

export const NICKNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const RESERVED_ROUTES = new Set(["claim", "dashboard", "api", "settings", "admin", "loading"]);
