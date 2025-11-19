"use client";

import { useState } from "react";
import WalletGuard from "@/components/WalletGuard";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useLangJourney } from "@/hooks/useLangJourney";
import { getLangJourneyAddress } from "@/abi/LangJourneyAddress";

const CONTRACT_ADDRESS = getLangJourneyAddress("sepolia") as `0x${string}`;

export default function CreatePathPage() {
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

  const { createPath, message, isLoading } = useLangJourney({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage: storage,
    contractAddress: CONTRACT_ADDRESS,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "英语",
    level: "初级",
    totalTasks: 5,
    duration: "30",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 模拟生成IPFS CID
    const pathMetadata = {
      title: formData.title,
      description: formData.description,
      language: formData.language,
      level: formData.level,
      duration: formData.duration,
      createdAt: new Date().toISOString(),
    };
    
    const mockCID = `Qm${Math.random().toString(36).substring(2, 15)}`;
    
    await createPath(mockCID, formData.totalTasks);
  };

  return (
    <WalletGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
              创建学习路径 🎯
            </h1>
            <p className="text-gray-600">
              设计一条完整的语言学习路径，包含多个学习任务
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-light p-6">
              <h2 className="text-2xl font-bold text-white">路径信息</h2>
              <p className="text-white/80 text-sm mt-1">
                所有关键数据将使用FHEVM加密存储
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  路径名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：商务英语入门课程"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  路径描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述这条学习路径的目标和内容..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Language and Level */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    目标语言
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option>英语</option>
                    <option>日语</option>
                    <option>韩语</option>
                    <option>法语</option>
                    <option>德语</option>
                    <option>西班牙语</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    难度等级
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option>初级</option>
                    <option>中级</option>
                    <option>高级</option>
                  </select>
                </div>
              </div>

              {/* Tasks and Duration */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    任务总数（加密存储） 🔒
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.totalTasks}
                    onChange={(e) => setFormData({ ...formData, totalTasks: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    将使用FHEVM加密存储
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    预计时长（天）
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      关于FHEVM加密
                    </h4>
                    <p className="text-sm text-blue-800">
                      任务总数将使用全同态加密（FHE）存储在链上，只有授权用户才能解密查看。这确保了您的学习数据隐私安全。
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
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>创建中...</span>
                    </span>
                  ) : (
                    "创建路径"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </WalletGuard>
  );
}

