# Implementation

## Design decisions

- **Non-custodial.** `pay` moves USDC straight from payer to merchant via `transferFrom`.
  The contract never holds funds, so there is nothing to drain.
- **USDC through its ERC-20 interface** (6 decimals). Native gas accounting on Arc uses 18
  decimals; do not mix the two when displaying balances or parsing amounts.
- **Checks-effects-interactions.** Invoice state flips to `Paid` before the transfer, so a
  reentrant call finds the invoice already closed.
- **Minimal surface.** Three write functions, two views, three events.
- **Bounded memos.** Memos are capped at 280 bytes (`MAX_MEMO_LENGTH`) so invoices stay cheap to
  store and read.

## Contract: `contracts/contracts/Settla.sol`

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

    function createInvoice(uint256 amount, string calldata memo) external returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (bytes(memo).length > MAX_MEMO_LENGTH) revert MemoTooLong();
        id = nextId++;
        _invoices[id] = Invoice(msg.sender, address(0), amount, uint64(block.timestamp), 0, Status.Open, memo);
        _byMerchant[msg.sender].push(id);
        emit InvoiceCreated(id, msg.sender, amount, memo);
    }

    function pay(uint256 id) external {
        Invoice storage inv = _invoices[id];
        if (inv.status != Status.Open) revert NotOpen();
        inv.status = Status.Paid;
        inv.payer = msg.sender;
        inv.paidAt = uint64(block.timestamp);
        if (!usdc.transferFrom(msg.sender, inv.merchant, inv.amount)) revert TransferFailed();
        emit Settled(id, inv.merchant, msg.sender, inv.amount);
    }

    function cancel(uint256 id) external {
        Invoice storage inv = _invoices[id];
        if (inv.merchant != msg.sender) revert NotMerchant();
        if (inv.status != Status.Open) revert NotOpen();
        inv.status = Status.Cancelled;
        emit InvoiceCancelled(id);
    }

    function getInvoice(uint256 id) external view returns (Invoice memory) {
        return _invoices[id];
    }

    function invoicesOf(address merchant) external view returns (uint256[] memory) {
        return _byMerchant[merchant];
    }
}
```

## Contract tooling

| File | Purpose |
| ---- | ------- |
| `hardhat.config.js` | Solidity 0.8.24 with optimizer; `arcMainnet` (5042) and `arcTestnet` (5042002) networks |
| `scripts/deploy.js` | Deploys `Settla(USDC_ADDRESS)` and writes `deployments/<network>.json` (`arc-mainnet.json` on mainnet) |
| `scripts/export-abi.js` | Writes the ABI to `web/src/lib/settla.abi.json` (Node) and `settla.abi.ts` (`as const`, typed for viem/wagmi) |
| `scripts/listen.js` | Logs `Settled` events, optionally filtered to `MERCHANT_ADDRESS` |
| `contracts/mocks/MockUSDC.sol` | 6-decimal ERC-20 used only by tests |

npm scripts: `test`, `compile`, `deploy:testnet`, `deploy:mainnet`, `export-abi`, `listen`.

`contracts/.env.example`:

```
DEPLOYER_PRIVATE_KEY=
ARC_MAINNET_RPC=https://rpc.mainnet.arc.io
ARC_TESTNET_RPC=https://rpc.testnet.arc.io
USDC_ADDRESS=0x3600000000000000000000000000000000000000
SETTLA_ADDRESS=
MERCHANT_ADDRESS=
```

## Tests (`test/Settla.test.js`, using `MockUSDC` with 6 decimals)

- `createInvoice` stores merchant, amount, memo and emits `InvoiceCreated`
- `createInvoice` reverts on zero amount and on memos over 280 bytes
- `pay` moves exact USDC from payer to merchant and emits `Settled`
- `pay` reverts if the invoice is already paid or cancelled
- `pay` reverts without sufficient allowance
- `cancel` works only for the merchant and only while open
- the constructor rejects the zero address
- `invoicesOf` returns every ID a merchant created, in order

## Frontend

| File | Purpose |
| ---- | ------- |
| `lib/arc.ts` | viem chain definition for Arc (native USDC, 18 decimals) |
| `lib/wagmi.ts` | wagmi config: Arc only, injected wallet connector, SSR enabled |
| `lib/settla.ts` | Contract/USDC addresses from env, status enum, `formatUsdc`, error helper |
| `lib/useArcTx.ts` | Switches the wallet to Arc if needed, sends a write, waits for the receipt |
| `components/ConnectButton.tsx` | Connect, switch-to-Arc, and disconnect states |
| `components/CreateInvoiceForm.tsx` | Validates amount (up to 6 decimals) and memo (280 bytes), creates, redirects to the pay page |
| `components/PayButton.tsx` | Checks balance and allowance, approves only if needed, then pays |
| `components/InvoiceCard.tsx` | One invoice row with status badge and merchant cancel |
| `app/page.tsx` | Landing and create form |
| `app/dashboard/page.tsx` | Connected merchant's invoices, newest first |
| `app/pay/[id]/page.tsx` | Invoice details, pay button for customers, share link for the merchant |

`settla.abi.ts` is generated: run `npm run export-abi` in `contracts/` after any contract change.

`web/.env.example`:

```
NEXT_PUBLIC_ARC_RPC=https://rpc.mainnet.arc.io
NEXT_PUBLIC_SETTLA_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
```

## Build order

| Day       | Work                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Oct 4-5   | Get USDC on Arc, scaffold both packages, write contract and tests, run `npx hardhat test`                        |
| Oct 6-7   | Deploy to Arc mainnet, record address, export ABI                                                                |
| Oct 8-10  | Build the three pages and wire them to the deployed contract                                                     |
| Oct 11-12 | Run a full create, pay, and cancel flow on mainnet with real transactions, write README, deploy `web/` to Vercel |
| Oct 13    | Submit (deadline is Oct 14, 23:59 ET)                                                                            |

If time runs short, cut the dashboard first. The contract, the create page, and the pay page are the minimum.
