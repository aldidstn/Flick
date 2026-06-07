import { gql } from "@apollo/client";

export const CREATOR_BY_NICKNAME = gql`
  query CreatorByNickname($nickname: String!) {
    creatorClaimeds(where: { nickname: $nickname }, first: 1, orderBy: timestamp_, orderDirection: desc) {
      id
      creator
      nickname
      timestampParam
    }
  }
`;

export const CREATOR_BY_WALLET = gql`
  query CreatorByWallet($creator: String!) {
    creatorClaimeds(where: { creator: $creator }, first: 1, orderBy: timestamp_, orderDirection: desc) {
      id
      creator
      nickname
      timestampParam
    }
  }
`;

export const TOP_CREATOR_EVENTS = gql`
  query TopCreatorEvents($creatorLimit: Int!, $tipLimit: Int!) {
    creatorClaimeds(first: $creatorLimit, orderBy: timestamp_, orderDirection: desc) {
      id
      creator
      nickname
      timestampParam
    }
    usdcTipSents(first: $tipLimit, orderBy: timestamp_, orderDirection: desc) {
      id
      creator
      amount
    }
    eurcTipSents(first: $tipLimit, orderBy: timestamp_, orderDirection: desc) {
      id
      creator
      amount
    }
  }
`;

export const RECENT_TIPS = gql`
  query RecentTips($creator: String!) {
    usdcTips: usdcTipSents(where: { creator: $creator }, first: 12, orderBy: timestamp_, orderDirection: desc) {
      id
      senderName
      amount
      message
      timestampParam
    }
    eurcTips: eurcTipSents(where: { creator: $creator }, first: 12, orderBy: timestamp_, orderDirection: desc) {
      id
      senderName
      amount
      message
      timestampParam
    }
  }
`;
