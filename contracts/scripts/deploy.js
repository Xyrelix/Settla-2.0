const { ethers, network } = require("hardhat");
const fs = require("fs");
const { deploymentPath, verifySettla } = require("./verify");

async function main() {
  const usdc = process.env.USDC_ADDRESS;
  if (!usdc || !ethers.isAddress(usdc)) {
    throw new Error("Set USDC_ADDRESS in contracts/.env");
  }

  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set DEPLOYER_PRIVATE_KEY in contracts/.env");
  console.log(`Deploying from ${deployer.address} to ${network.name}`);

  const Settla = await ethers.getContractFactory("Settla");
  const settla = await Settla.deploy(usdc);
  await settla.waitForDeployment();
  const address = await settla.getAddress();
  console.log("Settla deployed to:", address);

  const file = deploymentPath(network.name);
  fs.mkdirSync(require("path").dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        network: network.name,
        chainId: network.config.chainId,
        address,
        usdc,
        txHash: settla.deploymentTransaction()?.hash,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Recorded in", file);

  if (network.config.chainId === 5042 || network.config.chainId === 5042002) {
    console.log("Verifying source on the explorer...");
    await verifySettla(address, usdc);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
