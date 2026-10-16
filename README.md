# Settla 2.0

**Non-custodial USDC invoicing and recurring payments on Arc.**

A merchant creates an invoice or a subscription plan, shares a link or QR code, and the customer pays in USDC. The contract moves money straight from customer to merchant: Settla never holds funds, and because Arc uses USDC for gas, a small business only ever needs one asset.

> Built for the Arc Microgrants 2 hackathon, extending the original Settla mainnet submission.

---

## Live deployments

| | |
| --- | --- |
| App (mainnet) | [settla-seven.vercel.app](https://settla-seven.vercel.app) |
| Settla contract (Arc mainnet, verified) | [`0x70425dE60f324D888997f4E54d841cde77401386`](https://explorer.arc.io/address/0x70425dE60f324D888997f4E54d841cde77401386#code) |
| SettlaV2 contract (Arc testnet, verified) | [`0x581834a3cbaf0730d50c081b879f78efc331c760`](https://explorer.testnet.arc.io/address/0x581834a3cbaf0730d50c081b879f78efc331c760#code) |
| Demo video | [59 s: create, scan, pay, settled](https://youtu.be/tiOl89qWRk4) ([also on X](https://x.com/Dayston_/status/2110045154413310349)) |
| Demo invoice | [settla-seven.vercel.app/pay/1](https://settla-seven.vercel.app/pay/1) |
| Builder | [@Dayston_](https://x.com/Dayston_) |

---

## What is new in 2.0

### 1. Recurring subscription plans (SettlaV2 contract)

Merchants create subscription plans with a fixed USDC amount and billing interval (daily, weekly, monthly, or custom). Customers subscribe once and are charged on every interval. Charging is permissionless — any wallet can trigger it once the interval elapses, enabling automated billing pipelines.

- `createPlan(amount, interval, maxCharges, memo)` — merchant defines the plan
- `subscribe(planId)` — customer subscribes; first charge happens immediately
- `charge(subId)` — permissionless: charges if interval has elapsed and plan is still active
- `cancelSubscription(subId)` — merchant or subscriber cancels at any time
- Supports unlimited or capped charge counts (`maxCharges = 0` means unlimited)

### 2. Payment history dashboard

A `/history` page shows every invoice a connected wallet has paid, read from on-chain `Settled` events. Each row shows the amount, merchant address, date, memo, and links to the invoice and the Arc explorer transaction.

---

## Proof of use (original Settla — Arc mainnet)

| Action | Invoice | Amount | Transaction |
| --- | --- | --- | --- |
| Create | #1 | 1 USDC | [`0xa892fb38…cfe1d01`](https://explorer.arc.io/tx/0xa892fb38e2dc5b3d6064e402d8459d2d39feea504f3674a88230f1ec3cfe1d01) |
| Pay | #1 | 1 USDC | [`0xb09d1434…393c4bee`](https://explorer.arc.io/tx/0xb09d1434acdcd0ee61fa64723d58a9006757fe3e4009093f8a3dcffa393c4bee) |
| Create | #2 | 2 USDC | [`0x06f47664…b368b26`](https://explorer.arc.io/tx/0x06f47664baced28dc1f56940aa61e62dfbe328288d7f4b447804f4676b368b26) |
| Cancel | #2 | 2 USDC | [`0x81483226…fe52de9b`](https://explorer.arc.io/tx/0x814832261f7b2ac19e7dc362641b103d02da1c64195440908ccddcc0fe52de9b) |

---

## What it uses Arc for

- **USDC as gas.** Merchants and customers only ever hold one asset. No ETH or other native token needed.
- **Sub-second finality.** A payment settles while the customer is still looking at the page — no waiting for confirmations.
- **Predictable fees.** Subscription charges and invoice payments cost fractions of a cent, making micro-billing economically viable.
- **Direct ERC-20 transfers.** All payments use USDC at `0x3600…0000` (6 decimals) via a plain `transferFrom`.

---

## How it works

### One-off invoices
1. Merchant calls `createInvoice(amount, memo)` and gets a pay link and QR code.
2. Customer opens `/pay/<id>`, approves USDC if needed, and calls `pay(id)`.
3. Contract transfers USDC directly from customer to merchant and emits `Settled`.

### Subscription plans
1. Merchant calls `createPlan(amount, interval, maxCharges, memo)` and shares the plan link.
2. Customer calls `subscribe(planId)` — first charge happens immediately.
3. Any wallet calls `charge(subId)` after each interval to bill the subscriber.
4. Either party calls `cancelSubscription(subId)` to end the subscription.

---

## Security

- Both contracts never hold USDC and have no owner, admin key, or upgrade path.
- SettlaV2 was reviewed for reentrancy (CEI pattern applied), ERC-20 return-value safety, and permissionless-charge griefing vectors.
- Memos are public and permanent. Never put customer names, emails, or personal data in a memo.
- A first-time payer signs twice (approve, then pay). Subsequent payments skip approval when the allowance still covers the amount.

---

## Project structure

```
settla/
├── README.md
├── IMPLEMENTATION.md          # contract design, build order, frontend file map
├── INTEGRATION.md             # Arc network config, USDC details, contract interfaces
├── contracts/                 # Hardhat (Node.js), original Settla.sol
│   ├── contracts/
│   │   ├── Settla.sol         # original one-off invoice contract (Arc mainnet)
│   │   └── mocks/MockUSDC.sol # test helper
│   ├── scripts/
│   │   ├── deploy.js
│   │   ├── verify.js
│   │   ├── export-abi.js
│   │   └── listen.js
│   └── test/Settla.test.js
├── contracts/ (Foundry)       # SettlaV2.sol lives here (Arc testnet)
│   └── SettlaV2.sol           # audited recurring subscription contract
└── web/                       # Next.js (App Router) + TypeScript + Tailwind
    └── src/
        ├── app/
        │   ├── (app)/
        │   │   ├── dashboard/         # merchant's invoices
        │   │   ├── new/               # create an invoice
        │   │   ├── pay/[id]/          # customer pay page
        │   │   ├── plans/             # subscription plan dashboard
        │   │   ├── plans/new/         # create a plan
        │   │   ├── plans/[id]/        # plan detail + subscribe
        │   │   └── history/           # payer's payment history
        │   └── (marketing)/           # landing page
        ├── components/
        │   ├── CreatePlanForm.tsx
        │   ├── PlanCard.tsx
        │   └── SubscribeButton.tsx
        └── lib/
            ├── settlaV2.ts            # SettlaV2 ABI, addresses, helpers
            └── wagmi.ts               # wagmi config for Arc
```

---

## Install and run

```bash
# contracts (original Settla, Hardhat)
cd contracts && npm install

# web
cd web && npm install
npm run dev   # http://localhost:3000
```

### Environment variables (`web/.env.local`)

```
NEXT_PUBLIC_ARC_RPC=https://rpc.testnet.arc.io
NEXT_PUBLIC_SETTLA_ADDRESS=0x70425dE60f324D888997f4E54d841cde77401386
NEXT_PUBLIC_SETTLA_V2_ADDRESS=0x581834a3cbaf0730d50c081b879f78efc331c760
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_ARC_NETWORK=testnet
```

### Deploy to Vercel

1. Import the repo, set **Root Directory** to `web`.
2. Add the environment variables above.
3. Deploy. `NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.

---

## Docs

- [IMPLEMENTATION.md](IMPLEMENTATION.md) — contract design, audit findings, build order, frontend file map
- [INTEGRATION.md](INTEGRATION.md) — Arc network config, USDC details, SettlaV2 interface

## License

MIT
