"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { uploadPresigned } from "@vercel/blob/client";
import { Copy, Download, ExternalLink, Loader2, QrCode, Save, Share2, WalletCards, X } from "lucide-react";
import { useAccount, useSignMessage } from "wagmi";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { AppFrame } from "@/components/ui/app-frame";
import { CreatorAvatar } from "@/components/ui/creator-avatar";
import { FlickCharacter } from "@/components/ui/flick-illustrations";
import { GlassCard } from "@/components/ui/glass-card";
import { WalletButton } from "@/components/ui/wallet-button";
import { AVATAR_CONTENT_TYPES, MAX_AVATAR_BYTES, avatarUploadMessage } from "@/lib/avatar-upload";
import type { FlickToken } from "@/lib/constants";
import { displayProfileUrl, formatTokenAmount, publicProfileUrl } from "@/lib/format";
import { useActivity } from "@/lib/hooks/use-activity";
import { useCurrentCreator } from "@/lib/hooks/use-creator";
import { useLiveTipEvents } from "@/lib/hooks/use-live-tip-events";
import { useUpdateProfile } from "@/lib/hooks/use-flick-transactions";
import { useProfileSettings } from "@/lib/hooks/use-profile-settings";
import type { CreatorProfileSettings } from "@/lib/types";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}.`));
    image.src = src;
  });
}

export function DashboardScreen() {
  const { address, isConnected } = useAccount();
  const signer = useSignMessage();
  const { profile, loading } = useCurrentCreator();
  const { activity: indexedActivity } = useActivity(profile?.id);
  const persistedTipData = useLiveTipEvents({
    nickname: profile?.nickname || "",
    creatorId: profile?.id,
    indexedActivity,
    usdcTotal: profile?.totalUsdcTipsReceived,
    eurcTotal: profile?.totalEurcTipsReceived
  });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [exportStatus, setExportStatus] = useState<"idle" | "exported" | "empty" | "error">("idle");
  const [incomeFilter, setIncomeFilter] = useState<"ALL" | FlickToken>("ALL");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSnapshot, setProfileSnapshot] = useState<CreatorProfileSettings | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const nickname = profile?.nickname || "";
  const shareUrl = useMemo(() => (nickname ? publicProfileUrl(nickname) : ""), [nickname]);
  const qrImageUrl = useMemo(
    () =>
      shareUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=12&data=${encodeURIComponent(shareUrl)}`
        : "",
    [shareUrl]
  );
  const profileSettings = useProfileSettings(profile?.nickname);
  const profileUpdate = useUpdateProfile();
  const filteredActivity = useMemo(
    () =>
      incomeFilter === "ALL"
        ? persistedTipData.activity
        : persistedTipData.activity.filter((item) => item.token === incomeFilter),
    [incomeFilter, persistedTipData.activity]
  );
  const displayedAmount = useMemo(
    () => filteredActivity.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [filteredActivity]
  );

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  function updateAvatarFile(file?: File) {
    if (!file) return;
    if (!AVATAR_CONTENT_TYPES.includes(file.type as (typeof AVATAR_CONTENT_TYPES)[number])) {
      setProfileSaveError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setProfileSaveError("Avatar image must be 2 MB or smaller.");
      return;
    }

    setProfileSaveError(null);
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  async function saveProfile() {
    if (!address || !nickname) throw new Error("Connect the wallet that owns this profile.");

    let avatarUrl = profileSettings.settings.avatarUrl;
    if (avatarFile) {
      const extension = avatarFile.type === "image/jpeg" ? "jpg" : avatarFile.type === "image/png" ? "png" : "webp";
      const pathname = `avatars/${nickname}/${Date.now()}.${extension}`;
      const issuedAt = Date.now();
      const unsigned = { address, nickname, pathname, issuedAt };
      const signature = await signer.signMessageAsync({ message: avatarUploadMessage(unsigned) });
      setAvatarUploadProgress(1);
      const blob = await uploadPresigned(pathname, avatarFile, {
        access: "public",
        handleUploadUrl: "/api/avatar/upload",
        clientPayload: JSON.stringify({ ...unsigned, signature }),
        contentType: avatarFile.type,
        onUploadProgress: ({ percentage }) => setAvatarUploadProgress(Math.max(1, Math.round(percentage)))
      });
      avatarUrl = blob.url;
    } else if (/^data:image\//i.test(avatarUrl)) {
      throw new Error("Choose your avatar image again so Flick can upload it permanently.");
    } else if (avatarUrl.length > 512) {
      throw new Error("Avatar URL is too long. Choose an image file instead.");
    }

    const next = { ...profileSettings.settings, avatarUrl };
    await profileUpdate.updateProfile(next);
    profileSettings.save(next);
    setAvatarFile(null);
    setAvatarPreviewUrl("");
    setAvatarUploadProgress(0);
    setProfileSaveError(null);
    void profileSettings.refetch();
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1800);
  }

  function exportIncomeCsv() {
    if (!nickname || filteredActivity.length === 0) {
      setExportStatus("empty");
      window.setTimeout(() => setExportStatus("idle"), 2200);
      return;
    }
    const rows = [
      ["timestamp", "token", "amount", "sender", "message"],
      ...filteredActivity.map((item) => [
        new Date(item.timestamp * 1000).toISOString(),
        item.token,
        item.amount,
        item.senderName || item.senderAddress,
        item.message || ""
      ])
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `flick-${nickname}-income.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setExportStatus("exported");
    } catch {
      setExportStatus("error");
    }
    window.setTimeout(() => setExportStatus("idle"), 2200);
  }

  async function shareQrCode() {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Flick tip jar",
          text: `Support ${nickname} on Flick.`,
          url: shareUrl
        });
      } else {
        await copyLink();
      }
    } catch {
      // User cancelled native share sheet.
    }
  }

  async function downloadQrCode() {
    if (!qrImageUrl || !nickname) return;
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const qrBitmap = await createImageBitmap(blob);
      const logoImage = await loadCanvasImage("/logo.svg");
      const displayName = profileSettings.settings.displayName || nickname;
      const canvas = document.createElement("canvas");
      const scale = 2;
      const width = 480;
      const height = 620;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create QR card.");

      ctx.scale(scale, scale);
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.shadowColor = "rgba(28, 38, 64, 0.42)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = "#3f4969";
      roundedRect(ctx, 30, 22, 420, 562, 28);
      ctx.fill();
      ctx.restore();

      const gradient = ctx.createLinearGradient(32, 24, 448, 582);
      gradient.addColorStop(0, "#bdf5df");
      gradient.addColorStop(0.34, "#f7fff0");
      gradient.addColorStop(0.67, "#fbfff3");
      gradient.addColorStop(1, "#bdf277");
      ctx.fillStyle = gradient;
      roundedRect(ctx, 36, 28, 408, 550, 24);
      ctx.fill();

      const glow = ctx.createRadialGradient(352, 396, 8, 352, 396, 260);
      glow.addColorStop(0, "rgba(88, 204, 2, 0.42)");
      glow.addColorStop(0.58, "rgba(255, 255, 255, 0.18)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      roundedRect(ctx, 36, 28, 408, 550, 24);
      ctx.fill();

      ctx.drawImage(logoImage, width / 2 - 88.5, 57, 177, 60);

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      roundedRect(ctx, 99, 137, 282, 282, 12);
      ctx.fill();
      ctx.drawImage(qrBitmap, 112, 150, 256, 256);

      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      roundedRect(ctx, 40, 440, 396, 130, 16);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#3aa600";
      ctx.font = "900 48px Arial Rounded MT Bold, Arial, sans-serif";
      const cardName = displayName.slice(0, 18);
      const nameWidth = ctx.measureText(cardName).width;
      if (nameWidth > 340) {
        ctx.font = `900 ${Math.max(34, Math.floor((340 / nameWidth) * 48))}px Arial Rounded MT Bold, Arial, sans-serif`;
      }
      ctx.fillText(cardName, width / 2, 495);

      ctx.fillStyle = "#777777";
      ctx.font = "900 17px Nunito Sans, Arial, sans-serif";
      ctx.fillText(displayProfileUrl(nickname), width / 2, 545);

      const url = await new Promise<string>((resolve, reject) => {
        canvas.toBlob((cardBlob) => {
          if (!cardBlob) {
            reject(new Error("Could not export QR card."));
            return;
          }
          resolve(URL.createObjectURL(cardBlob));
        }, "image/png");
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = `flick-${nickname}-qr-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <AppFrame>
      <section className="mx-auto w-full max-w-[1140px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {!isConnected ? (
          <GlassCard className="mx-auto grid max-w-4xl gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
            <FlickCharacter tone="dashboard" className="mx-auto max-w-md lg:max-w-none" />
            <div className="flex items-center">
              <div>
                <WalletCards className="h-[3.75rem] w-[3.75rem] text-duo" aria-hidden />
                <h1 className="mt-5 font-display text-5xl font-bold leading-tight text-duo sm:text-6xl">Creator dashboard</h1>
                <p className="mt-4 max-w-md text-lg font-bold leading-8 text-graphite">
                  Connect your Reown account to view tips, copy your jar, and tune your public profile.
                </p>
                <div className="mt-7">
                  <WalletButton label="Connect dashboard" />
                </div>
              </div>
            </div>
          </GlassCard>
        ) : loading ? (
          <div className="min-h-[50vh]" aria-busy="true" />
        ) : !profile ? (
          <GlassCard className="mx-auto flex w-full max-w-xl flex-col items-center p-6 text-center sm:p-8">
            <Image
              src="/nickname.webp"
              alt="Flick mascot ready to create a nickname"
              width={1024}
              height={1024}
              priority
              className="h-auto w-full max-w-[320px]"
            />
            <div className="mt-2 w-full">
              <h1 className="font-display text-5xl font-bold leading-tight text-duo sm:text-6xl">Create your nickname</h1>
              <p className="mx-auto mt-4 max-w-md text-lg font-bold leading-8 text-graphite">
                This wallet has not created a Flick nickname yet. Create it once, then your dashboard will unlock your tip page,
                income, and profile controls.
              </p>
              <Link
                href="/claim"
                className="duo-button focus-ring mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase transition"
              >
                Create nickname <ExternalLink className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </GlassCard>
        ) : (
          <div className="-mx-4 -mb-20 -mt-8 grid min-h-[calc(100vh-5.5rem)] bg-cloud/40 sm:-mx-6 lg:-mx-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
              <GlassCard className="p-6">
                <div className="space-y-6">
                  <p className="text-sm font-black uppercase text-graphite">Overview</p>
                  <div className="flex items-center gap-4 sm:justify-between">
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-duo-light sm:order-2 sm:h-32 sm:w-32 lg:h-36 lg:w-36">
                      {profileSettings.settings.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profileSettings.settings.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <WalletCards className="h-12 w-12 text-ink sm:h-20 sm:w-20" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 sm:order-1">
                      <h1 className="break-words font-display text-5xl font-bold leading-none text-duo sm:text-6xl lg:text-7xl">
                        {nickname}
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-graphite">{displayProfileUrl(nickname)}</p>
                        <span className="rounded-full border border-duo bg-duo-light px-3 py-1 text-xs font-black text-duo">
                          Nickname locked
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 min-[460px]:flex-row">
                    <Link
                      href={`/${nickname}`}
                      className="duo-button focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase transition min-[460px]:w-auto"
                    >
                      Open jar <ExternalLink className="h-5 w-5" aria-hidden />
                    </Link>
                  </div>
                  <p className="sr-only" aria-live="polite">
                    {copyStatus === "copied" ? "Public link copied." : copyStatus === "error" ? "Copy failed." : ""}
                  </p>
                </div>
              </GlassCard>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border-2 border-cloud border-t-sky bg-white p-6">
                  <p className="text-sm font-black uppercase text-graphite">USDC tips</p>
                  <p className="mt-4 font-display text-5xl font-bold text-duo sm:text-6xl">
                    {formatTokenAmount(persistedTipData.totalUsdcTipsReceived)}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-cloud border-t-sky bg-white p-6">
                  <p className="text-sm font-black uppercase text-graphite">EURC tips</p>
                  <p className="mt-4 font-display text-5xl font-bold text-sky sm:text-6xl">
                    {formatTokenAmount(persistedTipData.totalEurcTipsReceived)}
                  </p>
                </div>
              </div>

              <GlassCard className="p-6">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-graphite">Income manager</p>
                    <h2 className="mt-3 font-display text-4xl font-bold leading-none text-ink sm:text-5xl">
                      Review <span className="text-duo">Support</span>
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2 md:pb-0.5">
                    {(["ALL", "USDC", "EURC"] as const).map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setIncomeFilter(token)}
                        aria-pressed={incomeFilter === token}
                        className={`focus-ring min-h-11 rounded-xl px-4 py-2 text-xs font-black uppercase transition ${
                          incomeFilter === token ? "bg-duo text-white" : "border-2 border-cloud bg-white text-graphite"
                        }`}
                      >
                        {token}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={exportIncomeCsv}
                      className="sky-link-button focus-ring inline-flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-black uppercase transition"
                    >
                      <Download className="h-[1.09375rem] w-[1.09375rem]" aria-hidden />
                      CSV
                    </button>
                  </div>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border-2 border-cloud bg-cloud/40 p-4">
                    <p className="text-xs font-black uppercase text-graphite">Tips shown</p>
                    <p className="mt-3 font-display text-4xl font-bold text-ink">{filteredActivity.length}</p>
                  </div>
                  <div className="rounded-xl border-2 border-cloud bg-cloud/40 p-4">
                    <p className="text-xs font-black uppercase text-graphite">Displayed</p>
                    <p className="mt-3 font-display text-4xl font-bold text-ink">{displayedAmount.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl border-2 border-cloud bg-cloud/40 p-4">
                    <p className="text-xs font-black uppercase text-graphite">Settlement</p>
                    <p className="mt-3 text-sm font-black leading-6 text-duo">Direct to wallet</p>
                  </div>
                </div>

                <p className="sr-only" aria-live="polite">
                  {exportStatus === "exported"
                    ? "Income CSV exported."
                    : exportStatus === "empty"
                      ? "No filtered tips available to export."
                      : exportStatus === "error"
                        ? "Income CSV export failed."
                        : ""}
                </p>
                {exportStatus !== "idle" ? (
                  <p className="mb-4 rounded-xl border-2 border-cloud bg-white px-4 py-3 text-sm font-bold text-graphite">
                    {exportStatus === "exported"
                      ? "CSV exported."
                      : exportStatus === "empty"
                        ? "No filtered tips to export yet."
                        : "CSV export failed. Try again."}
                  </p>
                ) : null}
                <ActivityFeed items={filteredActivity} />
              </GlassCard>
            </div>

            <aside className="border-t-2 border-cloud bg-white px-4 py-6 sm:px-6 lg:border-l-2 lg:border-t-0 lg:px-8 lg:py-7">
              <section>
                <div className="flex items-center gap-3">
                  <Save className="h-[1.5625rem] w-[1.5625rem] text-duo" aria-hidden />
                  <h2 className="font-display text-4xl font-bold text-ink">Edit profile</h2>
                </div>
                <form
                  className="mt-6 space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!isEditingProfile) {
                      setProfileSnapshot({ ...profileSettings.settings });
                      setProfileSaveError(null);
                      setIsEditingProfile(true);
                      return;
                    }
                    const form = event.currentTarget;
                    setIsSavingProfile(true);
                    try {
                      await saveProfile();
                      setProfileSnapshot(null);
                      setIsEditingProfile(false);
                      form.reset();
                    } catch (caught) {
                      setProfileSaveError(caught instanceof Error ? caught.message.split("\n")[0] : "Profile update failed.");
                    } finally {
                      setIsSavingProfile(false);
                      setAvatarUploadProgress(0);
                    }
                  }}
                >
                  {[
                    ["Display name", "displayName", nickname],
                    ["Bio", "bio", "Tell supporters what they are backing."],
                    ["Status label", "profileStatus", "Verified creator"]
                  ].map(([label, key, placeholder]) => (
                    <label key={key} className="block">
                      <span className="text-xs font-black uppercase text-graphite">{label}</span>
                      {key === "bio" ? (
                        <textarea
                          value={profileSettings.settings.bio}
                          onChange={(event) =>
                            profileSettings.setSettings({ ...profileSettings.settings, bio: event.target.value })
                          }
                          disabled={!isEditingProfile}
                          placeholder={placeholder}
                          maxLength={160}
                          rows={4}
                          className="flat-input mt-2 w-full resize-none px-4 py-3 font-bold text-ink placeholder:text-silver disabled:bg-cloud/30 disabled:text-graphite"
                        />
                      ) : (
                        <input
                          value={profileSettings.settings[key as "displayName" | "avatarUrl" | "profileStatus"]}
                          onChange={(event) =>
                            profileSettings.setSettings({ ...profileSettings.settings, [key]: event.target.value })
                          }
                          disabled={!isEditingProfile}
                          placeholder={placeholder}
                          maxLength={key === "displayName" || key === "profileStatus" ? 48 : undefined}
                          className="flat-input mt-2 w-full px-4 py-3 font-bold text-ink placeholder:text-silver disabled:bg-cloud/30 disabled:text-graphite"
                        />
                      )}
                    </label>
                  ))}
                  <label className="block">
                    <span className="text-xs font-black uppercase text-graphite">Avatar image</span>
                    <div className="mt-2 flex items-center gap-3">
                      <CreatorAvatar
                        nickname={nickname}
                        imageUrl={avatarPreviewUrl || profileSettings.settings.avatarUrl}
                        size="md"
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={!isEditingProfile}
                        onChange={(event) => updateAvatarFile(event.target.files?.[0])}
                        className="flat-input w-full px-4 py-3 text-sm font-bold text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-duo-light file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:text-duo disabled:bg-cloud/30 disabled:text-graphite"
                      />
                    </div>
                    {(profileSettings.settings.avatarUrl || avatarFile) && isEditingProfile ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreviewUrl("");
                          profileSettings.setSettings({ ...profileSettings.settings, avatarUrl: "" });
                        }}
                        className="mt-2 text-xs font-black uppercase text-sky"
                      >
                        Remove avatar
                      </button>
                    ) : null}
                  </label>
                  {isEditingProfile ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isSavingProfile}
                        onClick={(event) => {
                          if (profileSnapshot) {
                            profileSettings.setSettings(profileSnapshot);
                          }
                          setProfileSnapshot(null);
                          setAvatarFile(null);
                          setAvatarPreviewUrl("");
                          setProfileSaveError(null);
                          setAvatarUploadProgress(0);
                          setIsEditingProfile(false);
                          event.currentTarget.form?.reset();
                        }}
                        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-duo bg-white px-4 py-3 text-sm font-black uppercase text-duo transition hover:bg-duo-light disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X className="h-5 w-5" aria-hidden />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile || profileUpdate.isPending || profileUpdate.state === "confirming"}
                        className="duo-button focus-ring inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingProfile || profileUpdate.state === "confirming" ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        ) : (
                          <Save className="h-5 w-5" aria-hidden />
                        )}
                        {avatarUploadProgress > 0 ? `Uploading ${avatarUploadProgress}%` : avatarFile ? "Upload & save" : "Save profile"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-duo bg-white px-5 py-3 text-sm font-black uppercase text-duo transition hover:bg-duo-light"
                    >
                      <Save className="h-5 w-5" aria-hidden />
                      Edit profile
                    </button>
                  )}
                  {profileSaveError || profileSettings.error ? (
                    <p className="text-center text-xs font-black uppercase text-bubblegum">
                      {profileSaveError || profileSettings.error}
                    </p>
                  ) : profileSettings.savedAt ? (
                    <p className="text-center text-xs font-black uppercase text-duo">Profile saved</p>
                  ) : null}
                </form>
              </section>

              <section className="mt-8 border-t-2 border-cloud pt-8">
                <div className="flex items-center gap-3">
                  <QrCode className="h-[1.5625rem] w-[1.5625rem] text-duo" aria-hidden />
                  <h2 className="font-display text-4xl font-bold text-ink">Share QR</h2>
                </div>
                <div className="mt-6 rounded-xl border-2 border-cloud bg-white p-5 text-center">
                  {qrImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrImageUrl} alt={`QR code for ${displayProfileUrl(nickname)}`} className="mx-auto h-40 w-40 rounded-xl" />
                  ) : (
                    <div className="mx-auto grid h-40 w-40 place-items-center rounded-xl bg-cloud/40 text-sm font-black uppercase text-graphite">
                      Loading
                    </div>
                  )}
                  <p className="mt-4 break-all text-sm font-black text-ink">{displayProfileUrl(nickname)}</p>
                  <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={shareQrCode}
                      disabled={!shareUrl}
                      className="sky-link-button focus-ring inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-xs font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Share2 className="h-[1.09375rem] w-[1.09375rem]" aria-hidden />
                      Share QR
                    </button>
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={!shareUrl}
                      className="sky-link-button focus-ring inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-xs font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Copy className="h-[1.09375rem] w-[1.09375rem]" aria-hidden />
                      {copyStatus === "copied" ? "Copied" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadQrCode}
                      disabled={!qrImageUrl}
                      className="sky-link-button focus-ring inline-grid min-h-11 w-11 place-items-center p-2 transition disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Download QR code"
                      title="Download QR"
                    >
                      <Download className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                </div>
              </section>

            </aside>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
