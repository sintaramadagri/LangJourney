import hre from "hardhat";

async function main() {
  console.log("Deploying LangJourney contract...");

  const LangJourney = await hre.ethers.getContractFactory("LangJourney");
  const langJourney = await LangJourney.deploy();

  await langJourney.waitForDeployment();

  const address = await langJourney.getAddress();
  console.log("LangJourney deployed to:", address);
  console.log("\n请更新前端中的 CONTRACT_ADDRESS 为:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



