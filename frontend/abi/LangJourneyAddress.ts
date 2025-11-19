export const LangJourneyAddress = {
  // 填入你在测试网（Sepolia）部署得到的合约地址
  sepolia: "0x0000000000000000000000000000000000000000",
  // 如需本地开发，可在启动 hardhat node 后替换
  localhost: "0x0000000000000000000000000000000000000000",
} as const;

export type NetworkKey = keyof typeof LangJourneyAddress;

export function getLangJourneyAddress(network: NetworkKey = "sepolia") {
  return LangJourneyAddress[network];
}


