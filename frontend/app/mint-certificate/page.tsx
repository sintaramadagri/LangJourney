"use client";

import { useState } from "react";
import WalletGuard from "@/components/WalletGuard";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useLangJourney } from "@/hooks/useLangJourney";
import { getLangJourneyAddress } from "@/abi/LangJourneyAddress";

const CONTRACT_ADDRESS = getLangJourneyAddress("sepolia") as `0x${string}`;

export default function MintCertificatePage() {
  const { storage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    initialMockChains,
    isConnected,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: isConnected,
  });

  const { mintCertificate, message, isLoading } = useLangJourney({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage: storage,
    contractAddress: CONTRACT_ADDRESS,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  });

  const [pathId, setPathId] = useState<number>(1);
  const [certTitle, setCertTitle] = useState("语言学习成就证书");
  const [certDescription, setCertDescription] = useState("完成了所有学习任务");
  const [finalScore, setFinalScore] = useState(90);

  const handleMint = async () => {
    if (!pathId) {
      alert("请输入路径ID");
      return;
    }

    // 生成证书元数据（简化版，实际应该上传到IPFS）
    const certMetadata = {
      title: certTitle,
      description: certDescription,
      pathId: pathId,
      issuedAt: new Date().toISOString(),
    };

    // 简化：使用固定的CID，实际应该上传元数据到IPFS
    const certCID = `Qm${Math.random().toString(36).substring(2, 15)}`;

    await mintCertificate(pathId, certCID, finalScore);
  };

  return (
    <WalletGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
              铸造学习证书 🏆
            </h1>
            <p className="text-gray-600">
              完成所有学习任务后，铸造您的成就证书
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">ℹ️</div>
              <div>
                <h3 className="font-bold text-blue-900 mb-2">
                  铸造证书说明
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 确保您已完成学习路径中的所有任务</li>
                  <li>• 所有任务都已通过审核</li>
                  <li>• 输入您的最终总分（将被加密存储）</li>
                  <li>• 证书一旦铸造将永久保存在区块链上</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mint Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
              <h2 className="text-2xl font-bold text-white">证书信息</h2>
              <p className="text-white/80 text-sm mt-1">
                填写证书的基本信息
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Path ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  学习路径 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={pathId}
                  onChange={(e) => setPathId(parseInt(e.target.value))}
                  placeholder="输入路径ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  您完成的学习路径的ID
                </p>
              </div>

              {/* Certificate Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  证书标题
                </label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="例如：商务英语入门课程"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
                />
              </div>

              {/* Certificate Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  证书描述
                </label>
                <textarea
                  value={certDescription}
                  onChange={(e) => setCertDescription(e.target.value)}
                  placeholder="描述您的学习成果..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none"
                />
              </div>

              {/* Final Score */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  最终总分（0-100）🔒
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={finalScore}
                    onChange={(e) => setFinalScore(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="text-3xl font-bold text-yellow-600 min-w-[80px] text-center">
                    {finalScore}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  🔒 分数将在加密状态下存储到链上
                </p>
              </div>

              {/* Preview Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
                <div className="text-center">
                  <div className="text-6xl mb-3">🏆</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {certTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {certDescription}
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-sm text-gray-600">最终得分:</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {finalScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Encryption Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🔐</div>
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1 text-sm">
                      加密铸造
                    </h4>
                    <p className="text-xs text-purple-800">
                      您的最终分数将通过FHEVM加密后存储在区块链上，确保隐私性的同时保证证书的可验证性。
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">{message}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleMint}
                disabled={isLoading || !pathId}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>铸造中...</span>
                  </span>
                ) : !pathId ? (
                  "请输入路径ID"
                ) : (
                  "🏆 铸造证书"
                )}
              </button>

              {/* Help Text */}
              <p className="text-xs text-center text-gray-500">
                铸造证书需要发送一笔链上交易，请确保您的钱包有足够的 Gas
              </p>
            </div>
          </div>
        </div>
      </div>
    </WalletGuard>
  );
}


