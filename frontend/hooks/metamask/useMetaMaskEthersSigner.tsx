"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMetaMaskProvider } from "./useMetaMaskProvider";

export function useMetaMaskEthersSigner() {
  const { provider, chainId, accounts, isConnected, connect } =
    useMetaMaskProvider();

  const ethersProvider = useMemo(() => {
    if (!provider) return undefined;
    return new ethers.BrowserProvider(provider);
  }, [provider]);

  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);

  useEffect(() => {
    if (ethersProvider && isConnected) {
      ethersProvider.getSigner().then(setEthersSigner);
    } else {
      setEthersSigner(undefined);
    }
  }, [ethersProvider, isConnected]);

  const ethersReadonlyProvider = useMemo(() => {
    return ethersProvider;
  }, [ethersProvider]);

  const sameChain = useRef((chainId: number | undefined) => {
    return chainId === chainId;
  });

  const sameSigner = useRef(
    (signer: ethers.JsonRpcSigner | undefined) => {
      return signer !== undefined;
    }
  );

  const initialMockChains = useMemo(() => {
    return {
      31337: "http://localhost:8545",
    };
  }, []);

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  };
}

