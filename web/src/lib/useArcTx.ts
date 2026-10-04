"use client";
import type { Abi } from "viem";
import { useAccount, useConfig, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt, writeContract, type WriteContractParameters } from "wagmi/actions";
import { arc } from "./arc";
import type { config as wagmiConfig } from "./wagmi";

type ArcWrite = WriteContractParameters<Abi, string, readonly unknown[], typeof wagmiConfig>;
// Callers never pick the chain: every write goes to Arc.
type WriteParams = Omit<ArcWrite, "chainId">;

/** Switches the wallet to Arc if needed, sends a contract write, and waits for the receipt. */
export function useArcTx() {
  const config = useConfig();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  async function ensureArc() {
    if (chainId !== arc.id) await switchChainAsync({ chainId: arc.id });
  }

  async function send(params: WriteParams) {
    await ensureArc();
    const hash = await writeContract(config, { ...params, chainId: arc.id } as ArcWrite);
    const receipt = await waitForTransactionReceipt(config, { hash, chainId: arc.id });
    if (receipt.status !== "success") throw new Error("Transaction reverted");
    return receipt;
  }

  return { send, ensureArc };
}
