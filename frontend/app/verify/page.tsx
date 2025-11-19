"use client";

import { useState, useEffect } from "react";
import WalletGuard from "@/components/WalletGuard";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useLangJourney } from "@/hooks/useLangJourney";
import { useSubmissions } from "@/hooks/useSubmissions";
import { getLangJourneyAddress } from "@/abi/LangJourneyAddress";

const CONTRACT_ADDRESS = getLangJourneyAddress("sepolia") as `0x${string}`;

export default function VerifyPage() {
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

  const { verifySubmission, authorizeTeacher, checkTeacherAuth, message, isLoading } = useLangJourney({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage: storage,
    contractAddress: CONTRACT_ADDRESS,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  });

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const { accounts } = useMetaMaskEthersSigner();

  // 检查当前用户的授权状态
  useEffect(() => {
    const checkAuth = async () => {
      if (!accounts?.[0] || !checkTeacherAuth) return;
      
      setIsCheckingAuth(true);
      try {
        const authorized = await checkTeacherAuth(accounts[0]);
        setIsAuthorized(authorized);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [accounts, checkTeacherAuth]);

  const {
    submissions: pendingSubmissions,
    isLoading: isLoadingSubmissions,
    fetchSubmission,
  } = useSubmissions({
    contractAddress: CONTRACT_ADDRESS,
    ethersReadonlyProvider,
    instance: fhevmInstance,
    ethersSigner,
    fhevmDecryptionSignatureStorage: storage,
    chainId,
  });

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [newScore, setNewScore] = useState(85);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"approve" | "reject">("approve");

  // 当选择submission时，加载详情
  useEffect(() => {
    if (selectedSubmissionId && fetchSubmission) {
      fetchSubmission(selectedSubmissionId).then((sub) => {
        if (sub) {
          setSelectedSubmission(sub);
          setNewScore(85); // 重置分数
        }
      });
    }
  }, [selectedSubmissionId, fetchSubmission]);

  const handleVerify = async () => {
    if (!selectedSubmissionId) return;
    const statusCode = status === "approve" ? 1 : 2;
    await verifySubmission(selectedSubmissionId, statusCode, newScore);
    // 审核成功后刷新列表
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

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

  return (
    <WalletGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
              审核任务提交 ✅
            </h1>
            <p className="text-gray-600">
              评估学习者的成果，在加密状态下进行评分
            </p>
          </div>

          {/* Teacher Authorization Status */}
          {accounts?.[0] && (
            <div className="mb-6">
              {isCheckingAuth ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 text-center">
                    ⏳ 检查教师授权状态...
                  </p>
                </div>
              ) : isAuthorized === false ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">⚠️</span>
                        <h3 className="font-bold text-yellow-900 text-lg">
                          未授权为教师
                        </h3>
                      </div>
                      <p className="text-sm text-yellow-800 mb-2">
                        您需要先授权为教师才能审核提交。点击下方按钮进行授权。
                      </p>
                      <p className="text-xs text-yellow-700">
                        💡 授权操作需要发送一笔链上交易
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (accounts[0]) {
                          await authorizeTeacher(accounts[0]);
                          // 重新检查授权状态
                          const authorized = await checkTeacherAuth(accounts[0]);
                          setIsAuthorized(authorized);
                        }
                      }}
                      disabled={isLoading}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                    >
                      {isLoading ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>授权中...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <span>🔐</span>
                          <span>授权为教师</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : isAuthorized === true ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800 text-center">
                    ✅ 您已授权为教师，可以审核提交
                  </p>
                </div>
              ) : null}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  待审核列表
                </h2>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                  🔄 刷新
                </button>
              </div>

              {isLoadingSubmissions ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">加载中...</p>
                </div>
              ) : pendingSubmissions.length > 0 ? (
                pendingSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className={`bg-white rounded-2xl shadow-lg border-2 p-6 hover:shadow-xl transition-all cursor-pointer ${
                      selectedSubmissionId === submission.id
                        ? "border-purple-500"
                        : "border-gray-100"
                    }`}
                    onClick={() => setSelectedSubmissionId(submission.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            待审核
                          </span>
                          <span className="text-sm text-gray-500">
                            #{submission.id}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900">
                          任务 #{submission.taskId}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">学习者:</span>
                        <span className="font-mono font-semibold text-xs">
                          {formatAddress(submission.learner)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">路径ID:</span>
                        <span className="font-semibold">
                          {submission.pathId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">任务ID:</span>
                        <span className="font-semibold">
                          {submission.taskId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">提交时间:</span>
                        <span className="text-xs">
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">CID:</span>
                        <span className="font-mono text-xs text-gray-500 truncate max-w-[200px]">
                          {submission.submissionCID}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmissionId(submission.id);
                        }}
                        className="w-full py-2 bg-purple-50 text-purple-600 rounded-lg font-semibold hover:bg-purple-100 transition-all text-sm"
                      >
                        {selectedSubmissionId === submission.id
                          ? "✓ 已选择"
                          : "开始审核"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    暂无待审核
                  </h3>
                  <p className="text-gray-600">
                    所有提交都已审核完成
                  </p>
                </div>
              )}
            </div>

            {/* Verify Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-20 h-fit">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white">审核评分</h2>
                <p className="text-white/80 text-sm mt-1">
                  在加密状态下更新分数
                </p>
              </div>

              <div className="p-8 space-y-6">
                {/* Selected Submission Info */}
                {selectedSubmission ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">提交 ID:</span>
                      <span className="font-bold">#{selectedSubmission.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">学习者:</span>
                      <span className="font-mono text-xs">
                        {formatAddress(selectedSubmission.learner)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">路径/任务:</span>
                      <span className="font-semibold">
                        {selectedSubmission.pathId} / {selectedSubmission.taskId}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800 text-center">
                      ⚠️ 请从左侧列表选择一个待审核的提交
                    </p>
                  </div>
                )}

                {/* Submission ID (Manual Input) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    提交 ID（或手动输入）
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedSubmissionId || ""}
                    onChange={(e) => {
                      const id = parseInt(e.target.value);
                      setSelectedSubmissionId(id || null);
                    }}
                    placeholder="输入提交ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    审核结果
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setStatus("approve")}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        status === "approve"
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ✅ 通过
                    </button>
                    <button
                      onClick={() => setStatus("reject")}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        status === "reject"
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ❌ 不通过
                    </button>
                  </div>
                </div>

                {/* New Score */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    评定分数（0-100）🔒
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newScore}
                      onChange={(e) => setNewScore(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="text-3xl font-bold text-purple-600 min-w-[80px] text-center">
                      {newScore}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 分数将在加密状态下更新到链上
                  </p>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    评语反馈
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="给学习者一些建议和鼓励..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🔐</div>
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-1 text-sm">
                        加密审核
                      </h4>
                      <p className="text-xs text-purple-800">
                        您的评分将通过FHEVM加密后存储，确保审核过程的公正性和隐私性。
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
                  onClick={handleVerify}
                  disabled={isLoading || !selectedSubmissionId || isAuthorized === false}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>审核中...</span>
                    </span>
                  ) : isAuthorized === false ? (
                    "请先授权为教师"
                  ) : !selectedSubmissionId ? (
                    "请选择要审核的提交"
                  ) : (
                    "提交审核"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WalletGuard>
  );
}

