"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

// 辅助函数：将handle转换为bytes32格式
function convertHandleToBytes32(handle: any): string {
  if (Array.isArray(handle)) {
    // 如果是数组，先转换为Uint8Array，然后转为hex字符串，最后zeroPad到32字节
    const uint8Array = new Uint8Array(handle);
    const hexString = ethers.hexlify(uint8Array);
    return ethers.zeroPadValue(hexString, 32);
  } else if (handle instanceof Uint8Array) {
    // 如果是Uint8Array
    const hexString = ethers.hexlify(handle);
    return ethers.zeroPadValue(hexString, 32);
  } else if (typeof handle === 'string') {
    // 如果已经是字符串
    let hexString = handle;
    if (!hexString.startsWith('0x')) {
      hexString = '0x' + hexString;
    }
    // 确保是32字节（66字符包括0x前缀）
    if (hexString.length < 66) {
      return ethers.zeroPadValue(hexString, 32);
    }
    return hexString;
  }
  throw new Error(`Unsupported handle type: ${typeof handle}, value: ${JSON.stringify(handle)}`);
}

// 简化的ABI - 实际应该从部署信息生成
// 注意：externalEuint32 在ABI中编译为 bytes32 类型
const LANGJOURNEY_ABI = [
  "function createPath(string pathCID, bytes32 encryptedTotalTasks, bytes inputProof) returns (uint256)",
  "function submitTask(uint256 pathId, uint256 taskId, string submissionCID, bytes32 encryptedScore, bytes inputProof) returns (uint256)",
  "function verifySubmission(uint256 submissionId, uint8 status, bytes32 newEncryptedScore, bytes inputProof)",
  "function mintCertificate(uint256 pathId, string certCID, bytes32 encryptedFinalScore, bytes inputProof) returns (uint256)",
  "function getPath(uint256 pathId) view returns (address creator, string pathCID, bool active, uint256 createdAt)",
  "function getSubmission(uint256 submissionId) view returns (uint256 pathId, uint256 taskId, address learner, string submissionCID, uint8 status, address verifier, uint256 submittedAt)",
  "function getSubmissionEncryptedScore(uint256 submissionId) view returns (bytes32 encryptedScoreHandle)",
  "function getCertificate(uint256 certId) view returns (uint256 pathId, address learner, string certCID, uint256 mintedAt)",
  "function getCertificateEncryptedScore(uint256 certId) view returns (bytes32 encryptedFinalScoreHandle)",
  "function nextSubmissionId() view returns (uint256)",
  "function nextCertificateId() view returns (uint256)",
  "function setTeacherAuthorization(address teacher, bool authorized)",
  "function authorizedTeachers(address) view returns (bool)",
  "event PathCreated(uint256 indexed pathId, address indexed creator, string pathCID)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed pathId, address indexed learner, string submissionCID)",
  "event SubmissionVerified(uint256 indexed submissionId, address indexed verifier, uint8 status)",
  "event CertificateMinted(uint256 indexed certId, uint256 indexed pathId, address indexed learner, string certCID)",
] as const;

export function useLangJourney(parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  contractAddress: `0x${string}` | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
}) {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    contractAddress,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  } = parameters;

  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const contract = useMemo(() => {
    if (!contractAddress || !ethersReadonlyProvider) return undefined;
    return new ethers.Contract(contractAddress, LANGJOURNEY_ABI, ethersReadonlyProvider);
  }, [contractAddress, ethersReadonlyProvider]);

  const contractWithSigner = useMemo(() => {
    if (!contractAddress || !ethersSigner) return undefined;
    return new ethers.Contract(contractAddress, LANGJOURNEY_ABI, ethersSigner);
  }, [contractAddress, ethersSigner]);

  // 创建路径
  const createPath = useCallback(
    async (pathCID: string, totalTasks: number) => {
      if (!instance || !contractWithSigner || !ethersSigner) {
        setMessage("FHEVM instance or contract not ready");
        return;
      }

      setIsLoading(true);
      setMessage("Creating encrypted path...");

      try {
        const input = instance.createEncryptedInput(
          contractAddress!,
          await ethersSigner.getAddress()
        );
        input.add32(BigInt(totalTasks));

        const enc = await input.encrypt();

        setMessage("Submitting transaction...");
        
        // 转换handle为bytes32格式
        const handle = convertHandleToBytes32(enc.handles[0]);

        const tx = await contractWithSigner.createPath(
          pathCID,
          handle,
          enc.inputProof,
          { gasLimit: 10000000 }
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`Path created! Status: ${receipt?.status}`);
      } catch (error: any) {
        console.error("CreatePath error:", error);
        const errorMsg = error?.reason || error?.message || "Unknown error";
        setMessage(`Error: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    },
    [instance, contractWithSigner, contractAddress, ethersSigner]
  );

  // 提交任务
  const submitTask = useCallback(
    async (
      pathId: number,
      taskId: number,
      submissionCID: string,
      score: number
    ) => {
      if (!instance || !contractWithSigner || !ethersSigner) {
        setMessage("FHEVM instance or contract not ready");
        return;
      }

      setIsLoading(true);
      setMessage("Encrypting score...");

      try {
        const input = instance.createEncryptedInput(
          contractAddress!,
          await ethersSigner.getAddress()
        );
        input.add32(BigInt(score));

        const enc = await input.encrypt();

        setMessage("Submitting task...");
        
        // 转换handle为bytes32格式
        const handle = convertHandleToBytes32(enc.handles[0]);

        const tx = await contractWithSigner.submitTask(
          pathId,
          taskId,
          submissionCID,
          handle,
          enc.inputProof,
          { gasLimit: 10000000 }
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`Task submitted! Status: ${receipt?.status}`);
      } catch (error: any) {
        console.error("SubmitTask error:", error);
        const errorMsg = error?.reason || error?.message || "Unknown error";
        setMessage(`Error: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    },
    [instance, contractWithSigner, contractAddress, ethersSigner]
  );

  // 审核提交
  const verifySubmission = useCallback(
    async (submissionId: number, status: number, newScore: number) => {
      if (!instance || !contractWithSigner || !ethersSigner) {
        setMessage("FHEVM instance or contract not ready");
        return;
      }

      setIsLoading(true);
      setMessage("检查提交状态...");

      try {
        // 先检查提交状态
        const submission = await contractWithSigner.getSubmission(submissionId);
        const submissionStatus = Number(submission[4]); // status是第5个返回值（索引4）
        
        if (submissionStatus !== 0) {
          throw new Error(`提交已被审核（当前状态: ${submissionStatus === 1 ? '已通过' : '已拒绝'}）`);
        }

        setMessage("加密新分数...");

        const input = instance.createEncryptedInput(
          contractAddress!,
          await ethersSigner.getAddress()
        );
        input.add32(BigInt(newScore));

        const enc = await input.encrypt();

        setMessage("提交审核交易...");
        
        // 转换handle为bytes32格式
        const handle = convertHandleToBytes32(enc.handles[0]);

        const tx = await contractWithSigner.verifySubmission(
          submissionId,
          status,
          handle,
          enc.inputProof,
          { gasLimit: 10000000 }
        );

        setMessage(`交易已发送: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`✅ 审核成功！状态: ${receipt?.status === 1 ? '成功' : '失败'}`);
      } catch (error: any) {
        console.error("VerifySubmission error:", error);
        let errorMsg = "未知错误";
        
        if (error?.reason) {
          errorMsg = error.reason;
        } else if (error?.message) {
          errorMsg = error.message;
          // 检查常见错误
          if (errorMsg.includes("Not authorized")) {
            errorMsg = "错误：您未授权为教师，请先授权";
          } else if (errorMsg.includes("Already verified")) {
            errorMsg = "错误：该提交已被审核";
          } else if (errorMsg.includes("Invalid status")) {
            errorMsg = "错误：无效的审核状态";
          } else if (errorMsg.includes("Internal JSON-RPC error")) {
            errorMsg = "错误：合约执行失败，可能是提交状态不正确或FHE操作失败";
          }
        }
        
        setMessage(`❌ 审核失败: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    },
    [instance, contractWithSigner, contractAddress, ethersSigner]
  );

  // 解密分数
  const decryptScore = useCallback(
    async (handle: string) => {
      if (!instance || !ethersSigner || !contractAddress) {
        setMessage("FHEVM instance not ready");
        return null;
      }

      setIsLoading(true);
      setMessage("Decrypting score...");

      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractAddress],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          setMessage("Unable to build decryption signature");
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

        setMessage("Decryption completed!");
        return res[handle];
      } catch (error: any) {
        setMessage(`Decryption error: ${error.message}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [instance, ethersSigner, contractAddress, fhevmDecryptionSignatureStorage]
  );

  // 授权教师
  const authorizeTeacher = useCallback(
    async (teacherAddress: string) => {
      if (!contractWithSigner) {
        setMessage("Contract not ready");
        return false;
      }

      setIsLoading(true);
      setMessage("Authorizing teacher...");

      try {
        const tx = await contractWithSigner.setTeacherAuthorization(
          teacherAddress,
          true,
          { gasLimit: 100000 }
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`Teacher authorized! Status: ${receipt?.status}`);
        return true;
      } catch (error: any) {
        console.error("AuthorizeTeacher error:", error);
        const errorMsg = error?.reason || error?.message || "Unknown error";
        setMessage(`Error: ${errorMsg}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contractWithSigner]
  );

  // 检查教师授权状态
  const checkTeacherAuth = useCallback(
    async (teacherAddress: string): Promise<boolean> => {
      if (!contract) return false;

      try {
        const isAuthorized = await contract.authorizedTeachers(teacherAddress);
        return isAuthorized;
      } catch (error) {
        console.error("CheckTeacherAuth error:", error);
        return false;
      }
    },
    [contract]
  );

  // 铸造证书
  const mintCertificate = useCallback(
    async (pathId: number, certCID: string, finalScore: number) => {
      if (!instance || !contractWithSigner || !ethersSigner) {
        setMessage("FHEVM instance or contract not ready");
        return;
      }

      setIsLoading(true);
      setMessage("加密最终分数...");

      try {
        const input = instance.createEncryptedInput(
          contractAddress!,
          await ethersSigner.getAddress()
        );
        // 使用 add64 因为合约要求 euint64 类型
        input.add64(BigInt(finalScore));

        const enc = await input.encrypt();

        setMessage("提交铸造交易...");
        
        // 转换handle为bytes32格式
        const handle = convertHandleToBytes32(enc.handles[0]);

        const tx = await contractWithSigner.mintCertificate(
          pathId,
          certCID,
          handle,
          enc.inputProof,
          { gasLimit: 5000000 }
        );

        setMessage(`交易已发送: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(`✅ 证书铸造成功！状态: ${receipt?.status === 1 ? '成功' : '失败'}`);
        
        // 2秒后跳转到证书页面
        setTimeout(() => {
          window.location.href = "/certificates";
        }, 2000);
      } catch (error: any) {
        console.error("MintCertificate error:", error);
        const errorMsg = error?.reason || error?.message || "Unknown error";
        setMessage(`❌ 铸造失败: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    },
    [instance, contractWithSigner, contractAddress, ethersSigner]
  );

  return {
    contract,
    contractWithSigner,
    createPath,
    submitTask,
    verifySubmission,
    mintCertificate,
    decryptScore,
    authorizeTeacher,
    checkTeacherAuth,
    message,
    isLoading,
  };
}

