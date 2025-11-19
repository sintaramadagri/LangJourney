"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

const LANGJOURNEY_ABI = [
  "function getSubmission(uint256 submissionId) view returns (uint256 pathId, uint256 taskId, address learner, string submissionCID, uint8 status, address verifier, uint256 submittedAt)",
  "function getSubmissionEncryptedScore(uint256 submissionId) view returns (bytes32 encryptedScoreHandle)",
  "function nextSubmissionId() view returns (uint256)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed pathId, address indexed learner, string submissionCID)",
  "event SubmissionVerified(uint256 indexed submissionId, address indexed verifier, uint8 status)",
] as const;

export type SubmissionStatus = 0 | 1 | 2; // Pending, Approved, Rejected

export type Submission = {
  id: number;
  pathId: number;
  taskId: number;
  learner: string;
  submissionCID: string;
  status: SubmissionStatus;
  verifier: string;
  submittedAt: number;
  decryptedScore?: bigint; // 解密后的分数（可选）
};

export function useSubmissions(parameters: {
  contractAddress: `0x${string}` | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  instance: FhevmInstance | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  chainId: number | undefined;
}) {
  const {
    contractAddress,
    ethersReadonlyProvider,
    instance,
    ethersSigner,
    fhevmDecryptionSignatureStorage,
    chainId,
  } = parameters;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = useMemo(() => {
    if (!contractAddress || !ethersReadonlyProvider) return undefined;
    return new ethers.Contract(contractAddress, LANGJOURNEY_ABI, ethersReadonlyProvider);
  }, [contractAddress, ethersReadonlyProvider]);

  // 获取所有待审核的提交
  const fetchPendingSubmissions = useCallback(async () => {
    if (!contract) {
      setSubmissions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 通过事件获取所有SubmissionCreated事件（更高效）
      const allSubmissions: Submission[] = [];
      
      try {
        // 查询所有SubmissionCreated事件
        const filter = contract.filters.SubmissionCreated();
        const events = await contract.queryFilter(filter);
        
        // 从事件中提取submission IDs
        const submissionIds = new Set<number>();
        events.forEach((event) => {
          const args = (event as any).args;
          if (args && args.submissionId) {
            submissionIds.add(Number(args.submissionId));
          }
        });

        // 并行获取每个submission的详情
        const submissionPromises = Array.from(submissionIds).map(async (id) => {
          try {
            const [
              pathId,
              taskId,
              learner,
              submissionCID,
              status,
              verifier,
              submittedAt,
            ] = await contract.getSubmission(id);

            // 只返回待审核的（status === 0）
            if (Number(status) === 0) {
              return {
                id,
                pathId: Number(pathId),
                taskId: Number(taskId),
                learner,
                submissionCID,
                status: Number(status) as SubmissionStatus,
                verifier,
                submittedAt: Number(submittedAt),
              } as Submission;
            }
            return null;
          } catch (e) {
            console.log(`Error fetching submission ${id}:`, e);
            return null;
          }
        });

        const results = await Promise.all(submissionPromises);
        results.forEach((sub) => {
          if (sub) {
            allSubmissions.push(sub);
          }
        });
      } catch (e) {
        console.error("Error querying events:", e);
        // Fallback: 如果事件查询失败，尝试使用nextSubmissionId
        try {
          const nextId = await contract.nextSubmissionId();
          const totalSubmissions = Number(nextId);
          
          for (let i = 1; i < totalSubmissions; i++) {
            try {
              const [
                pathId,
                taskId,
                learner,
                submissionCID,
                status,
                verifier,
                submittedAt,
              ] = await contract.getSubmission(i);

              if (Number(status) === 0) {
                allSubmissions.push({
                  id: i,
                  pathId: Number(pathId),
                  taskId: Number(taskId),
                  learner,
                  submissionCID,
                  status: Number(status) as SubmissionStatus,
                  verifier,
                  submittedAt: Number(submittedAt),
                });
              }
            } catch (e) {
              // 跳过不存在的submission
            }
          }
        } catch (fallbackError) {
          console.error("Fallback method also failed:", fallbackError);
        }
      }

      // 按提交时间倒序排列
      allSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);

      setSubmissions(allSubmissions);
    } catch (e: any) {
      console.error("Error fetching submissions:", e);
      setError(e.message || "Failed to fetch submissions");
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // 获取单个提交详情
  const fetchSubmission = useCallback(
    async (submissionId: number): Promise<Submission | null> => {
      if (!contract) return null;

      try {
        const [
          pathId,
          taskId,
          learner,
          submissionCID,
          status,
          verifier,
          submittedAt,
        ] = await contract.getSubmission(submissionId);

        return {
          id: submissionId,
          pathId: Number(pathId),
          taskId: Number(taskId),
          learner,
          submissionCID,
          status: Number(status) as SubmissionStatus,
          verifier,
          submittedAt: Number(submittedAt),
        };
      } catch (e: any) {
        console.error(`Error fetching submission ${submissionId}:`, e);
        return null;
      }
    },
    [contract]
  );

  // 解密分数（如果需要显示）
  const decryptScore = useCallback(
    async (handle: string): Promise<bigint | null> => {
      if (!instance || !ethersSigner || !contractAddress) {
        return null;
      }

      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractAddress],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          return null;
        }

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
        console.error("Error decrypting score:", e);
        return null;
      }
    },
    [instance, ethersSigner, contractAddress, fhevmDecryptionSignatureStorage]
  );

  // 监听事件
  useEffect(() => {
    if (!contract || !ethersReadonlyProvider) return;

    const filterCreated = contract.filters.SubmissionCreated();
    const filterVerified = contract.filters.SubmissionVerified();

    const handleCreated = () => {
      console.log("New submission created, refreshing...");
      fetchPendingSubmissions();
    };

    const handleVerified = () => {
      console.log("Submission verified, refreshing...");
      fetchPendingSubmissions();
    };

    // 监听事件
    contract.on(filterCreated, handleCreated);
    contract.on(filterVerified, handleVerified);

    // 初始加载
    fetchPendingSubmissions();

    return () => {
      contract.off(filterCreated, handleCreated);
      contract.off(filterVerified, handleVerified);
    };
  }, [contract, ethersReadonlyProvider, fetchPendingSubmissions]);

  // 获取所有已审核的提交
  const fetchReviewedSubmissions = useCallback(async () => {
    if (!contract) {
      setSubmissions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allSubmissions: Submission[] = [];
      
      try {
        // 查询所有SubmissionVerified事件
        const filter = contract.filters.SubmissionVerified();
        const events = await contract.queryFilter(filter);
        
        // 从事件中提取submission IDs
        const submissionIds = new Set<number>();
        events.forEach((event) => {
          const args = (event as any).args;
          if (args && args.submissionId) {
            submissionIds.add(Number(args.submissionId));
          }
        });

        // 并行获取每个submission的详情
        const submissionPromises = Array.from(submissionIds).map(async (id) => {
          try {
            const [
              pathId,
              taskId,
              learner,
              submissionCID,
              status,
              verifier,
              submittedAt,
            ] = await contract.getSubmission(id);

            // 只返回已审核的（status === 1 或 2）
            const statusNum = Number(status);
            if (statusNum === 1 || statusNum === 2) {
              return {
                id,
                pathId: Number(pathId),
                taskId: Number(taskId),
                learner,
                submissionCID,
                status: statusNum as SubmissionStatus,
                verifier,
                submittedAt: Number(submittedAt),
              } as Submission;
            }
            return null;
          } catch (e) {
            console.log(`Error fetching submission ${id}:`, e);
            return null;
          }
        });

        const results = await Promise.all(submissionPromises);
        results.forEach((sub) => {
          if (sub) {
            allSubmissions.push(sub);
          }
        });
      } catch (e) {
        console.error("Error querying events:", e);
        // Fallback: 如果事件查询失败，尝试使用nextSubmissionId
        try {
          const nextId = await contract.nextSubmissionId();
          const totalSubmissions = Number(nextId);
          
          for (let i = 1; i < totalSubmissions; i++) {
            try {
              const [
                pathId,
                taskId,
                learner,
                submissionCID,
                status,
                verifier,
                submittedAt,
              ] = await contract.getSubmission(i);

              const statusNum = Number(status);
              if (statusNum === 1 || statusNum === 2) {
                allSubmissions.push({
                  id: i,
                  pathId: Number(pathId),
                  taskId: Number(taskId),
                  learner,
                  submissionCID,
                  status: statusNum as SubmissionStatus,
                  verifier,
                  submittedAt: Number(submittedAt),
                });
              }
            } catch (e) {
              // 跳过不存在的submission
            }
          }
        } catch (fallbackError) {
          console.error("Fallback method also failed:", fallbackError);
        }
      }

      // 按审核时间倒序排列（通过verifiedAt事件时间戳）
      allSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);

      setSubmissions(allSubmissions);
    } catch (e: any) {
      console.error("Error fetching reviewed submissions:", e);
      setError(e.message || "Failed to fetch reviewed submissions");
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // 解密提交分数（通过submissionId）
  const decryptSubmissionScore = useCallback(
    async (submissionId: number): Promise<bigint | null> => {
      if (!instance || !ethersSigner || !contractAddress || !contract) {
        return null;
      }

      try {
        // 获取提交的加密分数handle
        const encryptedScoreHandle = await contract.getSubmissionEncryptedScore(submissionId);
        
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
        console.error("Error decrypting submission score:", e);
        return null;
      }
    },
    [instance, ethersSigner, contractAddress, fhevmDecryptionSignatureStorage, contract]
  );

  // 为提交解密分数并更新状态
  const decryptAndUpdateSubmission = useCallback(
    async (submissionId: number) => {
      const score = await decryptSubmissionScore(submissionId);
      if (score !== null) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId ? { ...sub, decryptedScore: score } : sub
          )
        );
      }
      return score;
    },
    [decryptSubmissionScore]
  );

  return {
    submissions,
    isLoading,
    error,
    fetchPendingSubmissions,
    fetchReviewedSubmissions,
    fetchSubmission,
    decryptScore,
    decryptSubmissionScore,
    decryptAndUpdateSubmission,
  };
}

