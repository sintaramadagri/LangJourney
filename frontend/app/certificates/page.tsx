"use client";

import { useState, useEffect } from "react";
import WalletGuard from "@/components/WalletGuard";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useCertificates } from "@/hooks/useCertificates";
import { getLangJourneyAddress } from "@/abi/LangJourneyAddress";

const CONTRACT_ADDRESS = getLangJourneyAddress("sepolia") as `0x${string}`;

export default function CertificatesPage() {
  const { storage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    initialMockChains,
    isConnected,
    accounts,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: isConnected,
  });

  const {
    certificates,
    isLoading,
    error,
    fetchCertificates,
    decryptAndUpdateCertificate,
  } = useCertificates({
    contractAddress: CONTRACT_ADDRESS,
    ethersReadonlyProvider,
    instance: fhevmInstance,
    ethersSigner,
    fhevmDecryptionSignatureStorage: storage,
    chainId,
    userAddress: accounts?.[0], // 只获取当前用户的证书
  });

  const [decryptingCerts, setDecryptingCerts] = useState<Set<number>>(new Set());

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

  const handleDecryptScore = async (certId: number) => {
    setDecryptingCerts((prev) => new Set(prev).add(certId));
    try {
      await decryptAndUpdateCertificate(certId);
    } catch (error) {
      console.error("Error decrypting certificate score:", error);
    } finally {
      setDecryptingCerts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(certId);
        return newSet;
      });
    }
  };

  // 计算统计数据
  const stats = certificates.reduce(
    (acc, cert) => {
      if (cert.decryptedScore !== undefined) {
        acc.totalScore += Number(cert.decryptedScore);
        acc.decryptedCount++;
      }
      return acc;
    },
    { totalScore: 0, decryptedCount: 0 }
  );

  const averageScore =
    stats.decryptedCount > 0
      ? Math.round(stats.totalScore / stats.decryptedCount)
      : 0;

  return (
    <WalletGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
              我的证书 🏆
            </h1>
            <p className="text-gray-600">
              查看您已获得的学习成就证书
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">错误: {error}</p>
            </div>
          )}

          {/* Certificates Grid */}
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">加载证书中...</p>
            </div>
          ) : certificates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="group bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2"
                >
                  {/* Certificate Header */}
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 text-white">
                    <div className="text-6xl mb-4 text-center">🏆</div>
                    <h3 className="text-xl font-bold text-center mb-2">
                      学习成就证书
                    </h3>
                    <div className="text-center text-sm opacity-90">
                      Certificate of Achievement
                    </div>
                  </div>

                  {/* Certificate Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg mb-1">
                        路径 #{cert.pathId}
                      </h4>
                      {cert.pathCID && (
                        <p className="text-xs text-gray-500 truncate">
                          CID: {cert.pathCID}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">获得日期:</span>
                        <span className="font-semibold">
                          {formatDate(cert.mintedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">综合得分:</span>
                        {cert.decryptedScore !== undefined ? (
                          <span className="text-2xl font-bold text-yellow-600">
                            {Number(cert.decryptedScore)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            🔒 加密中
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">证书 ID:</span>
                        <span className="font-mono text-xs">#{cert.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">学习者:</span>
                        <span className="font-mono text-xs">
                          {formatAddress(cert.learner)}
                        </span>
                      </div>
                    </div>

                    {/* Decrypt Button */}
                    {cert.decryptedScore === undefined && (
                      <button
                        onClick={() => handleDecryptScore(cert.id)}
                        disabled={decryptingCerts.has(cert.id)}
                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {decryptingCerts.has(cert.id) ? (
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
                            <span>解密分数</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Actions */}
                    <div className="pt-4 space-y-2">
                      {cert.certCID && (
                        <a
                          href={`https://ipfs.io/ipfs/${cert.certCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-center"
                        >
                          查看证书详情
                        </a>
                      )}
                    </div>

                    {/* Verification Link */}
                    <div className="pt-4 border-t border-gray-100">
                      <a
                        href={`https://ipfs.io/ipfs/${cert.certCID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-primary flex items-center justify-center space-x-1"
                      >
                        <span>🔗 链上验证</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
              <div className="text-8xl mb-6">🎓</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                暂无证书
              </h3>
              <p className="text-gray-600 mb-8">
                完成学习路径后即可获得证书
              </p>
              <button
                onClick={() => window.location.href = "/create-path"}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                开始学习
              </button>
            </div>
          )}

          {/* Stats Summary */}
          {certificates.length > 0 && (
            <div className="mt-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                学习统计
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">
                    {certificates.length}
                  </div>
                  <div className="text-sm text-gray-600">获得证书</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {averageScore > 0 ? averageScore : "—"}
                  </div>
                  <div className="text-sm text-gray-600">平均分数</div>
                  {stats.decryptedCount < certificates.length && (
                    <div className="text-xs text-gray-400 mt-1">
                      ({stats.decryptedCount}/{certificates.length} 已解密)
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {new Set(certificates.map((c) => c.pathId)).size}
                  </div>
                  <div className="text-sm text-gray-600">完成路径</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {certificates.length}
                  </div>
                  <div className="text-sm text-gray-600">证书总数</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </WalletGuard>
  );
}
