const { ethers } = require("hardhat");

async function main() {
  const USDC = "0x3600000000000000000000000000000000000000";
  console.log("Deploying SettlaV2 with USDC:", USDC);

  const SettlaV2 = await ethers.getContractFactory("SettlaV2");
  const contract = await SettlaV2.deploy(USDC);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("SettlaV2 deployed to:", address);
  console.log("Deployment tx:", contract.deploymentTransaction()?.hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
