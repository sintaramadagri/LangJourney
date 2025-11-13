// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title LangJourney - 语言学习成果证明平台
/// @notice 使用FHEVM进行加密存储和计算的学习成果管理系统
contract LangJourney is SepoliaConfig {
    enum SubmissionStatus { Pending, Approved, Rejected }
    
    struct LearningPath {
        address creator;
        string pathCID; // IPFS CID for path metadata
        euint32 totalTasks; // 加密存储的任务总数
        euint32 completedTasks; // 加密存储的已完成任务数
        bool active;
        uint256 createdAt;
    }
    
    struct Submission {
        uint256 pathId;
        uint256 taskId;
        address learner;
        string submissionCID; // IPFS CID for submission content
        euint32 encryptedScore; // 加密存储的分数
        SubmissionStatus status;
        address verifier; // 审核教师地址
        uint256 submittedAt;
        uint256 verifiedAt;
    }
    
    struct Certificate {
        uint256 pathId;
        address learner;
        string certCID; // IPFS CID for certificate metadata
        euint64 encryptedFinalScore; // 加密存储的最终总分
        uint256 mintedAt;
    }
    
    // 状态变量
    uint256 public nextPathId = 1;
    uint256 public nextSubmissionId = 1;
    uint256 public nextCertificateId = 1;
    
    mapping(uint256 => LearningPath) public paths;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => Certificate) public certificates;
    mapping(address => bool) public authorizedTeachers; // 白名单教师
    
    // 事件
    event PathCreated(uint256 indexed pathId, address indexed creator, string pathCID);
    event SubmissionCreated(uint256 indexed submissionId, uint256 indexed pathId, address indexed learner, string submissionCID);
    event SubmissionVerified(uint256 indexed submissionId, address indexed verifier, SubmissionStatus status);
    event CertificateMinted(uint256 indexed certId, uint256 indexed pathId, address indexed learner, string certCID);
    event TeacherAuthorized(address indexed teacher, bool authorized);
    
    modifier onlyAuthorizedTeacher() {
        require(authorizedTeachers[msg.sender], "Not authorized teacher");
        _;
    }
    
    modifier onlyPathCreator(uint256 pathId) {
        require(paths[pathId].creator == msg.sender, "Not path creator");
        _;
    }
    
    /// @notice 授权/取消授权教师
    function setTeacherAuthorization(address teacher, bool authorized) external {
        // 简化版：任何人都可以授权，实际应该由管理员控制
        authorizedTeachers[teacher] = authorized;
        emit TeacherAuthorized(teacher, authorized);
    }
    
    /// @notice 创建学习路径
    /// @param pathCID IPFS CID containing path metadata
    /// @param encryptedTotalTasks 加密的任务总数
    function createPath(
        string memory pathCID,
        externalEuint32 encryptedTotalTasks,
        bytes calldata inputProof
    ) external returns (uint256 pathId) {
        euint32 totalTasks = FHE.fromExternal(encryptedTotalTasks, inputProof);
        
        pathId = nextPathId++;
        euint32 completedTasks = FHE.asEuint32(0); // 初始化为0
        FHE.allowThis(completedTasks); // 允许合约使用completedTasks
        
        paths[pathId] = LearningPath({
            creator: msg.sender,
            pathCID: pathCID,
            totalTasks: totalTasks,
            completedTasks: completedTasks,
            active: true,
            createdAt: block.timestamp
        });
        
        FHE.allowThis(totalTasks);
        FHE.allow(totalTasks, msg.sender);
        
        emit PathCreated(pathId, msg.sender, pathCID);
    }
    
    /// @notice 更新路径的任务总数（加密）
    function updatePathTotalTasks(
        uint256 pathId,
        externalEuint32 encryptedTotalTasks,
        bytes calldata inputProof
    ) external onlyPathCreator(pathId) {
        euint32 totalTasks = FHE.fromExternal(encryptedTotalTasks, inputProof);
        paths[pathId].totalTasks = totalTasks;
        
        FHE.allowThis(totalTasks);
        FHE.allow(totalTasks, msg.sender);
    }
    
    /// @notice 提交学习成果
    /// @param pathId 路径ID
    /// @param taskId 任务ID
    /// @param submissionCID IPFS CID containing submission content
    /// @param encryptedScore 加密的分数
    function submitTask(
        uint256 pathId,
        uint256 taskId,
        string memory submissionCID,
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external returns (uint256 submissionId) {
        require(paths[pathId].active, "Path not active");
        
        euint32 score = FHE.fromExternal(encryptedScore, inputProof);
        
        submissionId = nextSubmissionId++;
        submissions[submissionId] = Submission({
            pathId: pathId,
            taskId: taskId,
            learner: msg.sender,
            submissionCID: submissionCID,
            encryptedScore: score,
            status: SubmissionStatus.Pending,
            verifier: address(0),
            submittedAt: block.timestamp,
            verifiedAt: 0
        });
        
        FHE.allowThis(score);
        FHE.allow(score, msg.sender);
        
        emit SubmissionCreated(submissionId, pathId, msg.sender, submissionCID);
    }
    
    /// @notice 教师审核提交（在加密状态下更新分数）
    /// @param submissionId 提交ID
    /// @param status 审核状态
    /// @param newEncryptedScore 新的加密分数（如果需要修改）
    function verifySubmission(
        uint256 submissionId,
        SubmissionStatus status,
        externalEuint32 newEncryptedScore,
        bytes calldata inputProof
    ) external onlyAuthorizedTeacher {
        Submission storage submission = submissions[submissionId];
        require(submission.status == SubmissionStatus.Pending, "Already verified");
        require(status != SubmissionStatus.Pending, "Invalid status");
        
        // 如果提供了新分数，则更新（在加密状态下）
        if (status == SubmissionStatus.Approved) {
            euint32 newScore = FHE.fromExternal(newEncryptedScore, inputProof);
            submission.encryptedScore = newScore;
            
            FHE.allowThis(newScore);
            FHE.allow(newScore, submission.learner);
            FHE.allow(newScore, msg.sender);
            
            // 在加密状态下增加完成的任务数
            LearningPath storage path = paths[submission.pathId];
            // 确保completedTasks有权限，然后执行加法操作
            FHE.allowThis(path.completedTasks);
            path.completedTasks = FHE.add(path.completedTasks, 1); // 使用标量操作
            FHE.allowThis(path.completedTasks); // 更新后的值也需要权限
        }
        
        submission.status = status;
        submission.verifier = msg.sender;
        submission.verifiedAt = block.timestamp;
        
        emit SubmissionVerified(submissionId, msg.sender, status);
    }
    
    /// @notice 在加密状态下计算平均分
    /// @param submissionIds 提交ID数组
    /// @dev 注意：FHE操作会修改状态，所以不能是view函数
    function calculateAverageScore(uint256[] calldata submissionIds) 
        external 
        returns (euint32) 
    {
        require(submissionIds.length > 0, "No submissions");
        
        euint32 sum = FHE.asEuint32(0);
        euint32 count = FHE.asEuint32(0);
        
        for (uint256 i = 0; i < submissionIds.length; i++) {
            Submission storage sub = submissions[submissionIds[i]];
            if (sub.status == SubmissionStatus.Approved) {
                sum = FHE.add(sum, sub.encryptedScore);
                count = FHE.add(count, FHE.asEuint32(1));
            }
        }
        
        // 简化：返回总和，实际除法需要更复杂的处理
        // 这里返回总和，前端可以解密后计算平均值
        FHE.allowThis(sum);
        return sum;
    }
    
    /// @notice 铸造证书
    /// @param pathId 路径ID
    /// @param certCID IPFS CID for certificate metadata
    /// @param encryptedFinalScore 加密的最终总分
    function mintCertificate(
        uint256 pathId,
        string memory certCID,
        externalEuint64 encryptedFinalScore,
        bytes calldata inputProof
    ) external returns (uint256 certId) {
        require(paths[pathId].active, "Path not active");
        
        euint64 finalScore = FHE.fromExternal(encryptedFinalScore, inputProof);
        
        certId = nextCertificateId++;
        certificates[certId] = Certificate({
            pathId: pathId,
            learner: msg.sender,
            certCID: certCID,
            encryptedFinalScore: finalScore,
            mintedAt: block.timestamp
        });
        
        FHE.allowThis(finalScore);
        FHE.allow(finalScore, msg.sender);
        
        emit CertificateMinted(certId, pathId, msg.sender, certCID);
    }
    
    /// @notice 获取路径信息
    function getPath(uint256 pathId) 
        external 
        view 
        returns (
            address creator,
            string memory pathCID,
            bool active,
            uint256 createdAt
        ) 
    {
        LearningPath storage path = paths[pathId];
        require(path.creator != address(0), "Path not found");
        return (path.creator, path.pathCID, path.active, path.createdAt);
    }
    
    /// @notice 获取提交信息
    function getSubmission(uint256 submissionId)
        external
        view
        returns (
            uint256 pathId,
            uint256 taskId,
            address learner,
            string memory submissionCID,
            SubmissionStatus status,
            address verifier,
            uint256 submittedAt
        )
    {
        Submission storage sub = submissions[submissionId];
        require(sub.learner != address(0), "Submission not found");
        return (
            sub.pathId,
            sub.taskId,
            sub.learner,
            sub.submissionCID,
            sub.status,
            sub.verifier,
            sub.submittedAt
        );
    }
    
    /// @notice 获取证书信息
    function getCertificate(uint256 certId)
        external
        view
        returns (
            uint256 pathId,
            address learner,
            string memory certCID,
            uint256 mintedAt
        )
    {
        Certificate storage cert = certificates[certId];
        require(cert.learner != address(0), "Certificate not found");
        return (cert.pathId, cert.learner, cert.certCID, cert.mintedAt);
    }
    
    /// @notice 获取证书的加密分数handle（用于解密）
    /// @param certId 证书ID
    /// @return encryptedFinalScoreHandle 加密分数的handle（bytes32格式）
    function getCertificateEncryptedScore(uint256 certId)
        external
        view
        returns (bytes32 encryptedFinalScoreHandle)
    {
        Certificate storage cert = certificates[certId];
        require(cert.learner != address(0), "Certificate not found");
        // euint64在链上存储为bytes32，直接返回
        return euint64.unwrap(cert.encryptedFinalScore);
    }
    
    /// @notice 获取提交的加密分数handle（用于解密）
    /// @param submissionId 提交ID
    /// @return encryptedScoreHandle 加密分数的handle（bytes32格式）
    function getSubmissionEncryptedScore(uint256 submissionId)
        external
        view
        returns (bytes32 encryptedScoreHandle)
    {
        Submission storage sub = submissions[submissionId];
        require(sub.learner != address(0), "Submission not found");
        // euint32在链上存储为bytes32，直接返回
        return euint32.unwrap(sub.encryptedScore);
    }
}

