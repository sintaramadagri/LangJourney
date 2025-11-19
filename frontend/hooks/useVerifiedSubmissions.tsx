"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";

const LANGJOURNEY_ABI = [
  "function getSubmission(uint256 submissionId) view returns (uint256 pathId, uint256 taskId, address learner, string submissionCID, uint8 status, address verifier, uint256 submittedAt)",
  "function getSubmissionEncryptedScore(uint256 submissionId) view returns (bytes32 encryptedScoreHandle)",
  "event SubmissionVerified(uint256 indexed submissionId, address indexed verifier, uint8 status)",
] as const;

export type VerifiedSubmission = {
  id: number;
  pathId: number;
  taskId: number;
  learner: string;
  submissionCID: string;
  status: number; // 1 = Approved, 2 = Rejected
  verifier: string;
  submittedAt: number;
  encryptedScoreHandle?: string;
  decryptedScore?: bigint;
};

export function useVerifiedSubmissions(parameters: {
  contractAddress: `0x${string}` | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
}) {
  const { contractAddress, ethersReadonlyProvider } = parameters;

  const [submissions, setSubmissions] = useState<VerifiedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = useMemo(() => {
    if (!contractAddress || !ethersReadonlyProvider) return undefined;
    return new ethers.Contract(
      contractAddress,
      LANGJOURNEY_ABI,
      ethersReadonlyProvider
    );
  }, [contractAddress, ethersReadonlyProvider]);

  // 获取所有已审核的提交
  const fetchVerifiedSubmissions = useCallback(async () => {
    if (!contract) {
      setSubmissions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 通过事件获取所有SubmissionVerified事件
      const allSubmissions: VerifiedSubmission[] = [];

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
        const submissionPromises = Array.from(submissionIds).map(
          async (id) => {
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
                // 获取加密分数handle
                let encryptedScoreHandle: string | undefined;
                try {
                  encryptedScoreHandle =
                    await contract.getSubmissionEncryptedScore(id);
                } catch (e) {
                  console.log(`Could not get encrypted score for ${id}`);
                }

                return {
                  id,
                  pathId: Number(pathId),
                  taskId: Number(taskId),
                  learner,
                  submissionCID,
                  status: statusNum,
                  verifier,
                  submittedAt: Number(submittedAt),
                  encryptedScoreHandle,
                } as VerifiedSubmission;
              }
              return null;
            } catch (e) {
              console.log(`Error fetching submission ${id}:`, e);
              return null;
            }
          }
        );

        const results = await Promise.all(submissionPromises);
        results.forEach((sub) => {
          if (sub) {
            allSubmissions.push(sub);
          }
        });
      } catch (e) {
        console.error("Error querying events:", e);
      }

      // 按提交时间倒序排列
      allSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);

      setSubmissions(allSubmissions);
    } catch (e: any) {
      console.error("Error fetching verified submissions:", e);
      setError(e.message || "Failed to fetch submissions");
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // 监听事件
  useEffect(() => {
    if (!contract || !ethersReadonlyProvider) return;

    const filterVerified = contract.filters.SubmissionVerified();

    const handleVerified = () => {
      console.log("Submission verified, refreshing...");
      fetchVerifiedSubmissions();
    };

    // 监听事件
    contract.on(filterVerified, handleVerified);

    // 初始加载
    fetchVerifiedSubmissions();

    return () => {
      contract.off(filterVerified, handleVerified);
    };
  }, [contract, ethersReadonlyProvider, fetchVerifiedSubmissions]);

  // 计算统计数据
  const stats = useMemo(() => {
    const approved = submissions.filter((s) => s.status === 1).length;
    const rejected = submissions.filter((s) => s.status === 2).length;
    const decrypted = submissions.filter((s) => s.decryptedScore !== undefined)
      .length;

    return {
      total: submissions.length,
      approved,
      rejected,
      decrypted,
    };
  }, [submissions]);

  return {
    submissions,
    stats,
    isLoading,
    error,
    fetchVerifiedSubmissions,
  };
}


