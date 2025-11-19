"use client";

import { useState, useEffect } from "react";
import WalletGuard from "@/components/WalletGuard";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useSubmissions } from "@/hooks/useSubmissions";
import { getLangJourneyAddress } from "@/abi/LangJourneyAddress";

const CONTRACT_ADDRESS = getLangJourneyAddress("sepolia") as `0x${string}`;

export default function ReviewedPage() {
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

  const {
    submissions: reviewedSubmissions,
    isLoading,
    error,
    fetchReviewedSubmissions,
    decryptAndUpdateSubmission,
  } = useSubmissions({
    contractAddress: CONTRACT_ADDRESS,
    ethersReadonlyProvider,
    instance: fhevmInstance,
    ethersSigner,
    fhevmDecryptionSignatureStorage: storage,
    chainId,
  });

  const [decryptingSubs, setDecryptingSubs] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | 1 | 2>("all");

  useEffect(() => {
    fetchReviewedSubmissions();
  }, [fetchReviewedSubmissions]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDecryptScore = async (submissionId: number) => {
    setDecryptingSubs((prev) => new Set(prev).add(submissionId));
    try {
      await decryptAndUpdateSubmission(submissionId);
    } catch (error) {
      console.error("Error decrypting submission score:", error);
    } finally {
      setDecryptingSubs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  // 过滤提交
  const filteredSubmissions = reviewedSubmissions.filter((sub) => {
    if (filterStatus === "all") return true;
    return sub.status === filterStatus;
  });

  // 统计信息
  const stats = {
    total: reviewedSubmissions.length,
    approved: reviewedSubmissions.filter((s) => s.status === 1).length,
    rejected: reviewedSubmissions.filter((s) => s.status === 2).length,
    decrypted: reviewedSubmissions.filter((s) => s.decryptedScore !== undefined).length,
  };

  return (
    <WalletGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-green-50 via-white to-blue-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
              审核完成记录 📋
            </h1>
            <p className="text-gray-600">
              查看已审核的提交记录，解密查看评分详情
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">错误: {error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">总审核数</div>
            </div>
            <div className="bg-green-50 rounded-xl shadow-lg border border-green-200 p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.approved}
              </div>
              <div className="text-sm text-gray-600">已通过</div>
            </div>
            <div className="bg-red-50 rounded-xl shadow-lg border border-red-200 p-4">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {stats.rejected}
              </div>
              <div className="text-sm text-gray-600">已拒绝</div>
            </div>
            <div className="bg-purple-50 rounded-xl shadow-lg border border-purple-200 p-4">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.decrypted}
              </div>
              <div className="text-sm text-gray-600">已解密</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === "all"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterStatus(1)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 1
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ✅ 已通过
              </button>
              <button
                onClick={() => setFilterStatus(2)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 2
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ❌ 已拒绝
              </button>
            </div>
            <button
              onClick={() => fetchReviewedSubmissions()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-sm font-semibold"
            >
              🔄 刷新
            </button>
          </div>

          {/* Submissions List */}
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="grid gap-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {submission.status === 1 ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            ✅ 已通过
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            ❌ 已拒绝
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          #{submission.id}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        路径 #{submission.pathId} - 任务 #{submission.taskId}
                      </h3>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">学习者:</span>
                        <span className="font-mono font-semibold text-xs">
                          {formatAddress(submission.learner)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">审核人:</span>
                        <span className="font-mono font-semibold text-xs">
                          {formatAddress(submission.verifier)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">提交时间:</span>
                        <span className="text-xs">
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">提交CID:</span>
                        <a
                          href={`https://ipfs.io/ipfs/${submission.submissionCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-blue-600 hover:underline truncate max-w-[200px]"
                        >
                          {submission.submissionCID}
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">评分:</span>
                        {submission.decryptedScore !== undefined ? (
                          <span className="text-2xl font-bold text-green-600">
                            {Number(submission.decryptedScore)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            🔒 加密中
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Decrypt Button */}
                  {submission.decryptedScore === undefined && submission.status === 1 && (
                    <button
                      onClick={() => handleDecryptScore(submission.id)}
                      disabled={decryptingSubs.has(submission.id)}
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {decryptingSubs.has(submission.id) ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            viewBox="0 0 24 24"
                          >
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
                          <span>解密中...</span>
                        </>
                      ) : (
                        <>
                          <span>🔓</span>
                          <span>解密查看分数</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* View Submission Link */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={`https://ipfs.io/ipfs/${submission.submissionCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-blue-600 flex items-center justify-center space-x-1"
                    >
                      <span>🔗 查看提交内容</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
              <div className="text-8xl mb-6">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                暂无审核记录
              </h3>
              <p className="text-gray-600 mb-8">
                {filterStatus === "all"
                  ? "还没有任何提交被审核"
                  : filterStatus === 1
                  ? "还没有已通过的提交"
                  : "还没有已拒绝的提交"}
              </p>
            </div>
          )}
        </div>
      </div>
    </WalletGuard>
  );
}


