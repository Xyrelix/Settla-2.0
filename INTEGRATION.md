# Integration

## Arc network

| Field           | Value                        |
| --------------- | ---------------------------- |
| Network         | Arc mainnet                  |
| Chain ID        | `5042` (`0x13b2`)            |
| RPC             | `https://rpc.mainnet.arc.io` |
| Explorer        | `https://explorer.arc.io`    |
| Currency symbol | `USDC`                       |

Verify these against https://docs.arc.io before deploying. Other providers (Blockdaemon, dRPC,
QuickNode) also run mainnet endpoints if the primary one is slow.

Testnet (for dry runs): chain ID `5042002`, RPC `https://rpc.testnet.arc.io`, explorer
`https://explorer.testnet.arc.io`, faucet `https://faucet.circle.com`. Submissions to the grant must be mainnet, but a
testnet pass first is a cheap way to catch contract bugs.

## USDC on Arc

| Item                  | Value                                                          |
| --------------------- | -------------------------------------------------------------- |
| ERC-20 USDC interface | `0x3600000000000000000000000000000000000000`                   |
| ERC-20 decimals       | 6                                                              |
| Native gas token      | USDC                                                           |
| Native gas decimals   | 18 (confirmed in docs.arc.io)                                  |

Rules of thumb:

- Use the **ERC-20 interface** (6 decimals) for everything Settla does: `parseUnits(x, 6)`.
- Native gas balances, as shown by `eth_getBalance`, use 18 decimals. Treating one as the other
  is off by a factor of 10^12.
- You need USDC on Arc to pay gas. Bridge it in with Circle's CCTP or any supported bridge.
- Arc rejects pre-EIP-155 transactions (`-32000 only replay-protected transactions allowed`).
  Modern tooling already signs replay-protected transactions.

## Adding Arc to a wallet

Chain ID `5042`, RPC `https://rpc.mainnet.arc.io`, symbol `USDC`, explorer
`https://explorer.arc.io`. Only add RPC URLs from official docs; a malicious RPC can display
fake balances.

## Contract interface

| Function                                                          | Who                   | Effect                                       |
| ----------------------------------------------------------------- | --------------------- | -------------------------------------------- |
| `createInvoice(uint256 amount, string memo) returns (uint256 id)` | anyone                | Opens an invoice owned by the caller (memo ≤ 280 bytes) |
| `pay(uint256 id)`                                                 | anyone with allowance | Transfers USDC payer to merchant, marks Paid |
| `cancel(uint256 id)`                                              | merchant              | Cancels an Open invoice                      |
| `getInvoice(uint256 id)`                                          | view                  | Returns the invoice struct                   |
| `invoicesOf(address merchant)`                                    | view                  | Returns that merchant's invoice IDs          |

Events: `InvoiceCreated(id, merchant, amount, memo)`, `Settled(id, merchant, payer, amount)`,
`InvoiceCancelled(id)`.

Status enum: `0 None`, `1 Open`, `2 Paid`, `3 Cancelled`.

The payer must `approve(settla, amount)` on the USDC contract before calling `pay`.

## Integrating Settla into another app

### Create an invoice (viem)

```ts
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { arc } from "./arc";
import { settlaAbi as abi } from "./settla.abi"; // typed, from export-abi

const wallet = createWalletClient({ chain: arc, transport: http(), account });
const hash = await wallet.writeContract({
  address: SETTLA_ADDRESS,
  abi,
  functionName: "createInvoice",
  args: [parseUnits("25.00", 6), "Order #1042"],
});
```

### Check whether an invoice is paid (read-only)

```ts
const client = createPublicClient({ chain: arc, transport: http() });
const inv = await client.readContract({
  address: SETTLA_ADDRESS,
  abi,
  functionName: "getInvoice",
  args: [42n],
});
const paid = inv.status === 2;
```

### Merchant-side listener (Node.js)

`contracts/scripts/listen.js` fires whenever an invoice settles. Set `MERCHANT_ADDRESS` to
only hear about your own invoices, then trigger fulfilment, send a receipt email, or update your own database.

```js
require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("../../web/src/lib/settla.abi.json");

const { ARC_MAINNET_RPC, SETTLA_ADDRESS, MERCHANT_ADDRESS } = process.env;
const provider = new ethers.JsonRpcProvider(ARC_MAINNET_RPC);
const settla = new ethers.Contract(SETTLA_ADDRESS, abi, provider);

// merchant is indexed on Settled, so filter on it when MERCHANT_ADDRESS is set.
const filter = settla.filters.Settled(null, MERCHANT_ADDRESS || null);

settla.on(filter, (id, merchant, payer, amount, event) => {
  console.log(
    `Invoice #${id} paid by ${payer}: ${ethers.formatUnits(amount, 6)} USDC`,
  );
  console.log(`tx: ${event.log.transactionHash}`);
});
```

Run it:

```bash
node scripts/listen.js
```

```powershell
node scripts\listen.js
```

## Pay links

Share `https://<your-app>/pay/<id>`. The page loads the invoice, connects a wallet, switches
to Arc if needed, and runs approve then pay.

## Troubleshooting

| Symptom                                           | Likely cause                                         |
| ------------------------------------------------- | ---------------------------------------------------- |
| `insufficient funds` on deploy or any transaction | No USDC on Arc in that wallet for gas                |
| `invalid chain id`                                | Wallet or config not set to `5042`                   |
| Deploy fails with invalid opcode                  | Set `evmVersion: "paris"` in `hardhat.config.js`     |
| `pay` reverts                                     | Missing or too-small allowance, or invoice not Open  |
| Amount off by huge factor                         | Mixed 6-decimal ERC-20 with 18-decimal native values |

## Security

- Deploy from a fresh wallet funded with only what gas requires.
- Never commit `.env`; `.gitignore` lists `.env`, `.env.*` (except `.env.example`), `node_modules`, `artifacts`, `cache`, `.next`.
- The contract is unaudited. Treat it as a proof of concept, not production money-handling.

## Arc Microgrants submission checklist

- [ ] Contract deployed and working on Arc mainnet (not testnet)
- [ ] At least one real create, pay, and cancel run on mainnet
- [ ] Public GitHub repo with README and these docs
- [ ] Live frontend URL
- [ ] Short description: what Settla does and what it uses Arc for (USDC gas and settlement)
- [ ] Public builder profile (GitHub or X)
- [ ] Submitted before Oct 14, 23:59 ET (aim for Oct 13)
