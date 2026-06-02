import { gql } from "@apollo/client";

export const CREATOR_BY_NICKNAME = gql`
  query CreatorByNickname($nickname: String!) {
    creators(where: { nickname: $nickname }, first: 1) {
      id
      nickname
      totalUsdcTipsReceived
      totalEurcTipsReceived
      createdAt
    }
  }
`;

export const CREATOR_BY_WALLET = gql`
  query CreatorByWallet($id: ID!) {
    creator(id: $id) {
      id
      nickname
      totalUsdcTipsReceived
      totalEurcTipsReceived
      createdAt
    }
  }
`;

export const TOP_CREATORS_BY_USDC = gql`
  query TopCreatorsByUsdc($first: Int!) {
    creators(first: $first, orderBy: totalUsdcTipsReceived, orderDirection: desc) {
      id
      nickname
      totalUsdcTipsReceived
      totalEurcTipsReceived
      createdAt
    }
  }
`;

export const TOP_CREATORS_BY_EURC = gql`
  query TopCreatorsByEurc($first: Int!) {
    creators(first: $first, orderBy: totalEurcTipsReceived, orderDirection: desc) {
      id
      nickname
      totalUsdcTipsReceived
      totalEurcTipsReceived
      createdAt
    }
  }
`;

export const RECENT_TIPS = gql`
  query RecentTips($creator: String!) {
    usdcTips: usdcTipSents(where: { creator: $creator }, first: 12, orderBy: timestamp_, orderDirection: desc) {
      id
      sender
      senderName
      amount
      message
      timestampParam
    }
    eurcTips: eurcTipSents(where: { creator: $creator }, first: 12, orderBy: timestamp_, orderDirection: desc) {
      id
      sender
      senderName
      amount
      message
      timestampParam
    }
  }
`;

export const TIP_ACTIVITY_SUBSCRIPTION = gql`
  subscription TipActivity($creator: String!) {
    usdcTips: usdcTipSents(where: { creator: $creator }, first: 12, orderBy: timestamp_, orderDirection: desc) {
      id
      sender
      senderName
      amount
      message
      timestampParam
    }
    eurcTips: eurcTipSents(where: { creator: $creator }, first: 12, orderBy: timestamp_, orderDirection: desc) {
      id
      sender
      senderName
      amount
      message
      timestampParam
    }
  }
`;
