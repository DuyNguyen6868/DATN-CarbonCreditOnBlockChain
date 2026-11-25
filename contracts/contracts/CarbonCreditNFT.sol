// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CarbonCreditNFT
 * @notice Mỗi NFT (ERC-721) đại diện cho một lô tín chỉ carbon (Unit theo CAD Trust V2.0):
 *         một dãy số sê-ri liên tục của một dự án trong một năm giảm phát thải (vintage).
 *         1 sê-ri = 1 tCO2e.
 *
 * Ba điểm chặn tính toán kép trong hợp đồng này:
 *  (1) Phát hành kép: dãy sê-ri của cùng (projectId, vintage) phải tăng dần, không chồng lấn;
 *      mã băm báo cáo thẩm định (documentHash) chỉ được dùng cho một lần cấp.
 *  (2) Sử dụng kép: phần đã hủy bị trừ khỏi lô; lô hủy hết thì NFT bị đốt, không chuyển được nữa.
 *  (3) Tuyên bố kép (trong phạm vi hệ thống): mỗi lần hủy sinh một chứng nhận ghi rõ dãy sê-ri
 *      đã hủy và người thụ hưởng, ai cũng tra cứu được.
 */
contract CarbonCreditNFT is ERC721URIStorage, AccessControl, Pausable {
    /// @notice Tổ chức thẩm định độc lập (VVB): được phép phát hành (mint) lô tín chỉ.
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    /// @notice Hợp đồng trung gian (pool) được hủy tín chỉ thay mặt người dùng.
    bytes32 public constant RETIREMENT_AGENT_ROLE = keccak256("RETIREMENT_AGENT_ROLE");

    struct CreditBatch {
        string projectId; // mã dự án trên hệ thống đăng ký gốc (CAD Trust: Project.projectId)
        uint16 vintage; // năm thực hiện giảm phát thải
        uint256 serialFrom; // sê-ri đầu (bao gồm)
        uint256 quantity; // tổng số tCO2e của lô khi cấp
        uint256 retired; // số tCO2e đã hủy (luôn hủy từ đầu dãy sê-ri còn lại)
        bytes32 documentHash; // keccak256 của báo cáo thẩm định lưu off-chain
        address verifier; // VVB đã mint
        uint64 issuedAt;
    }

    struct RetirementCertificate {
        uint256 tokenId;
        uint256 serialFrom;
        uint256 serialTo; // bao gồm
        uint256 amount;
        address retiree; // người thực hiện hủy (người đốt token)
        string beneficiary; // tổ chức được ghi nhận bù trừ phát thải
        string reason;
        uint64 retiredAt;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => CreditBatch) private _batches;
    RetirementCertificate[] private _certificates;

    /// keccak256(projectId, vintage) => sê-ri nhỏ nhất còn được phép cấp
    mapping(bytes32 => uint256) public nextAvailableSerial;
    /// documentHash => đã dùng để cấp hay chưa
    mapping(bytes32 => bool) public documentUsed;

    event CreditMinted(
        uint256 indexed tokenId,
        address indexed to,
        address indexed verifier,
        string projectId,
        uint16 vintage,
        uint256 serialFrom,
        uint256 serialTo,
        uint256 quantity,
        bytes32 documentHash
    );

    event CreditRetired(
        uint256 indexed certificateId,
        uint256 indexed tokenId,
        address indexed retiree,
        uint256 amount,
        uint256 serialFrom,
        uint256 serialTo,
        string beneficiary,
        string reason
    );

    error InvalidQuantity();
    error SerialOverlap(uint256 serialFrom, uint256 nextAvailable);
    error DocumentAlreadyUsed(bytes32 documentHash);
    error EmptyBeneficiary();
    error NotOwnerNorApproved(address caller, uint256 tokenId);
    error ExceedsRemaining(uint256 requested, uint256 remaining);
    error NonexistentBatch(uint256 tokenId);

    constructor(address admin) ERC721("Carbon Credit Batch", "CCB") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ------------------------------------------------------------------
    // Phát hành
    // ------------------------------------------------------------------

    /**
     * @notice VVB phát hành một lô tín chỉ sau khi đã thẩm định hồ sơ off-chain.
     * @param to Ví của chủ dự án nhận lô tín chỉ.
     * @param serialFrom Sê-ri đầu của lô; dãy cấp ra là [serialFrom, serialFrom + quantity - 1].
     * @param uri URI tệp metadata JSON (IPFS hoặc HTTP).
     */
    function mintBatch(
        address to,
        string calldata projectId,
        uint16 vintage,
        uint256 serialFrom,
        uint256 quantity,
        bytes32 documentHash,
        string calldata uri
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused returns (uint256 tokenId) {
        if (quantity == 0) revert InvalidQuantity();
        if (documentUsed[documentHash]) revert DocumentAlreadyUsed(documentHash);

        bytes32 key = seriesKey(projectId, vintage);
        uint256 nextSerial = nextAvailableSerial[key];
        if (serialFrom < nextSerial || serialFrom == 0) revert SerialOverlap(serialFrom, nextSerial);

        documentUsed[documentHash] = true;
        nextAvailableSerial[key] = serialFrom + quantity;

        tokenId = _nextTokenId++;
        _batches[tokenId] = CreditBatch({
            projectId: projectId,
            vintage: vintage,
            serialFrom: serialFrom,
            quantity: quantity,
            retired: 0,
            documentHash: documentHash,
            verifier: msg.sender,
            issuedAt: uint64(block.timestamp)
        });

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _emitMinted(tokenId, to);
    }

    /// Tách riêng để tránh lỗi "stack too deep" khi phát sự kiện nhiều tham số.
    function _emitMinted(uint256 tokenId, address to) private {
        CreditBatch storage b = _batches[tokenId];
        emit CreditMinted(
            tokenId,
            to,
            b.verifier,
            b.projectId,
            b.vintage,
            b.serialFrom,
            b.serialFrom + b.quantity - 1,
            b.quantity,
            b.documentHash
        );
    }

    // ------------------------------------------------------------------
    // Hủy tín chỉ (retire)
    // ------------------------------------------------------------------

    /// @notice Chủ sở hữu (hoặc người được ủy quyền) hủy `amount` tCO2e từ lô `tokenId`.
    function retire(uint256 tokenId, uint256 amount, string calldata beneficiary, string calldata reason)
        external
        whenNotPaused
        returns (uint256)
    {
        address owner = _requireOwned(tokenId);
        if (!_isAuthorized(owner, msg.sender, tokenId)) revert NotOwnerNorApproved(msg.sender, tokenId);
        return _retire(tokenId, amount, msg.sender, beneficiary, reason);
    }

    /**
     * @notice Pool đang giữ NFT hủy tín chỉ thay mặt `retiree` (người đã đốt token ERC-20 tương ứng).
     *         Chỉ hợp đồng có RETIREMENT_AGENT_ROLE và đang sở hữu NFT mới gọi được.
     */
    function retireFor(
        address retiree,
        uint256 tokenId,
        uint256 amount,
        string calldata beneficiary,
        string calldata reason
    ) external onlyRole(RETIREMENT_AGENT_ROLE) whenNotPaused returns (uint256) {
        if (_requireOwned(tokenId) != msg.sender) revert NotOwnerNorApproved(msg.sender, tokenId);
        return _retire(tokenId, amount, retiree, beneficiary, reason);
    }

    function _retire(
        uint256 tokenId,
        uint256 amount,
        address retiree,
        string calldata beneficiary,
        string calldata reason
    ) private returns (uint256 certificateId) {
        if (amount == 0) revert InvalidQuantity();
        if (bytes(beneficiary).length == 0) revert EmptyBeneficiary();

        CreditBatch storage b = _batches[tokenId];
        uint256 remaining = b.quantity - b.retired;
        if (amount > remaining) revert ExceedsRemaining(amount, remaining);

        uint256 serialFrom = b.serialFrom + b.retired;
        uint256 serialTo = serialFrom + amount - 1;
        b.retired += amount;

        certificateId = _certificates.length;
        _certificates.push(
            RetirementCertificate({
                tokenId: tokenId,
                serialFrom: serialFrom,
                serialTo: serialTo,
                amount: amount,
                retiree: retiree,
                beneficiary: beneficiary,
                reason: reason,
                retiredAt: uint64(block.timestamp)
            })
        );

        emit CreditRetired(certificateId, tokenId, retiree, amount, serialFrom, serialTo, beneficiary, reason);

        // Lô đã hủy hết: đốt NFT để không thể chuyển nhượng hay hủy lại.
        if (b.retired == b.quantity) _burn(tokenId);
    }

    // ------------------------------------------------------------------
    // Quản trị
    // ------------------------------------------------------------------

    /// @notice Cơ quan quản lý tạm dừng phát hành, chuyển nhượng và hủy khi phát hiện sự cố.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------------------
    // Tra cứu
    // ------------------------------------------------------------------

    function seriesKey(string calldata projectId, uint16 vintage) public pure returns (bytes32) {
        return keccak256(abi.encode(projectId, vintage));
    }

    /// @notice Thông tin lô; vẫn tra cứu được sau khi NFT đã bị đốt do hủy hết.
    function getBatch(uint256 tokenId) external view returns (CreditBatch memory) {
        if (_batches[tokenId].quantity == 0) revert NonexistentBatch(tokenId);
        return _batches[tokenId];
    }

    function remainingOf(uint256 tokenId) external view returns (uint256) {
        CreditBatch storage b = _batches[tokenId];
        return b.quantity - b.retired;
    }

    function getCertificate(uint256 certificateId) external view returns (RetirementCertificate memory) {
        return _certificates[certificateId];
    }

    function totalCertificates() external view returns (uint256) {
        return _certificates.length;
    }

    function totalBatches() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ------------------------------------------------------------------
    // Ghi đè bắt buộc
    // ------------------------------------------------------------------

    /// Chặn mọi chuyển nhượng khi hợp đồng đang tạm dừng (đốt NFT khi hủy hết đã kiểm tra ở retire).
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        _requireNotPaused();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
