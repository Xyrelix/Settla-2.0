import { defineChain } from "viem";

// NEXT_PUBLIC_ARC_NETWORK=testnet points the app at Arc testnet for dry runs.
const testnet = process.env.NEXT_PUBLIC_ARC_NETWORK === "testnet";
const explorer = testnet ? "https://explorer.testnet.arc.io" : "https://explorer.arc.io";

export const arc = defineChain({
  id: (testnet ? 5042002 : 5042) as number,
  name: testnet ? "Arc Testnet" : "Arc",
  // Native gas accounting is 18 decimals; the USDC ERC-20 interface is 6.
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ARC_RPC || (testnet ? "https://rpc.testnet.arc.io" : "https://rpc.mainnet.arc.io"),
      ],
    },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: explorer },
  },
  testnet,
});
