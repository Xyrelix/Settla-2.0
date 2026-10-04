const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

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

  const dir = path.join(__dirname, "..", "deployments");
  const file = network.name === "arcMainnet" ? "arc-mainnet.json" : `${network.name}.json`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, file),
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
