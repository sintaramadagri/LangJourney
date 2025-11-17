"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import Link from "next/link";

export default function Home() {
  const { chainId, accounts, isConnected } = useMetaMaskEthersSigner();
  const {
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider: typeof window !== "undefined" ? (window as any).ethereum : undefined,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected,
  });

  const quickActions = [
    {
      title: "创建学习路径",
      description: "开始新的语言学习旅程",
      icon: "🎯",
      href: "/create-path",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "提交学习任务",
      description: "上传您的学习成果",
      icon: "📝",
      href: "/submit-task",
      color: "from-green-500 to-green-600",
    },
    {
      title: "审核提交",
      description: "评估学习者的成果",
      icon: "✅",
      href: "/verify",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "我的证书",
      description: "查看已获得的成就证书",
      icon: "🏆",
      href: "/certificates",
      color: "from-yellow-500 to-yellow-600",
    },
  ];

  const stats = [
    { label: "学习路径", value: "0", icon: "🎓" },
    { label: "已完成任务", value: "0", icon: "✨" },
    { label: "获得证书", value: "0", icon: "🏅" },
    { label: "平均分数", value: "--", icon: "📊" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-4">
            欢迎来到 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">LangJourney</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            基于FHEVM的去中心化语言学习成果证明平台
          </p>
          
          {/* Status Cards */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="px-6 py-3 bg-white rounded-full shadow-md border border-gray-100">
              <span className="text-sm text-gray-600">链ID: </span>
              <span className="font-mono font-semibold text-primary">{chainId || "未连接"}</span>
            </div>
            <div className="px-6 py-3 bg-white rounded-full shadow-md border border-gray-100">
              <span className="text-sm text-gray-600">FHEVM: </span>
              <span className={`font-semibold ${
                fhevmStatus === "ready" ? "text-green-600" : 
                fhevmStatus === "loading" ? "text-yellow-600" : 
                "text-gray-600"
              }`}>
                {fhevmStatus === "ready" ? "✓ 就绪" : 
                 fhevmStatus === "loading" ? "⏳ 加载中" : 
                 "待激活"}
              </span>
            </div>
            {isConnected && (
              <div className="px-6 py-3 bg-white rounded-full shadow-md border border-gray-100">
                <span className="text-sm text-gray-600">地址: </span>
                <span className="font-mono font-semibold text-primary">
                  {accounts[0]?.slice(0, 6)}...{accounts[0]?.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {fhevmError && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ FHEVM错误: {fhevmError.message}
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">快速操作</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} text-white text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
                <div className="mt-4 flex items-center text-primary font-semibold text-sm">
                  <span>开始使用</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">平台特性</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                完全加密
              </h3>
              <p className="text-sm text-gray-600">
                使用FHEVM技术，所有学习数据都经过同态加密处理
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="text-5xl mb-4">⛓️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                链上存证
              </h3>
              <p className="text-sm text-gray-600">
                所有证书和成果永久记录在区块链上，可追溯验证
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                智能评估
              </h3>
              <p className="text-sm text-gray-600">
                教师可在加密状态下审核和评分，保护隐私
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
