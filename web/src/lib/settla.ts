import { BaseError, formatUnits, isAddress, type Address } from "viem";

export { settlaAbi } from "./settla.abi";

const settlaEnv = process.env.NEXT_PUBLIC_SETTLA_ADDRESS;
const usdcEnv = process.env.NEXT_PUBLIC_USDC_ADDRESS;

export const SETTLA_ADDRESS = (settlaEnv && isAddress(settlaEnv) ? settlaEnv : undefined) as
  | Address
  | undefined;
export const USDC_ADDRESS: Address =
  usdcEnv && isAddress(usdcEnv) ? usdcEnv : "0x3600000000000000000000000000000000000000";
export const USDC_DECIMALS = 6;
export const MAX_MEMO_BYTES = 280;

export const Status = { None: 0, Open: 1, Paid: 2, Cancelled: 3 } as const;
export const STATUS_LABEL = ["Not found", "Open", "Paid", "Cancelled"] as const;

export function formatUsdc(amount: bigint) {
  return Number(formatUnits(amount, USDC_DECIMALS)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: USDC_DECIMALS,
  });
}

export function memoBytes(memo: string) {
  return new TextEncoder().encode(memo).length;
}

export function errorMessage(e: unknown) {
  if (e instanceof BaseError) return e.shortMessage;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}
