const { artifacts, ethers, network, run } = require("hardhat");
const fs = require("fs");
const path = require("path");

const deploymentsDir = path.join(__dirname, "..", "deployments");

function deploymentPath(networkName) {
  const file = networkName === "arcMainnet" ? "arc-mainnet.json" : `${networkName}.json`;
  return path.join(deploymentsDir, file);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Writes the compiler's Standard JSON input for Settla, for the explorer's manual
 * "Verify & Publish" page, and prints what to fill in there.
 */
async function writeManualVerificationFiles(address, usdc) {
  const fqn = "contracts/Settla.sol:Settla";
  const buildInfo = await artifacts.getBuildInfo(fqn);
  const file = path.join(deploymentsDir, `${network.name}-standard-input.json`);
  fs.writeFileSync(file, JSON.stringify(buildInfo.input, null, 2) + "\n");
  const args = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [usdc]).slice(2);
  const browser = network.config.chainId === 5042 ? "https://explorer.arc.io" : "https://explorer.testnet.arc.io";

  console.log(`
Verify manually at ${browser}/address/${address}#code -> "Verify & Publish":
  Method:            Solidity (Standard JSON input)
  Compiler:          v${buildInfo.solcLongVersion}
  Contract name:     ${fqn}
  Standard JSON:     ${file}
  Constructor args:  ${args}
`);
}

/**
 * Verifies Settla on the network's Blockscout explorer. The explorer can lag a few seconds
 * behind the chain, so a fresh deployment may need a couple of attempts. If the API can't be
 * reached at all, falls back to printing manual verification instructions.
 */
async function verifySettla(address, usdc, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      // verify:verify only covers Etherscan and Sourcify; Blockscout has its own subtask and
      // reads the constructor arguments from the creation transaction.
      await run("verify:blockscout", { address, contract: "contracts/Settla.sol:Settla", libraries: {} });
      return true;
    } catch (e) {
      const msg = String(e.message || e);
      if (/already verified/i.test(msg)) {
        console.log("Already verified.");
        return true;
      }
      // An HTML page instead of JSON means the API is behind a bot check; retrying won't help.
      const blocked = /not valid JSON|DOCTYPE/i.test(msg);
      if (blocked || i === attempts) {
        console.error(`Automatic verification failed: ${msg.trim()}`);
        await writeManualVerificationFiles(address, usdc);
        return false;
      }
      console.log(`Explorer not ready (attempt ${i}/${attempts}), retrying in 10s...`);
      await sleep(10_000);
    }
  }
}

async function main() {
  const file = deploymentPath(network.name);
  const { address, usdc } = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  if (!address || !usdc) throw new Error(`No deployment recorded in ${file}. Deploy first.`);
  if (!(await verifySettla(address, usdc))) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { deploymentPath, verifySettla };
