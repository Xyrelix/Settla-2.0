# Implementation

## Design principles (shared across both contracts)

- **Non-custodial.** Every payment uses `transferFrom` directly from payer to merchant. Neither contract ever holds funds, so there is nothing to drain.
- **USDC through its ERC-20 interface** (6 decimals). Native gas accounting on Arc uses 18 decimals; do not mix the two when displaying balances or parsing amounts.
- **Checks-effects-interactions.** State is updated before external calls, so a reentrant call sees the updated state and cannot double-charge or double-pay.
- **Minimal surface.** No owner, no admin key, no upgrade path, no proxy.
- **Bounded memos.** Capped at 280 bytes (`MAX_MEMO_LENGTH`) to keep storage predictable.
- **Custom errors throughout.** No `require` strings — saves gas and makes revert reasons unambiguous.

---

## Contract 1: `Settla.sol` (Arc mainnet — original)

**Address:** `0x70425dE60f324D888997f4E54d841cde77401386`
**Source:** `contracts/contracts/Settla.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/// @title Settla: non-custodial USDC invoicing on Arc
contract Settla {
    enum Status { None, Open, Paid, Cancelled }

    struct Invoice {
        address merchant;
        address payer;
        uint256 amount;   // USDC, 6 decimals
        uint64 createdAt;
        uint64 paidAt;
        Status status;
        string memo;
    }

    uint256 public constant MAX_MEMO_LENGTH = 280;

    IERC20 public immutable usdc;
    uint256 public nextId = 1;

    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _byMerchant;

    event InvoiceCreated(uint256 indexed id, address indexed merchant, uint256 amount, string memo);
    event Settled(uint256 indexed id, address indexed merchant, address indexed payer, uint256 amount);
    event InvoiceCancelled(uint256 indexed id);

    error ZeroAddress();
    error ZeroAmount();
    error MemoTooLong();
    error NotOpen();
    error NotMerchant();
    error TransferFailed();

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert ZeroAddress();
        usdc = IERC20(usdc_);
    }

    function createInvoice(uint256 amount, string calldata memo) external returns (uint256 id);
    function pay(uint256 id) external;
    function cancel(uint256 id) external;
    function getInvoice(uint256 id) external view returns (Invoice memory);
    function invoicesOf(address merchant) external view returns (uint256[] memory);
}
```

---

## Contract 2: `SettlaV2.sol` (Arc Mainnet — Settla 2.0)

**Testnet address:** `0x581834a3cbaf0730d50c081b879f78efc331c760`
**Mainnet address:** `0x9FcBc3D00C66a50fB2350f1e4630D89A9AE147a5`
**Mainnet deploy tx:** `0x20f68d5d93d00e7bda714d3c345448dc8537411077e6112c8e3226a5194e98cd`
**Source:** `contracts/SettlaV2.sol` (Foundry)
**Compiler:** Solidity 0.8.24, EVM Paris, no OpenZeppelin imports

SettlaV2 is a standalone contract (not inheriting from Settla) that includes all original invoice functionality plus a full recurring subscription system.

### New structs

```solidity
struct Plan {
    address merchant;
    uint256 amount;       // USDC per interval, 6 decimals
    uint64 interval;      // seconds between charges (minimum 60)
    uint32 maxCharges;    // 0 = unlimited
    bool active;
    string memo;
}

struct Subscription {
    address subscriber;
    uint256 planId;
    uint64 startedAt;
    uint64 lastChargedAt;
    uint32 chargeCount;
    bool active;
}
```

### New functions

| Function | Who | Effect |
| --- | --- | --- |
| `createPlan(amount, interval, maxCharges, memo)` | merchant | Creates a billing plan |
| `deactivatePlan(planId)` | merchant | Disables the plan (no new subscriptions, existing ones block future charges) |
| `subscribe(planId)` | customer | Subscribes and immediately pays the first charge |
| `charge(subId)` | anyone | Charges if interval has elapsed, plan is active, and maxCharges not hit |
| `cancelSubscription(subId)` | merchant or subscriber | Permanently cancels |
| `getPlan(planId)` | view | Returns plan struct |
| `getSubscription(subId)` | view | Returns subscription struct |
| `plansOf(merchant)` | view | Merchant's plan IDs |
| `subscriptionsOf(subscriber)` | view | Subscriber's subscription IDs |

### Security properties

| Property | How it is enforced |
| --- | --- |
| No reentrancy on `charge` | CEI: `lastChargedAt` and `chargeCount` updated before `_transferFromOrRevert` |
| No reentrancy on `subscribe` | CEI: subscription written before first-charge transfer |
| Deactivated plan cannot be charged | `charge()` checks `plan.active` and reverts `PlanInactive()` |
| ERC-20 return value validated | `_transferFromOrRevert` requires exactly 32-byte `true` return; empty returndata is not accepted |
| Non-contract USDC rejected | Constructor checks `usdc_.code.length > 0`, reverts `NotAContract()` |
| Permissionless `charge` cannot grief | Failed transfer reverts the whole call; subscription state is unchanged; only merchant/subscriber can cancel |
| Minimum interval | `createPlan` reverts `IntervalTooShort()` if `interval < 60` |

### Audit history

SettlaV2 underwent three rounds of security review before deployment. Four High findings were identified and fixed:

1. **Low-level call treated empty returndata as success** — fixed by requiring strict 32-byte `true` ERC-20 return and adding a constructor `code.length` check.
2. **Permissionless `charge()` auto-cancelled subscriptions on failed transfer** — fixed by reverting on failure instead, leaving subscription state intact.
3. **`charge()` updated state after external call** — fixed by moving state updates before the transfer (CEI).
4. **Deactivated plans were still chargeable** — fixed by adding a `plan.active` check in `charge()`.

---

## Contract tooling (original Settla — Hardhat)

| File | Purpose |
| ---- | ------- |
| `hardhat.config.js` | Solidity 0.8.24 with optimizer; `arcMainnet` (5042) and `arcTestnet` (5042002) networks |
| `scripts/deploy.js` | Deploys `Settla(USDC_ADDRESS)`, writes `deployments/<network>.json`, then verifies |
| `scripts/verify.js` | Blockscout verification; falls back to Standard JSON input for manual verify |
| `scripts/export-abi.js` | Writes `web/src/lib/settla.abi.json` and `settla.abi.ts` |
| `scripts/listen.js` | Logs `Settled` events, optionally filtered by `MERCHANT_ADDRESS` |
| `contracts/mocks/MockUSDC.sol` | 6-decimal ERC-20 used only in tests |

## Contract tooling (SettlaV2 — Foundry)

Build: `forge build` from the repo root (reads `foundry.toml`).
The ABI is inlined directly in `web/src/lib/settlaV2.ts` — no build artifact dependency at runtime.

---

## Frontend (web/)

### New files in Settla 2.0

| File | Purpose |
| --- | --- |
| `lib/settlaV2.ts` | SettlaV2 address + inlined ABI, `Plan`/`Subscription` types, `formatUsdc`, `formatInterval`, `errorMessage` |
| `components/CreatePlanForm.tsx` | Validates amount, interval preset or custom, maxCharges, memo; creates plan on-chain |
| `components/PlanCard.tsx` | Displays a plan with amount, interval, status badge; links to plan detail |
| `components/SubscribeButton.tsx` | Approve + subscribe flow; shows next charge date; handles `charge()` |
| `app/(app)/plans/page.tsx` | Merchant's subscription plan dashboard |
| `app/(app)/plans/new/page.tsx` | Create a new plan |
| `app/(app)/plans/[id]/page.tsx` | Plan detail, QR share, subscribe button |
| `app/(app)/history/page.tsx` | Payer's payment history (reads `Settled` events from on-chain) |

### Updated files

| File | Change |
| --- | --- |
| `components/NavLinks.tsx` | Added Subscriptions and History tabs |

### Original files (unchanged)

| File | Purpose |
| --- | --- |
| `lib/arc.ts` | viem chain definition for Arc |
| `lib/settla.ts` | Original Settla addresses, ABI, status enum, formatUsdc |
| `lib/useArcTx.ts` | Switch to Arc, send write, wait for receipt |
| `components/ConnectButton.tsx` | Connect, switch-to-Arc, disconnect |
| `components/CreateInvoiceForm.tsx` | Create one-off invoice |
| `components/PayButton.tsx` | Approve + pay one-off invoice |
| `components/InvoiceCard.tsx` | Invoice row with status badge and merchant cancel |

---

## Build order

| Phase | Work |
| --- | --- |
| Oct 4–13, 2026 | Original Settla: contract, tests, deployment, frontend, Vercel |
| Oct 14–16, 2026 | Settla 2.0: SettlaV2 contract (written, audited 3 rounds, deployed Arc testnet + mainnet), recurring plan UI, payment history, docs |
