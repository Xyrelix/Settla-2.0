# Settla

**Non-custodial USDC invoicing for small businesses, live on Arc mainnet.**

A merchant creates an invoice, shares a link or QR code, and the customer pays in USDC. The
contract moves the money straight from customer to merchant in the same transaction: Settla
never holds funds, and because Arc uses USDC for gas, a small business only ever needs one asset.

> Built for the Arc Microgrants Mainnet Challenge.

## Live on Arc mainnet

| | |
| --- | --- |
| App | [settla-seven.vercel.app](https://settla-seven.vercel.app) |
| Contract (verified) | [`0x70425dE60f324D888997f4E54d841cde77401386`](https://explorer.arc.io/address/0x70425dE60f324D888997f4E54d841cde77401386#code) |
| Demo video | [59 s: create, scan, pay, settled](https://youtu.be/tiOl89qWRk4) ([also on X](https://x.com/Dayston_/status/2110045154413310349)) |
| Try it | an open demo invoice, [settla-seven.vercel.app/pay/1](https://settla-seven.vercel.app/pay/1) |
| Builder | [@Dayston_](https://x.com/Dayston_) |

### Proof of use

Real transactions on Arc mainnet:

| Action | Invoice | Amount | Transaction |
| --- | --- | --- | --- |
| Create | #1 | 1 USDC | [`0xa892fb38…cfe1d01`](https://explorer.arc.io/tx/0xa892fb38e2dc5b3d6064e402d8459d2d39feea504f3674a88230f1ec3cfe1d01) |
| Pay | #1 | 1 USDC | [`0xb09d1434…393c4bee`](https://explorer.arc.io/tx/0xb09d1434acdcd0ee61fa64723d58a9006757fe3e4009093f8a3dcffa393c4bee) |
| Create | #2 | 2 USDC | [`0x06f47664…b368b26`](https://explorer.arc.io/tx/0x06f47664baced28dc1f56940aa61e62dfbe328288d7f4b447804f4676b368b26) |
| Cancel | #2 | 2 USDC | [`0x81483226…fe52de9b`](https://explorer.arc.io/tx/0x814832261f7b2ac19e7dc362641b103d02da1c64195440908ccddcc0fe52de9b) |

## What it uses Arc for

- USDC pays for gas as well as the invoice, so merchant and customer only ever hold USDC. There is
  no second token to buy and no volatile asset on the balance sheet.
- Finality is deterministic and under a second. An invoice is paid when its block commits, so the
  pay page switches to Paid while the customer is still looking at it, without a wait for
  confirmations.
- Payment uses USDC's ERC-20 interface at `0x3600…0000` (6 decimals), so it is a plain
  `transferFrom` from customer to merchant.

## How it works

1. The merchant calls `createInvoice(amount, memo)` and gets a pay link and QR code.
2. The customer opens `/pay/<id>`, approves USDC (only if needed), and calls `pay(id)`.
3. The contract transfers USDC directly from customer to merchant and emits `Settled`.
4. The dashboard shows each invoice as Open, Paid, or Cancelled; the merchant can cancel open ones.

## Security and limitations

- The contract never holds USDC and has no owner, admin key, or upgrade path.
- It has not been audited. This is a proof of concept, so keep amounts small.
- Memos are public and permanent, like everything on-chain. Never put customer names, emails, or
  addresses in a memo.
- A first-time payer signs twice (approve, then pay). Later payments skip the approval when the
  existing allowance covers them.
- Only browser-extension wallets (MetaMask and similar) work for now.

## Project structure

```
settla/
├── README.md
├── IMPLEMENTATION.md
├── INTEGRATION.md
├── .gitignore
├── contracts/                     # Hardhat (Node.js), Solidity
│   ├── package.json
│   ├── hardhat.config.js
│   ├── .env.example
│   ├── contracts/
│   │   ├── Settla.sol
│   │   └── mocks/MockUSDC.sol     # tests only
│   ├── scripts/
│   │   ├── deploy.js              # deploys, records, then verifies on the explorer
│   │   ├── verify.js              # explorer verification (with manual fallback)
│   │   ├── export-abi.js          # writes settla.abi.json + settla.abi.ts
│   │   └── listen.js              # merchant-side event listener
│   ├── test/Settla.test.js
│   └── deployments/arc-mainnet.json
└── web/                           # Next.js (App Router) + TypeScript + Tailwind
    ├── package.json
    ├── .env.example
    └── src/
        ├── app/
        │   ├── layout.tsx         # fonts, metadata, footer
        │   ├── providers.tsx
        │   ├── globals.css        # palette tokens, surfaces, motion
        │   ├── (marketing)/       # landing: own header, connect → dashboard
        │   │   ├── layout.tsx
        │   │   └── page.tsx
        │   ├── (app)/             # app header with centred Dashboard link
        │   │   ├── layout.tsx
        │   │   ├── dashboard/page.tsx  # merchant's invoices
        │   │   ├── new/page.tsx        # create an invoice
        │   │   └── pay/[id]/page.tsx   # customer pay page (receipt + QR)
        │   ├── not-found.tsx
        │   └── icon.svg
        ├── components/
        │   ├── SiteHeader.tsx     # floating nav island
        │   ├── LandingWallet.tsx  # landing connect button
        │   ├── ConnectButton.tsx
        │   ├── CreateInvoiceForm.tsx
        │   ├── CtaLink.tsx
        │   ├── InvoiceCard.tsx
        │   ├── NavLinks.tsx
        │   └── PayButton.tsx
        └── lib/
            ├── arc.ts             # Arc chain definition
            ├── wagmi.ts
            ├── settla.ts          # addresses, ABI, helpers
            ├── useArcTx.ts        # switch to Arc, write, wait for receipt
            ├── settla.abi.ts      # generated by export-abi (typed)
            └── settla.abi.json    # generated by export-abi
```

## Prerequisites

- Node.js 20 LTS or newer
- A wallet (MetaMask or similar) with a small amount of USDC on Arc for gas
- A fresh deployer wallet (never reuse a wallet that holds real funds)

## Install

The repo is already scaffolded, so a fresh clone only needs:

```bash
cd contracts && npm install
cd ../web && npm install
```

> Use `@nomicfoundation/hardhat-toolbox@hh2`. The plain `latest` tag (v7) is an empty package that
> works with neither Hardhat 2 nor 3.

To recreate the scaffold from scratch:

### bash

```bash
mkdir settla && cd settla
git init

# contracts
mkdir contracts && cd contracts
npm init -y
npm install --save-dev hardhat@2 "@nomicfoundation/hardhat-toolbox@hh2" dotenv
cd ..

# web
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd web
npm install wagmi viem @tanstack/react-query
cd ..
```

### PowerShell

```powershell
mkdir settla
cd settla
git init

# contracts
mkdir contracts
cd contracts
npm init -y
npm install --save-dev hardhat@2 "@nomicfoundation/hardhat-toolbox@hh2" dotenv
cd ..

# web
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd web
npm install wagmi viem @tanstack/react-query
cd ..
```

## Configure

bash:

```bash
cp contracts/.env.example contracts/.env
cp web/.env.example web/.env.local
```

PowerShell:

```powershell
Copy-Item contracts\.env.example contracts\.env
Copy-Item web\.env.example web\.env.local
```

Fill in `DEPLOYER_PRIVATE_KEY` in `contracts/.env`. After deploying, put the contract address in
`web/.env.local` as `NEXT_PUBLIC_SETTLA_ADDRESS`.

## Run

```bash
# contracts
cd contracts
npm test                    # compile + run the test suite
npm run deploy:testnet      # optional dry run on Arc testnet (chain 5042002)
npm run deploy:mainnet      # also verifies the source on the explorer
npm run verify:mainnet      # re-run verification on its own if needed
npm run export-abi          # writes web/src/lib/settla.abi.{json,ts}

# web
cd ../web
npm run dev                 # http://localhost:3000
```

(PowerShell: identical commands, run them on separate lines.)

### Contract verification

`deploy.js` verifies the source on Arc's Blockscout explorer automatically, retrying while the
explorer indexes the new contract. This works on testnet. The mainnet explorer's API sits behind
a bot check that can block scripted requests; when that happens the script writes
`deployments/arcMainnet-standard-input.json` and prints the compiler version, contract name, and
constructor arguments to paste into the explorer's **Verify & Publish** page (method: Solidity,
Standard JSON input).

### Deploying the web app (Vercel)

1. Import the repo in Vercel and set the **Root Directory** to `web`.
2. Add the environment variables from `web/.env.example`, including `NEXT_PUBLIC_SETTLA_ADDRESS`.
3. Deploy. `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.

## Docs

- [IMPLEMENTATION.md](IMPLEMENTATION.md): contract design, code, build order
- [INTEGRATION.md](INTEGRATION.md): Arc network config, USDC details, integrating Settla into other apps

## Roadmap

Recurring invoices, partial payments, fiat off-ramp links, and a merchant webhook service.

## License

MIT
