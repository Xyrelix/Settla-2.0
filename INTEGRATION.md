# Integration

## Arc network

| Field | Mainnet | Testnet |
| --- | --- | --- |
| Chain ID | `5042` (`0x13b2`) | `5042002` |
| RPC | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.io` |
| Explorer | `https://explorer.arc.io` | `https://explorer.testnet.arc.io` |
| Currency symbol | `USDC` | `USDC` |
| Faucet | — | `https://faucet.circle.com` |

Verify RPC URLs against https://docs.arc.io before deploying. Third-party providers (Blockdaemon, dRPC, QuickNode) also run mainnet endpoints.

---

## USDC on Arc

| Item | Value |
| --- | --- |
| ERC-20 address | `0x3600000000000000000000000000000000000000` |
| ERC-20 decimals | 6 |
| Native gas token | USDC |
| Native gas decimals | 18 |

Rules of thumb:

- Use the **ERC-20 interface** (6 decimals) for all contract calls: `parseUnits(x, 6)`.
- `eth_getBalance` returns the native view at 18 decimals. The same pool of money reads as a different integer. Never mix the two.
- Arc rejects pre-EIP-155 transactions. Modern tooling (Hardhat 2+, viem, ethers 6) already signs replay-protected transactions.

---

## Adding Arc to a wallet

| Field | Mainnet | Testnet |
| --- | --- | --- |
| Network name | Arc | Arc Testnet |
| Chain ID | 5042 | 5042002 |
| RPC URL | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.io` |
| Symbol | USDC | USDC |
| Explorer | `https://explorer.arc.io` | `https://explorer.testnet.arc.io` |

Only add RPC URLs from official docs; a malicious RPC can display fake balances.

---

## Settla contract interface (Arc mainnet)

**Address:** `0x70425dE60f324D888997f4E54d841cde77401386`

| Function | Who | Effect |
| --- | --- | --- |
| `createInvoice(uint256 amount, string memo)` | anyone | Opens an invoice owned by the caller (memo ≤ 280 bytes) |
| `pay(uint256 id)` | anyone with allowance | Transfers USDC payer to merchant, marks Paid |
| `cancel(uint256 id)` | merchant | Cancels an Open invoice |
| `getInvoice(uint256 id)` | view | Returns the invoice struct |
| `invoicesOf(address merchant)` | view | Returns that merchant's invoice IDs |

Events: `InvoiceCreated(id, merchant, amount, memo)`, `Settled(id, merchant, payer, amount)`, `InvoiceCancelled(id)`.

Status enum: `0 None`, `1 Open`, `2 Paid`, `3 Cancelled`.

The payer must call `approve(settlaAddress, amount)` on the USDC contract before calling `pay`.

---

## SettlaV2 contract interface (Arc testnet)

**Address:** `0x581834a3cbaf0730d50c081b879f78efc331c760`

SettlaV2 includes all of the above invoice functions plus the subscription system below.

### Subscription functions

| Function | Who | Effect |
| --- | --- | --- |
| `createPlan(uint256 amount, uint64 interval, uint32 maxCharges, string memo)` | merchant | Creates a billing plan; `maxCharges = 0` means unlimited; `interval` must be ≥ 60 seconds |
| `deactivatePlan(uint256 planId)` | merchant | Prevents new subscriptions and future charges on existing ones |
| `subscribe(uint256 planId)` | customer | Subscribes and immediately charges the first interval |
| `charge(uint256 subId)` | anyone | Charges if interval has elapsed, plan is active, subscription is active, maxCharges not hit |
| `cancelSubscription(uint256 subId)` | merchant or subscriber | Permanently cancels |
| `getPlan(uint256 planId)` | view | Returns the Plan struct |
| `getSubscription(uint256 subId)` | view | Returns the Subscription struct |
| `plansOf(address merchant)` | view | Merchant's plan IDs |
| `subscriptionsOf(address subscriber)` | view | Subscriber's subscription IDs |

Subscription events: `PlanCreated`, `PlanDeactivated`, `Subscribed`, `Charged`, `SubscriptionCancelled`.

The subscriber must `approve(settlaV2Address, amount * maxCharges)` (or a large allowance) on USDC before subscribing.

---

## Multi-chain USDC payments (CCTP bridge)

Settla 2.0 accepts USDC from chains other than Arc. The BridgeAndPay component on the pay page uses Circle's Cross-Chain Transfer Protocol (CCTP) via Circle App Kit.

### Supported source chains (testnet)

| Chain | Chain ID |
| --- | --- |
| Base Sepolia | 84532 |
| Arbitrum Sepolia | 421614 |
| Optimism Sepolia | 11155420 |
| Ethereum Sepolia | 11155111 |

### Flow

1. Customer selects a source chain in the bridge panel.
2. App Kit burns USDC on the source chain and monitors Circle's attestation service.
3. Once the attestation is available (typically under 20 seconds on testnet), USDC is minted on Arc.
4. The invoice is paid automatically.

### Integrating the bridge into another app

```ts
import { createBridgeKit } from "@circle-fin/bridge-kit";
import { viemV2Adapter } from "@circle-fin/adapter-viem-v2";

const bridgeKit = createBridgeKit({ adapter: viemV2Adapter({ walletClient, publicClient }) });

const result = await bridgeKit.bridge({
  sourceChain: "Base_Sepolia",      // Circle chain key
  destinationChain: "Arc_Testnet",
  amount: "10.00",                  // USDC, string decimal
  destinationAddress: merchantAddress,
});
```

---

## Fiat onramp (Circle Onramp Kit)

The `BuyUsdc` component on every pay page is the integration point for the Circle Onramp Kit. Once a Kit Key is obtained (the kit is currently in private beta), replace the placeholder with:

1. A server route using `createOnrampServerKit` that mints a session token.
2. A client call to `createOnrampKit().mountIframe(containerEl)` that renders the widget.

The widget supports debit cards, Apple Pay, Google Pay, and ACH bank transfer.

---

## Integrating Settla into another app

### Create an invoice (viem)

```ts
import { createWalletClient, http, parseUnits } from "viem";
import { arc } from "./arc";
import settlaV2Artifact from "../contracts/out/SettlaV2.sol/SettlaV2.json";

const wallet = createWalletClient({ chain: arc, transport: http(), account });

const hash = await wallet.writeContract({
  address: "0x581834a3cbaf0730d50c081b879f78efc331c760",
  abi: settlaV2Artifact.abi,
  functionName: "createInvoice",
  args: [parseUnits("25.00", 6), "Order #1042"],
});
```

### Create a subscription plan (viem)

```ts
const MONTHLY = 2592000n; // 30 days in seconds

const hash = await wallet.writeContract({
  address: "0x581834a3cbaf0730d50c081b879f78efc331c760",
  abi: settlaV2Artifact.abi,
  functionName: "createPlan",
  args: [
    parseUnits("9.99", 6),  // amount per interval
    MONTHLY,                // interval in seconds
    0,                      // maxCharges (0 = unlimited)
    "Pro plan",             // memo
  ],
});
```

### Read a plan (read-only)

```ts
import { createPublicClient, http } from "viem";
import { arcTestnet } from "viem/chains";

const client = createPublicClient({ chain: arcTestnet, transport: http() });

const plan = await client.readContract({
  address: "0x581834a3cbaf0730d50c081b879f78efc331c760",
  abi: settlaV2Artifact.abi,
  functionName: "getPlan",
  args: [1n],
});
```

### Merchant-side listener (Node.js)

`contracts/scripts/listen.js` fires on every `Settled` event. Set `MERCHANT_ADDRESS` to filter to your own invoices:

```js
require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("../../web/src/lib/settla.abi.json");

const provider = new ethers.JsonRpcProvider(process.env.ARC_MAINNET_RPC);
const settla = new ethers.Contract(process.env.SETTLA_ADDRESS, abi, provider);
const filter = settla.filters.Settled(null, process.env.MERCHANT_ADDRESS || null);

settla.on(filter, (id, merchant, payer, amount, event) => {
  console.log(`Invoice #${id} paid: ${ethers.formatUnits(amount, 6)} USDC`);
  console.log(`tx: ${event.log.transactionHash}`);
});
```

---

## Pay links

Share `https://<your-app>/pay/<id>` for one-off invoices.
Share `https://<your-app>/plans/<planId>` for subscription plans.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `insufficient funds` on deploy or any transaction | No USDC on Arc for gas |
| `invalid chain id` | Wallet not set to chain ID 5042 (mainnet) or 5042002 (testnet) |
| Deploy fails with invalid opcode | Set `evmVersion: "paris"` in `hardhat.config.js` or `foundry.toml` |
| `pay` reverts | Missing or too-small allowance, or invoice not Open |
| Amount off by huge factor | Mixed 6-decimal ERC-20 with 18-decimal native gas value |
| `charge` reverts with `TooEarlyToCharge` | Interval has not elapsed since `lastChargedAt` |
| `subscribe` reverts with `PlanInactive` | Merchant deactivated the plan |
| Bridge stalls | Circle CCTP attestation can take up to 20 minutes on testnet under load; wait and retry |

---

## Security

- Deploy from a fresh wallet funded with only what gas requires.
- Never commit `.env`; `.gitignore` lists `.env`, `.env.*` (except `.env.example`), `node_modules`, `artifacts`, `cache`, `.next`.
- Both contracts are proof-of-concept deployments. SettlaV2 was reviewed but not formally audited by an external firm. Keep amounts small on testnet.

---

## Arc Microgrants 2 submission checklist

- [x] Original Settla deployed and working on Arc mainnet
- [x] At least one real create, pay, and cancel on Arc mainnet with proof of transactions
- [x] SettlaV2 deployed on Arc testnet with recurring subscription support
- [x] Multi-chain USDC payments via CCTP bridge
- [x] Payment history dashboard
- [x] Fiat onramp integration point (Circle Onramp Kit)
- [x] Public GitHub repo (`Xyrelix/Settla-2.0`) with README, IMPLEMENTATION.md, INTEGRATION.md
- [x] Live frontend on Vercel
- [x] Public builder profile: [@Dayston_](https://x.com/Dayston_)
