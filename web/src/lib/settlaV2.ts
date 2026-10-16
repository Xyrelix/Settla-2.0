import { BaseError, formatUnits, isAddress, type Address } from "viem";
import settlaV2ArtifactRaw from "../../../../contracts/out/SettlaV2.sol/SettlaV2.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const settlaV2Abi = (settlaV2ArtifactRaw as any).abi;

const v2Env = process.env.NEXT_PUBLIC_SETTLA_V2_ADDRESS;
const usdcEnv = process.env.NEXT_PUBLIC_USDC_ADDRESS;

export const SETTLA_V2_ADDRESS = (v2Env && isAddress(v2Env) ? v2Env : undefined) as Address | undefined;
export const USDC_ADDRESS: Address =
  usdcEnv && isAddress(usdcEnv) ? usdcEnv : "0x3600000000000000000000000000000000000000";
export const USDC_DECIMALS = 6;
export const MAX_MEMO_BYTES = 280;
export const MIN_INTERVAL_SECONDS = 60;

export const PlanStatus = { Active: true, Inactive: false } as const;

// Human-readable interval presets
export const INTERVAL_PRESETS: { label: string; seconds: number }[] = [
  { label: "Daily", seconds: 86400 },
  { label: "Weekly", seconds: 604800 },
  { label: "Monthly", seconds: 2592000 },
  { label: "Yearly", seconds: 31536000 },
];

export function formatUsdc(amount: bigint) {
  return Number(formatUnits(amount, USDC_DECIMALS)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: USDC_DECIMALS,
  });
}

export function formatInterval(seconds: number): string {
  if (seconds >= 31536000) return `${Math.round(seconds / 31536000)}y`;
  if (seconds >= 2592000) return `${Math.round(seconds / 2592000)}mo`;
  if (seconds >= 604800) return `${Math.round(seconds / 604800)}w`;
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  return `${seconds}s`;
}

export function memoBytes(memo: string) {
  return new TextEncoder().encode(memo).length;
}

export function errorMessage(e: unknown) {
  if (e instanceof BaseError) return e.shortMessage;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

// ABI-typed structs returned by the contract
export interface PlanData {
  merchant: Address;
  amount: bigint;
  interval: bigint;
  maxCharges: number;
  active: boolean;
  memo: string;
}

export interface SubscriptionData {
  subscriber: Address;
  planId: bigint;
  startedAt: bigint;
  lastChargedAt: bigint;
  chargeCount: number;
  active: boolean;
}
