export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_AUTH_TTL_MS = 5 * 60 * 1000;

export type AvatarUploadAuthorization = {
  address: `0x${string}`;
  nickname: string;
  pathname: string;
  issuedAt: number;
  signature: `0x${string}`;
};

export function avatarUploadMessage(payload: Omit<AvatarUploadAuthorization, "signature">) {
  return [
    "Authorize Flick avatar upload",
    `Wallet: ${payload.address.toLowerCase()}`,
    `Nickname: ${payload.nickname.toLowerCase()}`,
    `Pathname: ${payload.pathname}`,
    `Issued at: ${payload.issuedAt}`
  ].join("\n");
}
