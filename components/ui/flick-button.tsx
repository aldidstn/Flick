"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function FlickButton({
  disabled,
  label,
  pendingLabel,
  successLabel = "Sent",
  state,
  onConfirm
}: {
  disabled?: boolean;
  label: string;
  pendingLabel: string;
  successLabel?: string;
  state: "idle" | "approving" | "confirming" | "success" | "error";
  onConfirm: () => void;
}) {
  const trackRef = useRef<HTMLButtonElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);
  const progress = useTransform(x, [0, Math.max(trackWidth - 74, 1)], [0, 1]);
  const fillScale = useTransform(progress, [0, 1], [0.12, 1]);
  const isBusy = state === "approving" || state === "confirming";
  const isSuccess = state === "success";

  useEffect(() => {
    const element = trackRef.current;
    if (!element) return;

    const update = () => setTrackWidth(element.offsetWidth || 0);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={trackRef}
      type="button"
      disabled={disabled || isBusy || isSuccess}
      onClick={() => {
        if (!disabled && !isBusy && !isSuccess) onConfirm();
      }}
      className="focus-ring relative h-16 w-full overflow-hidden rounded-xl bg-duo-light text-left text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      <motion.span
        className="absolute inset-y-0 left-0 w-full origin-left rounded-xl bg-duo"
        style={{ scaleX: fillScale }}
      />
      <span className="absolute inset-0 grid place-items-center text-sm font-black uppercase text-white">
        {isBusy ? pendingLabel : isSuccess ? successLabel : label}
      </span>
      <motion.span
        drag={disabled || isBusy || isSuccess ? false : "x"}
        dragConstraints={{ left: 0, right: Math.max(trackWidth - 74, 0) }}
        dragElastic={0.03}
        style={{ x }}
        onDragEnd={(_, info) => {
          const threshold = Math.max(trackWidth * 0.45, 120);
          if (info.offset.x > threshold || info.velocity.x > 720) {
            onConfirm();
          }
          x.set(0);
        }}
        className="absolute left-2 top-2 grid h-12 w-12 place-items-center rounded-xl bg-white text-ink"
      >
        {isBusy ? (
          <Loader2 className="h-[1.5625rem] w-[1.5625rem] animate-spin" aria-hidden />
        ) : isSuccess ? (
          <Check className="h-[1.5625rem] w-[1.5625rem]" aria-hidden />
        ) : (
          <ArrowRight className="h-[1.5625rem] w-[1.5625rem]" aria-hidden />
        )}
      </motion.span>
    </button>
  );
}
