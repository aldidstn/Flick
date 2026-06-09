import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { createPublicClient, http, recoverMessageAddress } from "viem";
import { flickRegistryAbi } from "@/lib/abi";
import {
  AVATAR_AUTH_TTL_MS,
  AVATAR_CONTENT_TYPES,
  MAX_AVATAR_BYTES,
  avatarUploadMessage,
  type AvatarUploadAuthorization
} from "@/lib/avatar-upload";
import { ARC_TESTNET, FLICK_CONTRACT_ADDRESS } from "@/lib/constants";

export const runtime = "nodejs";

const publicClient = createPublicClient({
  transport: http(ARC_TESTNET.rpcHttp)
});

function uploadError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const oidcToken = request.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;
  if (!process.env.BLOB_READ_WRITE_TOKEN && !(oidcToken && storeId)) {
    return uploadError("Avatar storage is not configured.", 503);
  }
  if (!FLICK_CONTRACT_ADDRESS) return uploadError("FlickRegistry is not configured.", 503);
  const registryAddress = FLICK_CONTRACT_ADDRESS;

  let body: HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadPresignedBody;
  } catch {
    return uploadError("Invalid upload request.");
  }

  if (body.type === "blob.generate-presigned-url") {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return uploadError("Cross-origin uploads are not allowed.", 403);
    }
  }

  try {
    const response = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload, multipart) => {
        if (!clientPayload) throw new Error("Missing upload authorization.");
        if (multipart) throw new Error("Multipart uploads are not allowed for avatars.");

        const authorization = JSON.parse(clientPayload) as AvatarUploadAuthorization;
        const nickname = authorization.nickname?.toLowerCase();
        const address = authorization.address?.toLowerCase() as `0x${string}`;
        const expectedPrefix = `avatars/${nickname}/`;

        if (
          !nickname
          || !/^[a-z0-9_]{3,32}$/.test(nickname)
          || !/^0x[a-f0-9]{40}$/.test(address)
          || !/^0x[a-fA-F0-9]{130}$/.test(authorization.signature)
          || pathname !== authorization.pathname
          || !pathname.startsWith(expectedPrefix)
          || !/^avatars\/[a-z0-9_]{3,32}\/\d+\.(jpg|png|webp)$/.test(pathname)
        ) {
          throw new Error("Invalid upload authorization.");
        }
        if (!Number.isFinite(authorization.issuedAt) || Math.abs(Date.now() - authorization.issuedAt) > AVATAR_AUTH_TTL_MS) {
          throw new Error("Upload authorization expired.");
        }

        const recovered = await recoverMessageAddress({
          message: avatarUploadMessage({ address, nickname, pathname, issuedAt: authorization.issuedAt }),
          signature: authorization.signature
        });
        if (recovered.toLowerCase() !== address) throw new Error("Upload signature is invalid.");

        const claimedNickname = await publicClient.readContract({
          address: registryAddress,
          abi: flickRegistryAbi,
          functionName: "nicknameOf",
          args: [address]
        });
        if (claimedNickname.toLowerCase() !== nickname) throw new Error("Wallet does not own this Flick nickname.");

        const validUntil = Date.now() + AVATAR_AUTH_TTL_MS;
        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: [...AVATAR_CONTENT_TYPES],
            maximumSizeInBytes: MAX_AVATAR_BYTES,
            validUntil,
            oidcToken: oidcToken || undefined,
            storeId
          }),
          urlOptions: {
            allowedContentTypes: [...AVATAR_CONTENT_TYPES],
            maximumSizeInBytes: MAX_AVATAR_BYTES,
            validUntil,
            addRandomSuffix: true,
            cacheControlMaxAge: 31_536_000
          }
        };
      }
    });

    return NextResponse.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Avatar upload failed.";
    return uploadError(message, 403);
  }
}
