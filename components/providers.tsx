"use client";

import { useMemo, type ReactNode } from "react";
import { ApolloProvider } from "@apollo/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { ARC_TESTNET } from "@/lib/constants";
import { makeApolloClient } from "@/lib/apollo";
import { wagmiConfig } from "@/lib/wagmi-config";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

const arcTestnet = {
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: ARC_TESTNET.nativeCurrency,
  rpcUrls: {
    default: { http: [ARC_TESTNET.rpcHttp], webSocket: [ARC_TESTNET.rpcWs] }
  },
  blockExplorers: {
    default: { name: "Arcscan", url: ARC_TESTNET.explorer }
  },
  testnet: true
} as const satisfies AppKitNetwork;

const networks = [arcTestnet] as [AppKitNetwork, ...AppKitNetwork[]];

const wagmiAdapter = projectId
  ? new WagmiAdapter({
      networks,
      projectId,
      ssr: true
    })
  : undefined;

if (projectId && wagmiAdapter) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata: {
      name: "Flick",
      description: "Receive tips in a flick.",
      url: process.env.NEXT_PUBLIC_FLICK_BASE_URL || "http://localhost:3000",
      icons: [`${process.env.NEXT_PUBLIC_FLICK_BASE_URL || "http://localhost:3000"}/ico.svg`]
    },
    features: {
      analytics: false,
      email: true,
      socials: ["google"]
    }
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);
  const apolloClient = useMemo(() => makeApolloClient(), []);

  return (
    <WagmiProvider config={(wagmiAdapter?.wagmiConfig || wagmiConfig) as never}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
