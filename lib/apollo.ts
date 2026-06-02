"use client";

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  split
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { GOLDSKY_GRAPHQL_URL } from "@/lib/constants";

function wsUrlFor(url: string) {
  if (url.startsWith("https://")) return url.replace("https://", "wss://");
  if (url.startsWith("http://")) return url.replace("http://", "ws://");
  return url;
}

export function makeApolloClient() {
  if (!GOLDSKY_GRAPHQL_URL) {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty()
    });
  }

  const httpLink = new HttpLink({ uri: GOLDSKY_GRAPHQL_URL });

  if (typeof window === "undefined") {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: httpLink
    });
  }

  const wsLink = new GraphQLWsLink(
    createClient({
      url: wsUrlFor(GOLDSKY_GRAPHQL_URL),
      retryAttempts: 5
    })
  );

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    httpLink
  );

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: splitLink
  });
}
