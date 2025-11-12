# LangJourney - 语言学习成果证明平台

基于FHEVM的去中心化语言学习成果存证与认证平台，支持本地Mock模式和Sepolia测试网的Relayer SDK模式。

> 安全提示  
> 本项目不在仓库中保存任何助记词、私钥或第三方 API Key。请使用 Hardhat Vars 或进程环境变量传递敏感信息，避免写入并提交到仓库。

## 项目结构

```
action/
├── contracts/          # 智能合约
│   ├── contracts/
│   │   └── LangJourney.sol
│   ├── deploy/
│   │   └── deploy.ts
│   └── hardhat.config.ts
└── frontend/          # 前端应用
    ├── app/
    ├── components/
    ├── fhevm/         # FHEVM集成
    ├── hooks/
    └── package.json
```

## 功能特性

- ✅ **FHEVM加密存储**: 使用全同态加密存储学习数据
- ✅ **双模式支持**: 本地Mock模式 + Sepolia测试网Relayer SDK模式
- ✅ **精美UI**: 移动优先的现代化界面设计
- ✅ **完整工作流**: 创建路径 → 提交任务 → 审核 → 解密

## 快速开始

### 1. 安装依赖

#### 合约部分
```bash
cd contracts
npm install
```

#### 前端部分
```bash
cd frontend
npm install
```

### 2. 本地开发（Mock模式）

#### 启动Hardhat节点（需要FHEVM插件）
```bash
cd contracts
npx hardhat node
```

#### 部署合约
```bash
npx hardhat deploy --network localhost
```

#### 启动前端
```bash
cd frontend
npm run dev:mock
```

前端会自动检测到本地Hardhat节点（chainId: 31337），使用Mock模式与FHEVM合约交互。

### 3. Sepolia测试网（Relayer SDK模式）

#### 配置 Hardhat Vars（推荐，避免将密钥写入文件）
```bash
# 在 contracts 目录下执行
cd contracts

# 必填：部署私钥（务必以 0x 开头）
npx hardhat vars set PRIVATE_KEY 0xYOUR_PRIVATE_KEY

# 任选其一：
# A) 直接设置完整的 RPC URL
npx hardhat vars set SEPOLIA_RPC_URL https://sepolia.infura.io/v3/<YOUR_INFURA_PROJECT_ID>
# 或使用 Alchemy/Ankr 等服务的 Sepolia RPC

# B)（可选）如果你想沿用 infura 的拼接方式
npx hardhat vars set INFURA_API_KEY <YOUR_INFURA_PROJECT_ID>

# （可选）Etherscan 验证用
npx hardhat vars set ETHERSCAN_API_KEY <YOUR_ETHERSCAN_KEY>
```

#### 部署到Sepolia
```bash
cd contracts
npx hardhat deploy --network sepolia
```

#### 配置前端合约地址
在`frontend`目录创建`.env.local`文件：
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

#### 启动前端
```bash
cd frontend
npm run dev
```

前端会自动检测到Sepolia网络（chainId: 11155111），使用Relayer SDK模式与FHEVM合约交互。

## 核心功能

### 1. 创建学习路径
- 输入Path CID（IPFS）
- 输入任务总数（将使用FHE加密存储）
- 调用合约创建路径

### 2. 提交学习任务
- 选择路径ID和任务ID
- 输入Submission CID（IPFS）
- 输入分数（将使用FHE加密存储）
- 提交到链上

### 3. 审核提交（教师）
- 选择Submission ID
- 输入新分数（将使用FHE加密存储）
- 在加密状态下更新分数

### 4. 解密数据
- 输入加密句柄（Handle）
- 使用EIP-712签名授权
- 解密并显示明文值

## 技术栈

### 合约
- Solidity 0.8.27
- FHEVM Solidity Library
- Hardhat
- @fhevm/hardhat-plugin

### 前端
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- ethers.js v6
- @zama-fhe/relayer-sdk
- @fhevm/mock-utils

## 注意事项

1. **本地开发**: 确保Hardhat节点已安装`@fhevm/hardhat-plugin`插件
2. **测试网**: 需要配置Infura API密钥和钱包助记词
3. **合约地址**: 部署后需要更新前端的合约地址配置
4. **IPFS**: 实际使用时需要配置IPFS节点或使用IPFS服务

## 许可证

MIT
