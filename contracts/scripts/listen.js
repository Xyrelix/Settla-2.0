require("dotenv").config({ quiet: true });
const { ethers } = require("ethers");
const abi = require("../../web/src/lib/settla.abi.json");

const { ARC_MAINNET_RPC, SETTLA_ADDRESS, MERCHANT_ADDRESS } = process.env;
if (!SETTLA_ADDRESS) throw new Error("Set SETTLA_ADDRESS in contracts/.env");

const provider = new ethers.JsonRpcProvider(ARC_MAINNET_RPC || "https://rpc.mainnet.arc.io");
const settla = new ethers.Contract(SETTLA_ADDRESS, abi, provider);

// merchant is indexed on Settled, so filter on it when MERCHANT_ADDRESS is set.
const filter = settla.filters.Settled(null, MERCHANT_ADDRESS || null);

settla.on(filter, (id, merchant, payer, amount, event) => {
  console.log(`Invoice #${id} paid by ${payer}: ${ethers.formatUnits(amount, 6)} USDC`);
  console.log(`tx: ${event.log.transactionHash}`);
});

console.log(
  `Listening for Settled on ${SETTLA_ADDRESS}` +
    (MERCHANT_ADDRESS ? ` for merchant ${MERCHANT_ADDRESS}` : ""),
);
