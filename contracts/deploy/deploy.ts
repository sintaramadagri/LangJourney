import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedLangJourney = await deploy("LangJourney", {
    from: deployer,
    log: true,
  });

  console.log(`LangJourney contract deployed at: ${deployedLangJourney.address}`);
};

export default func;
func.id = "deploy_langjourney";
func.tags = ["LangJourney"];



