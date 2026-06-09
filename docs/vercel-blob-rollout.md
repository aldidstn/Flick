# Vercel Blob rollout

Flick uses Vercel Blob client uploads for public creator avatars. The browser uploads directly to Blob after Flick authorizes the upload route.

## Vercel setup

1. Open the Flick project in Vercel.
2. Open **Storage**, create a Blob store, and connect it to the Flick project.
3. Confirm Vercel connected the store and added `BLOB_STORE_ID`. Vercel deployments use automatically rotated OIDC credentials.
4. Redeploy the app after connecting the store.
5. For local testing, run `vercel env pull .env.local` or add the store token to `.env.local`.

Vercel deployments use short-lived OIDC credentials automatically. Local development can still use a server-only `BLOB_READ_WRITE_TOKEN`; never rename it with a `NEXT_PUBLIC_` prefix.

## Upload security

- `/api/avatar/upload` only issues presigned upload URLs for same-origin requests.
- The connected wallet signs a five-minute upload authorization.
- The route verifies that the signer owns the nickname in `FlickRegistry`.
- Only JPEG, PNG, and WebP files up to 2 MB are accepted.
- Avatar uploads use immutable randomized paths and one-year cache headers.
- Multipart uploads are disabled because avatar files are small.

## Profile persistence rollout

The Blob URL becomes permanent profile data through the `ProfileUpdated` contract event and Goldsky.

1. Deploy the updated `FlickRegistry`.
2. Set `NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS` and `NEXT_PUBLIC_FLICK_DEPLOY_BLOCK`.
3. Deploy the updated Goldsky subgraph so it indexes `ProfileUpdated`.
4. Confirm `GOLDSKY_GRAPHQL_URL` and `GOLDSKY_API_KEY` are configured in Vercel.
5. Redeploy Flick.
6. Upload an avatar, save the profile, and verify it appears from another browser.

Deploying a new registry starts with empty nickname claims and tip totals. Existing testnet registry data is not migrated automatically.
