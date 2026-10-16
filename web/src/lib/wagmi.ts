import { createConfig, http, injected } from "wagmi";
import { baseSepolia, arbitrumSepolia, optimismSepolia, sepolia } from "wagmi/chains";
import { arc } from "./arc";

export const config = createConfig({
  chains: [arc, baseSepolia, arbitrumSepolia, optimismSepolia, sepolia],
  connectors: [injected()],
  transports: {
    [arc.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
