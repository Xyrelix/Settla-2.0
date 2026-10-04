# Implementation

## Design decisions

- **Non-custodial.** `pay` moves USDC straight from payer to merchant via `transferFrom`.
  The contract never holds funds, so there is nothing to drain.
- **USDC through its ERC-20 interface** (6 decimals). Native gas accounting on Arc uses 18
  decimals; do not mix the two when displaying balances or parsing amounts.
- **Checks-effects-interactions.** Invoice state flips to `Paid` before the transfer, so a
  reentrant call finds the invoice already closed.
- **Minimal surface.** Three write functions, two views, three events.

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

    IERC20 public immutable usdc;
    uint256 public nextId = 1;

    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _byMerchant;

    event InvoiceCreated(uint256 indexed id, address indexed merchant, uint256 amount, string memo);
    event Settled(uint256 indexed id, address indexed merchant, address indexed payer, uint256 amount);
    event InvoiceCancelled(uint256 indexed id);

    error ZeroAmount();
    error NotOpen();
    error NotMerchant();
    error TransferFailed();

    constructor(address usdc_) {
        usdc = IERC20(usdc_);
    }

    function createInvoice(uint256 amount, string calldata memo) external returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
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

`contracts/hardhat.config.js`:

```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ARC_MAINNET_RPC, DEPLOYER_PRIVATE_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
    // If deployment fails with an invalid-opcode error, add: evmVersion: "paris"
  },
  networks: {
    arcMainnet: {
      url: ARC_MAINNET_RPC || "https://rpc.mainnet.arc.io",
      chainId: 5042,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
```

`contracts/scripts/deploy.js`:

```js
const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  const usdc = process.env.USDC_ADDRESS;
  const Settla = await ethers.getContractFactory("Settla");
  const settla = await Settla.deploy(usdc);
  await settla.waitForDeployment();
  const address = await settla.getAddress();
  console.log("Settla deployed to:", address);

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(
    "deployments/arc-mainnet.json",
    JSON.stringify({ network: network.name, address, usdc }, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

`contracts/scripts/export-abi.js`:

```js
const fs = require("fs");
const artifact = require("../artifacts/contracts/Settla.sol/Settla.json");
fs.writeFileSync(
  "../web/src/lib/settla.abi.json",
  JSON.stringify(artifact.abi, null, 2),
);
console.log("ABI exported");
```

`contracts/.env.example`:

```
DEPLOYER_PRIVATE_KEY=
ARC_MAINNET_RPC=https://rpc.mainnet.arc.io
USDC_ADDRESS=0x3600000000000000000000000000000000000000
SETTLA_ADDRESS=
```

## Tests to write (`test/Settla.test.js`, using `MockUSDC` with 6 decimals)

- `createInvoice` stores merchant, amount, memo and emits `InvoiceCreated`
- `createInvoice` reverts on zero amount
- `pay` moves exact USDC from payer to merchant and emits `Settled`
- `pay` reverts if the invoice is already paid or cancelled
- `pay` reverts without sufficient allowance
- `cancel` works only for the merchant and only while open
- `invoicesOf` returns every ID a merchant created, in order

## Frontend: key files

`web/src/lib/arc.ts`:

```ts
import { defineChain } from "viem";

export const arc = defineChain({
  id: 5042,
  name: "Arc",
  // Native gas accounting is 18 decimals; the USDC ERC-20 interface is 6.
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC ?? "https://rpc.mainnet.arc.io"],
    },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
});
```

`web/src/lib/wagmi.ts`:

```ts
import { createConfig, http, injected } from "wagmi";
import { arc } from "./arc";

export const config = createConfig({
  chains: [arc],
  connectors: [injected()],
  transports: { [arc.id]: http() },
  ssr: true,
});
```

`web/src/lib/settla.ts`:

```ts
import abi from "./settla.abi.json";

export const settlaAbi = abi;
export const SETTLA_ADDRESS = process.env
  .NEXT_PUBLIC_SETTLA_ADDRESS as `0x${string}`;
export const USDC_ADDRESS = process.env
  .NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
export const USDC_DECIMALS = 6;
```

`web/src/app/providers.tsx`:

```tsx
"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { config } from "@/lib/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

Wrap `{children}` in `layout.tsx` with `<Providers>`.

`web/src/components/CreateInvoiceForm.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { parseEventLogs, parseUnits } from "viem";
import { settlaAbi, SETTLA_ADDRESS, USDC_DECIMALS } from "@/lib/settla";

export function CreateInvoiceForm() {
  const router = useRouter();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const hash = await writeContractAsync({
        address: SETTLA_ADDRESS,
        abi: settlaAbi,
        functionName: "createInvoice",
        args: [parseUnits(amount, USDC_DECIMALS), memo],
      });
      const receipt = await waitForTransactionReceipt(config, { hash });
      const [log] = parseEventLogs({
        abi: settlaAbi,
        logs: receipt.logs,
        eventName: "InvoiceCreated",
      });
      router.push(`/pay/${(log.args as { id: bigint }).id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (USDC)"
        className="border p-2 w-full"
      />
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="What is this for?"
        className="border p-2 w-full"
      />
      <button
        disabled={busy || !amount}
        className="bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {busy ? "Creating..." : "Create invoice"}
      </button>
    </form>
  );
}
```

`web/src/components/PayButton.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { erc20Abi } from "viem";
import { settlaAbi, SETTLA_ADDRESS, USDC_ADDRESS } from "@/lib/settla";

export function PayButton({ id, amount }: { id: bigint; amount: bigint }) {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<
    "idle" | "approving" | "paying" | "done" | "error"
  >("idle");

  async function onPay() {
    try {
      setStatus("approving");
      const approveHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [SETTLA_ADDRESS, amount],
      });
      await waitForTransactionReceipt(config, { hash: approveHash });

      setStatus("paying");
      const payHash = await writeContractAsync({
        address: SETTLA_ADDRESS,
        abi: settlaAbi,
        functionName: "pay",
        args: [id],
      });
      await waitForTransactionReceipt(config, { hash: payHash });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={onPay}
      disabled={
        status === "approving" || status === "paying" || status === "done"
      }
      className="bg-black text-white px-4 py-2 disabled:opacity-50"
    >
      {status === "idle" && "Pay with USDC"}
      {status === "approving" && "Approve USDC..."}
      {status === "paying" && "Settling..."}
      {status === "done" && "Paid"}
      {status === "error" && "Failed. Retry"}
    </button>
  );
}
```

The `pay/[id]` page reads `getInvoice(id)` with `useReadContract`, shows amount, memo and
status, and renders `PayButton` only while status is `Open` (1). The dashboard reads
`invoicesOf(address)` and maps each ID to an `InvoiceCard`.

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
