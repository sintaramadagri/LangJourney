"use client";

import { ReactNode } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export default function WalletGuard({ children }: { children: ReactNode }) {
  const { isConnected, connect } = useMetaMaskEthersSigner();

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-white text-4xl mb-4">
                🔐
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                连接钱包
              </h2>
              <p className="text-gray-600">
                请连接您的MetaMask钱包以继续使用
              </p>
            </div>
            <button
              onClick={connect}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              连接 MetaMask
            </button>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                💡 确保您已安装MetaMask扩展程序
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



