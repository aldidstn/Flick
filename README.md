# Flick

Flick is a creator tipping app for Arc Testnet. Creators claim a nickname, receive a public tip page, and monitor USDC/EURC support from a dashboard.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy local env values:

```bash
cp .env.example .env.local
```

3. Add required values:

```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=
NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS=
NEXT_PUBLIC_FLICK_BASE_URL=
GOLDSKY_GRAPHQL_URL=
GOLDSKY_API_KEY=
PRIVATE_KEY=
GOLDSKY_PROJECT_ID=
```

4. Run the app:

```bash
npm run dev
```

## Contract deployment

The deployer wallet needs Arc Testnet USDC for gas. Arc Testnet uses chain ID `5042002` and RPC `https://rpc.testnet.arc.network`.

```bash
source .env.local
npm run test:contracts
npm run deploy:contract
```

Set the deployed address in `.env.local`:

```bash
NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS=0x...
```

## Goldsky subgraph

After setting `NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS`, replace the placeholder address in `subgraph/subgraph.yaml` or use your deployment tooling to template it, then run:

```bash
goldsky login
npm run deploy:subgraph
```

For production, enable Goldsky's private endpoint and disable the public endpoint:

```bash
npm run secure:subgraph
```

Set the private endpoint and project-scoped API token as server-only environment variables:

```bash
GOLDSKY_GRAPHQL_URL=https://api.goldsky.com/api/private/<project_id>/subgraphs/flick/v1/gn
GOLDSKY_API_KEY=<project-scoped-token>
```

The browser queries Flick's same-origin `/api/graphql` proxy. The proxy rejects cross-origin requests, only permits known read operations, limits request size, and rate-limits clients. Never expose the private Goldsky token through a `NEXT_PUBLIC_` variable.

Tip transactions and their emitted event data remain publicly readable on Arc Testnet. The proxy reduces endpoint abuse and avoids exposing supporter wallet addresses through the app's recent-support query, but it cannot make on-chain data private.

## Contract security

Reserved nicknames and the 32-character nickname limit are enforced by both the client and `FlickRegistry`. Sender names are capped at 32 bytes and tip messages at 140 bytes on-chain. Updating these protections requires deploying a new registry contract and updating the subgraph and Vercel environment variables to its new address.

## Security rollout

1. Deploy the updated `FlickRegistry`.
2. Update `NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS` and `NEXT_PUBLIC_FLICK_DEPLOY_BLOCK`.
3. Deploy the updated subgraph, then run `npm run secure:subgraph`.
4. Add `GOLDSKY_GRAPHQL_URL` and `GOLDSKY_API_KEY` to Vercel as server-only variables and remove `NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL`.
5. Redeploy the app. For production-scale rate limiting across serverless instances, also add a Vercel Firewall rate-limit rule for `/api/graphql`.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
npm run test:contracts
```
