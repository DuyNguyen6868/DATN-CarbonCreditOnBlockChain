// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {CarbonCreditNFT} from "./CarbonCreditNFT.sol";

/**
 * @title CarbonPool
 * @notice Pool ERC-20 cho phép giao dịch từng phần một lô tín chỉ.
 *         Nạp NFT lô vào pool -> nhận số token bằng số tCO2e còn lại của lô (1 token = 1 tCO2e).
 *         Đốt token để đổi lại (redeem) một lô cụ thể, hoặc để hủy (retire) một phần lô đó.
 *
 * Bất biến: totalSupply() == tổng remainingOf(tokenId) của các lô đang nằm trong pool.
 * NFT trong pool bị khóa: chỉ ra khỏi pool qua redeem, nên một lô không thể vừa được bán
 * dưới dạng NFT vừa được bán dưới dạng token (chặn bán kép).
 */
contract CarbonPool is ERC20, IERC721Receiver, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    CarbonCreditNFT public immutable credits;
    EnumerableSet.UintSet private _pooled;

    event Deposited(address indexed account, uint256 indexed tokenId, uint256 amount);
    event Redeemed(address indexed account, uint256 indexed tokenId, uint256 amount);
    event RetiredFromPool(address indexed account, uint256 indexed tokenId, uint256 amount, uint256 certificateId);

    error UnsupportedNFT(address nft);
    error NotInPool(uint256 tokenId);
    error EmptyBatch(uint256 tokenId);

    constructor(CarbonCreditNFT credits_) ERC20("Pooled Carbon Credit", "PCC") {
        credits = credits_;
    }

    /// @notice 1 token = 1 tCO2e, không chia nhỏ hơn một tấn.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Nạp lô `tokenId` vào pool (cần approve pool trước). Có thể dùng
    ///         credits.safeTransferFrom(user, pool, tokenId) trực tiếp để khỏi approve.
    function deposit(uint256 tokenId) external nonReentrant {
        credits.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    /// @dev Mọi đường nạp NFT đều đi qua hàm này; token ERC-20 được đúc cho người gửi NFT.
    function onERC721Received(address, address from, uint256 tokenId, bytes calldata)
        external
        override
        returns (bytes4)
    {
        if (msg.sender != address(credits)) revert UnsupportedNFT(msg.sender);
        uint256 amount = credits.remainingOf(tokenId);
        if (amount == 0) revert EmptyBatch(tokenId);

        _pooled.add(tokenId);
        _mint(from, amount);
        emit Deposited(from, tokenId, amount);
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @notice Đốt token bằng số tCO2e còn lại của lô `tokenId` để rút NFT ra khỏi pool.
    function redeem(uint256 tokenId) external nonReentrant {
        if (!_pooled.contains(tokenId)) revert NotInPool(tokenId);
        uint256 amount = credits.remainingOf(tokenId);

        _burn(msg.sender, amount);
        _pooled.remove(tokenId);
        credits.safeTransferFrom(address(this), msg.sender, tokenId);
        emit Redeemed(msg.sender, tokenId, amount);
    }

    /// @notice Đốt `amount` token và hủy đúng `amount` tCO2e của lô `tokenId` đang trong pool.
    ///         Chứng nhận hủy ghi người gọi là người hủy và `beneficiary` là bên được ghi nhận.
    function retire(uint256 tokenId, uint256 amount, string calldata beneficiary, string calldata reason)
        external
        nonReentrant
        returns (uint256 certificateId)
    {
        if (!_pooled.contains(tokenId)) revert NotInPool(tokenId);

        _burn(msg.sender, amount);
        // Lô hủy hết sẽ bị đốt bên hợp đồng NFT, nên bỏ khỏi danh sách trước khi gọi.
        if (amount == credits.remainingOf(tokenId)) _pooled.remove(tokenId);
        certificateId = credits.retireFor(msg.sender, tokenId, amount, beneficiary, reason);
        emit RetiredFromPool(msg.sender, tokenId, amount, certificateId);
    }

    function pooledTokenIds() external view returns (uint256[] memory) {
        return _pooled.values();
    }

    function isPooled(uint256 tokenId) external view returns (bool) {
        return _pooled.contains(tokenId);
    }
}
