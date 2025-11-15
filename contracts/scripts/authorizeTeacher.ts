import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  const CONTRACT_ADDRESS =
    process.env.CONTRACT_ADDRESS || process.argv[2] || "";
  const TEACHER_ADDRESS =
    process.env.TEACHER_ADDRESS || process.argv[3] || "";

  if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
    throw new Error(
      "Missing or invalid CONTRACT_ADDRESS. Pass via env or args: CONTRACT_ADDRESS=0x... TEACHER_ADDRESS=0x... npm ts-node scripts/authorizeTeacher.ts"
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(TEACHER_ADDRESS)) {
    throw new Error(
      "Missing or invalid TEACHER_ADDRESS. Pass via env or args: CONTRACT_ADDRESS=0x... TEACHER_ADDRESS=0x... npm ts-node scripts/authorizeTeacher.ts"
    );
  }

  console.log("Authorizing teacher:", TEACHER_ADDRESS);
  console.log("Contract address:", CONTRACT_ADDRESS);

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // 获取合约实例
  const LangJourney = await hre.ethers.getContractAt("LangJourney", CONTRACT_ADDRESS);

  // 检查当前授权状态
  const isAuthorized = await LangJourney.authorizedTeachers(TEACHER_ADDRESS);
  console.log("Current authorization status:", isAuthorized);

  if (isAuthorized) {
    console.log("✅ Teacher is already authorized!");
    return;
  }

  // 授权教师
  console.log("Authorizing teacher...");
  const tx = await LangJourney.setTeacherAuthorization(TEACHER_ADDRESS, true);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt?.blockNumber);
  console.log("✅ Teacher authorized successfully!");

  // 验证授权
  const newStatus = await LangJourney.authorizedTeachers(TEACHER_ADDRESS);
  console.log("New authorization status:", newStatus);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

