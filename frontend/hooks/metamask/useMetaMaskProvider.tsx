"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

export function useMetaMaskProvider() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(
    undefined
  );
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return;
    }

    const ethereum = (window as any).ethereum as any;
    setProvider(ethereum);

    const updateChainId = async () => {
      try {
        const chainIdHex = await ethereum.request({ method: "eth_chainId" });
        setChainId(Number.parseInt(chainIdHex as string, 16));
      } catch (error) {
        console.error("Failed to get chainId:", error);
      }
    };

    const updateAccounts = async () => {
      try {
        const accs = await ethereum.request({ method: "eth_accounts" });
        setAccounts(accs as string[]);
        setIsConnected((accs as string[]).length > 0);
      } catch (error) {
        console.error("Failed to get accounts:", error);
      }
    };

    updateChainId();
    updateAccounts();

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(Number.parseInt(chainIdHex, 16));
    };

    const handleAccountsChanged = (accs: string[]) => {
      setAccounts(accs);
      setIsConnected(accs.length > 0);
    };

    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      ethereum.removeListener("chainChanged", handleChainChanged);
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connect = async () => {
    if (!provider) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      await provider.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
  };
}



