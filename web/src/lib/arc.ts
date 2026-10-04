import { defineChain } from "viem";

export const arc = defineChain({
  id: 5042,
  name: "Arc",
  // Native gas accounting is 18 decimals; the USDC ERC-20 interface is 6.
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC || "https://rpc.mainnet.arc.io"],
    },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
});
