"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export default function Navigation() {
  const pathname = usePathname();
  const { accounts, isConnected, connect, chainId } = useMetaMaskEthersSigner();

  const navItems = [
    { href: "/", label: "仪表板", icon: "📊" },
    { href: "/create-path", label: "创建路径", icon: "🎯" },
    { href: "/submit-task", label: "提交任务", icon: "📝" },
    { href: "/verify", label: "审核任务", icon: "✅" },
    { href: "/reviewed", label: "审核完成", icon: "📋" },
    { href: "/mint-certificate", label: "铸造证书", icon: "🎖️" },
    { href: "/certificates", label: "我的证书", icon: "🏆" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-all">
              L
            </div>
            <span className="font-heading text-xl font-bold text-gray-900 hidden md:block">
              LangJourney
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-gray-600">
                    Chain: {chainId}
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg shadow-md">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-mono text-sm">
                    {accounts[0]?.slice(0, 2)}
                  </div>
                  <span className="font-mono text-sm hidden md:block">
                    {accounts[0]?.slice(0, 6)}...{accounts[0]?.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={connect}
                className="px-6 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                连接钱包
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap text-sm transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

