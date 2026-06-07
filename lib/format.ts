import { formatUnits } from "viem";
import { FLICK_BASE_URL, NICKNAME_PATTERN, RESERVED_ROUTES } from "@/lib/constants";

export function normalizeNickname(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32);
}

export function validateNickname(value: string) {
  if (!NICKNAME_PATTERN.test(value)) {
    return "Use 3-32 lowercase letters, numbers, or underscores.";
  }

  if (RESERVED_ROUTES.has(value)) {
    return "That route is reserved.";
  }

  return null;
}

export function publicProfileUrl(nickname: string) {
  const base = FLICK_BASE_URL.replace(/\/$/, "");
  return `${base}/${nickname}`;
}

export function displayProfileUrl(nickname: string) {
  return `flick.to/${nickname}`;
}

export function compactAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenAmount(value?: bigint | string | number | null, decimals = 6) {
  if (value === undefined || value === null) return "0.00";
  const asNumber = typeof value === "bigint" ? Number(formatUnits(value, decimals)) : Number(value);
  return new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(asNumber) ? asNumber : 0);
}

export function sanitizeMessage(value: string) {
  return value.replace(/[<>]/g, "").trim().slice(0, 140);
}

export function initialsFor(nickname: string) {
  return nickname
    .replace(/^@/, "")
    .split(/[_\s-]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
