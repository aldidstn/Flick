import type { FlickToken } from "@/lib/constants";

export type CreatorProfile = {
  id: string;
  nickname: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  profileStatus?: string;
  totalUsdcTipsReceived: string;
  totalEurcTipsReceived: string;
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  token: FlickToken;
  senderAddress: string;
  senderName?: string | null;
  amount: string;
  message?: string | null;
  timestamp: number;
};

export type CreatorProfileSettings = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  profileStatus: string;
};
