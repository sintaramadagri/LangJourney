"use client";

import { useState } from "react";
import WalletGuard from "@/components/WalletGuard";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useLangJourney } from "@/hooks/useLangJourney";
import { getLangJourneyAddress } from "@/abi/LangJourneyAddress";

const CONTRACT_ADDRESS = getLangJourneyAddress("sepolia") as `0x${string}`;

export default function SubmitTaskPage() {
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

  const { submitTask, message, isLoading } = useLangJourney({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage: storage,
    contractAddress: CONTRACT_ADDRESS,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  });

  const [formData, setFormData] = useState({
    pathId: 1,
    taskId: 1,
    taskType: "听力练习",
    content: "",
    score: 85,
    notes: "",
  });

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 模拟生成IPFS CID
    const submissionMetadata = {
      taskType: formData.taskType,
      content: formData.content,
      notes: formData.notes,
      fileName: file?.name,
      submittedAt: new Date().toISOString(),
    };
    
    const mockCID = `Qm${Math.random().toString(36).substring(2, 15)}`;
    
    await submitTask(
      formData.pathId,
      formData.taskId,
      mockCID,
      formData.score
    );
  };

  return (
    <WalletGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-green-50 via-white to-blue-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
              提交学习任务 📝
            </h1>
            <p className="text-gray-600">
              上传您的学习成果，成绩将经过加密存储
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <h2 className="text-2xl font-bold text-white">提交详情</h2>
              <p className="text-white/80 text-sm mt-1">
                您的分数将使用FHEVM加密存储在链上
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Path and Task IDs */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    学习路径 ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.pathId}
                    onChange={(e) => setFormData({ ...formData, pathId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    任务 ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.taskId}
                    onChange={(e) => setFormData({ ...formData, taskId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Task Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  任务类型
                </label>
                <select
                  value={formData.taskType}
                  onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                >
                  <option>听力练习</option>
                  <option>口语练习</option>
                  <option>阅读理解</option>
                  <option>写作练习</option>
                  <option>语法练习</option>
                  <option>词汇测试</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  任务内容/答案
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="输入您的答案或内容..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  附件上传（音频/视频/文档）
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-all">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                    accept="audio/*,video/*,.pdf,.doc,.docx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <div className="text-5xl mb-4">📎</div>
                    {file ? (
                      <div>
                        <p className="font-semibold text-green-600 mb-1">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">
                          点击上传文件
                        </p>
                        <p className="text-sm text-gray-500">
                          支持音频、视频、PDF等格式
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Score */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  自评分数（0-100）🔒
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <div className="text-3xl font-bold text-green-600 min-w-[80px] text-center">
                    {formData.score}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  🔒 此分数将使用FHEVM加密存储，教师审核时可调整
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  备注说明
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="添加任何您想说明的信息..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🔐</div>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">
                      隐私保护
                    </h4>
                    <p className="text-sm text-green-800">
                      您的分数将经过FHEVM加密后存储在链上。只有经过授权的教师才能在加密状态下进行审核和评分。
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
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>提交中...</span>
                    </span>
                  ) : (
                    "提交任务"
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

