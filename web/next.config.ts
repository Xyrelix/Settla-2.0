import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @circle-fin/adapter-viem-v2 and @circle-fin/app-kit use Node.js built-ins
  // (crypto, stream, buffer) that cannot be bundled by Next.js for the browser.
  // Mark them as server-external so the bundler skips them during SSR/build;
  // they are loaded lazily at runtime via dynamic import() in BridgeAndPay.tsx.
  serverExternalPackages: [
    "@circle-fin/adapter-viem-v2",
    "@circle-fin/app-kit",
    "@circle-fin/bridge-kit",
  ],
};

export default nextConfig;
