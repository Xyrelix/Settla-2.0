import { BaseError, formatUnits, isAddress, type Address } from "viem";

// ABI inlined to avoid a build-time dependency on the Foundry artifact path
export const settlaV2Abi = [
  { type: "constructor", inputs: [{ name: "usdc_", type: "address", internalType: "address" }], stateMutability: "nonpayable" },
  { type: "function", name: "MAX_MEMO_LENGTH", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "MIN_PLAN_INTERVAL", inputs: [], outputs: [{ name: "", type: "uint64", internalType: "uint64" }], stateMutability: "view" },
  { type: "function", name: "cancel", inputs: [{ name: "id", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelSubscription", inputs: [{ name: "subId", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "charge", inputs: [{ name: "subId", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "createInvoice", inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }, { name: "memo", type: "string", internalType: "string" }], outputs: [{ name: "id", type: "uint256", internalType: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "createPlan", inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }, { name: "interval", type: "uint64", internalType: "uint64" }, { name: "maxCharges", type: "uint32", internalType: "uint32" }, { name: "memo", type: "string", internalType: "string" }], outputs: [{ name: "planId", type: "uint256", internalType: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "deactivatePlan", inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getInvoice", inputs: [{ name: "id", type: "uint256", internalType: "uint256" }], outputs: [{ name: "", type: "tuple", internalType: "struct SettlaV2.Invoice", components: [{ name: "merchant", type: "address", internalType: "address" }, { name: "payer", type: "address", internalType: "address" }, { name: "amount", type: "uint256", internalType: "uint256" }, { name: "createdAt", type: "uint64", internalType: "uint64" }, { name: "paidAt", type: "uint64", internalType: "uint64" }, { name: "status", type: "uint8", internalType: "enum SettlaV2.Status" }, { name: "memo", type: "string", internalType: "string" }] }], stateMutability: "view" },
  { type: "function", name: "getPlan", inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }], outputs: [{ name: "", type: "tuple", internalType: "struct SettlaV2.Plan", components: [{ name: "merchant", type: "address", internalType: "address" }, { name: "amount", type: "uint256", internalType: "uint256" }, { name: "interval", type: "uint64", internalType: "uint64" }, { name: "maxCharges", type: "uint32", internalType: "uint32" }, { name: "active", type: "bool", internalType: "bool" }, { name: "memo", type: "string", internalType: "string" }] }], stateMutability: "view" },
  { type: "function", name: "getSubscription", inputs: [{ name: "subId", type: "uint256", internalType: "uint256" }], outputs: [{ name: "", type: "tuple", internalType: "struct SettlaV2.Subscription", components: [{ name: "subscriber", type: "address", internalType: "address" }, { name: "planId", type: "uint256", internalType: "uint256" }, { name: "startedAt", type: "uint64", internalType: "uint64" }, { name: "lastChargedAt", type: "uint64", internalType: "uint64" }, { name: "chargeCount", type: "uint32", internalType: "uint32" }, { name: "active", type: "bool", internalType: "bool" }] }], stateMutability: "view" },
  { type: "function", name: "invoicesOf", inputs: [{ name: "merchant", type: "address", internalType: "address" }], outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "nextId", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nextPlanId", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nextSubId", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "pay", inputs: [{ name: "id", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "plansOf", inputs: [{ name: "merchant", type: "address", internalType: "address" }], outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "subscribe", inputs: [{ name: "planId", type: "uint256", internalType: "uint256" }], outputs: [{ name: "subId", type: "uint256", internalType: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "subscriptionsOf", inputs: [{ name: "subscriber", type: "address", internalType: "address" }], outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "usdc", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract IERC20" }], stateMutability: "view" },
  { type: "event", name: "Charged", inputs: [{ name: "subId", type: "uint256", indexed: true, internalType: "uint256" }, { name: "planId", type: "uint256", indexed: true, internalType: "uint256" }, { name: "subscriber", type: "address", indexed: true, internalType: "address" }, { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }], anonymous: false },
  { type: "event", name: "InvoiceCancelled", inputs: [{ name: "id", type: "uint256", indexed: true, internalType: "uint256" }], anonymous: false },
  { type: "event", name: "InvoiceCreated", inputs: [{ name: "id", type: "uint256", indexed: true, internalType: "uint256" }, { name: "merchant", type: "address", indexed: true, internalType: "address" }, { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }, { name: "memo", type: "string", indexed: false, internalType: "string" }], anonymous: false },
  { type: "event", name: "PlanCreated", inputs: [{ name: "planId", type: "uint256", indexed: true, internalType: "uint256" }, { name: "merchant", type: "address", indexed: true, internalType: "address" }, { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }, { name: "interval", type: "uint64", indexed: false, internalType: "uint64" }, { name: "maxCharges", type: "uint32", indexed: false, internalType: "uint32" }, { name: "memo", type: "string", indexed: false, internalType: "string" }], anonymous: false },
  { type: "event", name: "PlanDeactivated", inputs: [{ name: "planId", type: "uint256", indexed: true, internalType: "uint256" }], anonymous: false },
  { type: "event", name: "Settled", inputs: [{ name: "id", type: "uint256", indexed: true, internalType: "uint256" }, { name: "merchant", type: "address", indexed: true, internalType: "address" }, { name: "payer", type: "address", indexed: true, internalType: "address" }, { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }], anonymous: false },
  { type: "event", name: "Subscribed", inputs: [{ name: "subId", type: "uint256", indexed: true, internalType: "uint256" }, { name: "planId", type: "uint256", indexed: true, internalType: "uint256" }, { name: "subscriber", type: "address", indexed: true, internalType: "address" }], anonymous: false },
  { type: "event", name: "SubscriptionCancelled", inputs: [{ name: "subId", type: "uint256", indexed: true, internalType: "uint256" }], anonymous: false },
  { type: "error", name: "IntervalTooShort", inputs: [] },
  { type: "error", name: "MaxChargesReached", inputs: [] },
  { type: "error", name: "MemoTooLong", inputs: [] },
  { type: "error", name: "NotAContract", inputs: [] },
  { type: "error", name: "NotMerchant", inputs: [] },
  { type: "error", name: "NotMerchantOrSubscriber", inputs: [] },
  { type: "error", name: "NotOpen", inputs: [] },
  { type: "error", name: "NotSubscriber", inputs: [] },
  { type: "error", name: "PlanInactive", inputs: [] },
  { type: "error", name: "PlanNotFound", inputs: [] },
  { type: "error", name: "SubscriptionInactive", inputs: [] },
  { type: "error", name: "TooEarlyToCharge", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] },
] as const;

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
