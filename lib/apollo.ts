"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";

export function makeApolloClient() {
  if (typeof window === "undefined") {
    return new ApolloClient({
      cache: new InMemoryCache(),
      ssrMode: true,
      link: ApolloLink.empty()
    });
  }

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: "/api/graphql" })
  });
}
