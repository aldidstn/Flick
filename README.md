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
PRIVATE_KEY=
GOLDSKY_API_KEY=
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

Set the resulting endpoint:

```bash
NEXT_PUBLIC_GOLDSKY_GRAPHQL_URL=https://api.goldsky.com/api/public/<project_id>/subgraphs/flick/v1/gn
```

## Verification

```bash
npm run typecheck
npm run lint
npm run build
npm run test:contracts
```
