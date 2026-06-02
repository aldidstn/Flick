import { clsx } from "clsx";

type IllustrationProps = {
  className?: string;
  tone?: "hero" | "claim" | "tip" | "dashboard";
};

export function FlickCharacter({ className, tone = "hero" }: IllustrationProps) {
  const isClaim = tone === "claim";
  const isTip = tone === "tip";
  const isDashboard = tone === "dashboard";

  return (
    <svg
      viewBox="0 0 520 440"
      className={clsx("h-auto w-full", className)}
      role="img"
      aria-label="Playful Flick payment illustration"
    >
      <defs>
        <linearGradient id={`coin-glow-${tone}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffc700" />
          <stop offset="1" stopColor="#58cc02" />
        </linearGradient>
      </defs>
      <path
        d="M63 254c-26-68 12-147 92-183 78-36 180-17 235 43 54 59 73 151 29 219-43 66-147 99-238 78-75-17-99-87-118-157Z"
        fill="#d7ffb8"
      />
      <path
        d="M344 74c45 19 83 57 94 107 10 46-13 79-55 96-43 18-97 17-131-16-37-36-44-100-15-144 23-35 65-61 107-43Z"
        fill="#a570ff"
        opacity="0.18"
      />
      <g transform="translate(88 78)">
        <rect x="106" y="40" width="164" height="244" rx="34" fill="#3c3c3c" />
        <rect x="122" y="62" width="132" height="200" rx="24" fill="#ffffff" />
        <rect x="143" y="88" width="91" height="16" rx="8" fill="#e5e5e5" />
        <rect x="143" y="122" width="91" height="54" rx="18" fill={isDashboard ? "#1cb0f6" : "#58cc02"} />
        <path d="M163 149h52" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
        <rect x="143" y="194" width="42" height="42" rx="14" fill="#ffc700" />
        <rect x="193" y="194" width="42" height="42" rx="14" fill="#d7ffb8" />
      </g>
      <g transform="translate(40 180)">
        <circle cx="86" cy="86" r="72" fill={isClaim ? "#1cb0f6" : "#58cc02"} />
        <circle cx="62" cy="70" r="8" fill="#3c3c3c" />
        <circle cx="108" cy="70" r="8" fill="#3c3c3c" />
        <path d="M62 103c15 18 42 18 58 0" fill="none" stroke="#3c3c3c" strokeWidth="9" strokeLinecap="round" />
        <path d="M17 160c25-26 111-28 137 0" fill="#ffc700" />
        <path d="M35 36c13-26 43-42 73-34 27 7 45 29 50 55-33-17-84-21-123-21Z" fill="#cc348d" />
      </g>
      <g transform="translate(335 206)">
        <circle cx="68" cy="68" r="58" fill={`url(#coin-glow-${tone})`} />
        <circle cx="68" cy="68" r="41" fill="#ffffff" opacity="0.92" />
        <path
          d={isTip ? "M48 67l14 15 30-33" : isClaim ? "M44 70h48M68 46v48" : "M47 69h42M52 89h32"}
          fill="none"
          stroke={isTip || isClaim ? "#58cc02" : "#1cb0f6"}
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path d="M82 372c62 34 272 37 354 0" stroke="#e5e5e5" strokeWidth="16" strokeLinecap="round" />
      <circle cx="82" cy="113" r="18" fill="#ffc700" />
      <circle cx="445" cy="135" r="14" fill="#cc348d" />
      <circle cx="438" cy="330" r="18" fill="#1cb0f6" />
    </svg>
  );
}

export function TokenConfetti({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 80" className={clsx("h-auto w-full", className)} aria-hidden>
      <circle cx="34" cy="42" r="24" fill="#ffc700" />
      <path d="M25 42h18M34 31v22" stroke="#3c3c3c" strokeWidth="6" strokeLinecap="round" />
      <circle cx="108" cy="37" r="30" fill="#58cc02" />
      <path d="M94 37h28" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="183" cy="43" r="24" fill="#1cb0f6" />
      <path d="M173 36h23M173 48h18" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
