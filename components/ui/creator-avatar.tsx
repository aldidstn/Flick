"use client";

import { useEffect, useState } from "react";
import { initialsFor } from "@/lib/format";

export function CreatorAvatar({
  nickname,
  imageUrl,
  size = "lg"
}: {
  nickname: string;
  imageUrl?: string;
  size?: "md" | "lg";
}) {
  const dimension = size === "lg" ? "h-24 w-24 text-4xl" : "h-12 w-12 text-base";
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl && !failed);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  return (
    <div
      className={`${dimension} grid shrink-0 place-items-center overflow-hidden rounded-[24px] border-2 border-cloud bg-duo-light font-display font-black text-duo`}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        initialsFor(nickname)
      )}
    </div>
  );
}
