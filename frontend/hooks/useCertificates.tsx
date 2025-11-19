"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

const LANGJOURNEY_ABI = [
  "function getCertificate(uint256 certId) view returns (uint256 pathId, address learner, string certCID, uint256 mintedAt)",
  "function getCertificateEncryptedScore(uint256 certId) view returns (bytes32 encryptedFinalScoreHandle)",
  "function getPath(uint256 pathId) view returns (address creator, string pathCID, bool active, uint256 createdAt)",
  "function nextCertificateId() view returns (uint256)",
  "event CertificateMinted(uint256 indexed certId, uint256 indexed pathId, address indexed learner, string certCID)",
] as const;

export type Certificate = {
  id: number;
  pathId: number;
  learner: string;
  certCID: string;
  mintedAt: number;
  decryptedScore?: bigint; // 解密后的最终分数（可选）
  pathCID?: string; // 路径的IPFS CID（可选）
};

export function useCertificates(parameters: {
  contractAddress: `0x${string}` | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  instance: FhevmInstance | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  chainId: number | undefined;
  userAddress?: string; // 可选：只获取特定用户的证书
}) {
  const {
    contractAddress,
    ethersReadonlyProvider,
    instance,
    ethersSigner,
    fhevmDecryptionSignatureStorage,
    chainId,
    userAddress,
  } = parameters;

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = useMemo(() => {
    if (!contractAddress || !ethersReadonlyProvider) return undefined;
    return new ethers.Contract(contractAddress, LANGJOURNEY_ABI, ethersReadonlyProvider);
  }, [contractAddress, ethersReadonlyProvider]);

  // 获取所有证书
  const fetchCertificates = useCallback(async () => {
    if (!contract) {
      setCertificates([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allCertificates: Certificate[] = [];
      
      try {
        // 通过事件获取所有CertificateMinted事件
        const filter = contract.filters.CertificateMinted();
        const events = await contract.queryFilter(filter);
        
        // 从事件中提取certificate IDs
        const certIds = new Set<number>();
        events.forEach((event) => {
          const args = (event as any).args;
          if (args && args.certId) {
            const certId = Number(args.certId);
            const learner = args.learner;
            // 如果指定了userAddress，只获取该用户的证书
            if (!userAddress || learner.toLowerCase() === userAddress.toLowerCase()) {
              certIds.add(certId);
            }
          }
        });

        // 并行获取每个证书的详情
        const certPromises = Array.from(certIds).map(async (id) => {
          try {
            const [pathId, learner, certCID, mintedAt] = await contract.getCertificate(id);
            
            // 再次检查用户地址（双重检查）
            if (userAddress && learner.toLowerCase() !== userAddress.toLowerCase()) {
              return null;
            }

            // 获取路径信息
            let pathCID = "";
            try {
              const [creator, pCID, active, createdAt] = await contract.getPath(Number(pathId));
              pathCID = pCID;
            } catch (e) {
              console.log(`Error fetching path ${pathId}:`, e);
            }

            return {
              id,
              pathId: Number(pathId),
              learner,
              certCID,
              mintedAt: Number(mintedAt),
              pathCID,
            } as Certificate;
          } catch (e) {
            console.log(`Error fetching certificate ${id}:`, e);
            return null;
          }
        });

        const results = await Promise.all(certPromises);
        results.forEach((cert) => {
          if (cert) {
            allCertificates.push(cert);
          }
        });
      } catch (e) {
        console.error("Error querying events:", e);
        // Fallback: 如果事件查询失败，尝试使用nextCertificateId
        try {
          const nextId = await contract.nextCertificateId();
          const totalCerts = Number(nextId);
          
          for (let i = 1; i < totalCerts; i++) {
            try {
              const [pathId, learner, certCID, mintedAt] = await contract.getCertificate(i);
              
              // 如果指定了userAddress，只获取该用户的证书
              if (userAddress && learner.toLowerCase() !== userAddress.toLowerCase()) {
                continue;
              }

              // 获取路径信息
              let pathCID = "";
              try {
                const [creator, pCID, active, createdAt] = await contract.getPath(Number(pathId));
                pathCID = pCID;
              } catch (e) {
                console.log(`Error fetching path ${pathId}:`, e);
              }

              allCertificates.push({
                id: i,
                pathId: Number(pathId),
                learner,
                certCID,
                mintedAt: Number(mintedAt),
                pathCID,
              });
            } catch (e) {
              // 跳过不存在的证书
            }
          }
        } catch (fallbackError) {
          console.error("Fallback method also failed:", fallbackError);
        }
      }

      // 按铸造时间倒序排列
      allCertificates.sort((a, b) => b.mintedAt - a.mintedAt);

      setCertificates(allCertificates);
    } catch (e: any) {
      console.error("Error fetching certificates:", e);
      setError(e.message || "Failed to fetch certificates");
    } finally {
      setIsLoading(false);
    }
  }, [contract, userAddress]);

  // 获取单个证书详情
  const fetchCertificate = useCallback(
    async (certId: number): Promise<Certificate | null> => {
      if (!contract) return null;

      try {
        const [pathId, learner, certCID, mintedAt] = await contract.getCertificate(certId);

        // 获取路径信息
        let pathCID = "";
        try {
          const [creator, pCID, active, createdAt] = await contract.getPath(Number(pathId));
          pathCID = pCID;
        } catch (e) {
          console.log(`Error fetching path ${pathId}:`, e);
        }

        return {
          id: certId,
          pathId: Number(pathId),
          learner,
          certCID,
          mintedAt: Number(mintedAt),
          pathCID,
        };
      } catch (e: any) {
        console.error(`Error fetching certificate ${certId}:`, e);
        return null;
      }
    },
    [contract]
  );

  // 解密证书分数
  const decryptCertificateScore = useCallback(
    async (certId: number): Promise<bigint | null> => {
      if (!instance || !ethersSigner || !contractAddress || !contract) {
        return null;
      }

      try {
        // 获取证书的加密分数handle
        const encryptedScoreHandle = await contract.getCertificateEncryptedScore(certId);
        
        // 将handle转换为字符串格式
        const handle = typeof encryptedScoreHandle === 'string' 
          ? encryptedScoreHandle 
          : ethers.hexlify(encryptedScoreHandle);

        // 构建解密签名
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractAddress],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          return null;
        }

        // 解密
        const res = await instance.userDecrypt(
          [{ handle, contractAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const value = res[handle] as unknown;
        return typeof value === "bigint" ? (value as bigint) : null;
      } catch (e) {
        console.error("Error decrypting certificate score:", e);
        return null;
      }
    },
    [instance, ethersSigner, contractAddress, fhevmDecryptionSignatureStorage, contract]
  );

  // 为证书解密分数并更新状态
  const decryptAndUpdateCertificate = useCallback(
    async (certId: number) => {
      const score = await decryptCertificateScore(certId);
      if (score !== null) {
        setCertificates((prev) =>
          prev.map((cert) =>
            cert.id === certId ? { ...cert, decryptedScore: score } : cert
          )
        );
      }
      return score;
    },
    [decryptCertificateScore]
  );

  // 监听事件
  useEffect(() => {
    if (!contract || !ethersReadonlyProvider) return;

    const filter = contract.filters.CertificateMinted();

    const handleMinted = () => {
      console.log("New certificate minted, refreshing...");
      fetchCertificates();
    };

    // 监听事件
    contract.on(filter, handleMinted);

    // 初始加载
    fetchCertificates();

    return () => {
      contract.off(filter, handleMinted);
    };
  }, [contract, ethersReadonlyProvider, fetchCertificates]);

  return {
    certificates,
    isLoading,
    error,
    fetchCertificates,
    fetchCertificate,
    decryptCertificateScore,
    decryptAndUpdateCertificate,
  };
}


