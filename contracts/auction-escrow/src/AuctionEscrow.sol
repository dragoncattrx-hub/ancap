// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AuctionEscrow — operator-anchored ACP auction escrow on BSC.
/// @notice Backend operator records lots/bids/settlements; ACP value is off-chain
///         until ledger rails are linked. Claim hashes bind UI contracts to chain.
contract AuctionEscrow {
    string public constant name = "ANCAP Auction Escrow";
    string public constant version = "1";

    address public owner;
    address public operator;

    enum LotStatus {
        None,
        Live,
        Settled,
        Cancelled
    }

    struct Lot {
        address seller;
        uint256 reserveAcp;
        uint256 highBidAcp;
        address highBidder;
        bytes32 claimHash;
        LotStatus status;
        string vertical; // fauna | tech | galaxy | art
    }

    mapping(bytes32 => Lot) public lots;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OperatorChanged(address indexed previousOperator, address indexed newOperator);
    event LotCreated(bytes32 indexed lotId, address indexed seller, uint256 reserveAcp, bytes32 claimHash, string vertical);
    event BidRecorded(bytes32 indexed lotId, address indexed bidder, uint256 amountAcp, bytes32 bidHash);
    event LotSettled(bytes32 indexed lotId, address indexed winner, uint256 amountAcp);
    event LotCancelled(bytes32 indexed lotId);

    error Unauthorized();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidLot();
    error LotExists();
    error LotNotLive();
    error BidTooLow();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) revert Unauthorized();
        _;
    }

    constructor(address initialOperator) {
        if (initialOperator == address(0)) revert InvalidAddress();
        owner = msg.sender;
        operator = initialOperator;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert InvalidAddress();
        emit OperatorChanged(operator, newOperator);
        operator = newOperator;
    }

    function createLot(
        bytes32 lotId,
        address seller,
        uint256 reserveAcp,
        bytes32 claimHash,
        string calldata vertical
    ) external onlyOperator {
        if (seller == address(0)) revert InvalidAddress();
        if (reserveAcp == 0) revert InvalidAmount();
        if (lots[lotId].status != LotStatus.None) revert LotExists();
        lots[lotId] = Lot({
            seller: seller,
            reserveAcp: reserveAcp,
            highBidAcp: 0,
            highBidder: address(0),
            claimHash: claimHash,
            status: LotStatus.Live,
            vertical: vertical
        });
        emit LotCreated(lotId, seller, reserveAcp, claimHash, vertical);
    }

    function recordBid(bytes32 lotId, address bidder, uint256 amountAcp, bytes32 bidHash) external onlyOperator {
        Lot storage lot = lots[lotId];
        if (lot.status != LotStatus.Live) revert LotNotLive();
        if (bidder == address(0)) revert InvalidAddress();
        if (amountAcp == 0) revert InvalidAmount();
        uint256 floor = lot.highBidAcp == 0 ? lot.reserveAcp : lot.highBidAcp;
        if (amountAcp < floor) revert BidTooLow();
        lot.highBidAcp = amountAcp;
        lot.highBidder = bidder;
        emit BidRecorded(lotId, bidder, amountAcp, bidHash);
    }

    function settle(bytes32 lotId, address winner, uint256 amountAcp) external onlyOperator {
        Lot storage lot = lots[lotId];
        if (lot.status != LotStatus.Live) revert LotNotLive();
        if (winner == address(0)) revert InvalidAddress();
        if (amountAcp == 0) revert InvalidAmount();
        lot.status = LotStatus.Settled;
        lot.highBidder = winner;
        lot.highBidAcp = amountAcp;
        emit LotSettled(lotId, winner, amountAcp);
    }

    function cancel(bytes32 lotId) external onlyOperator {
        Lot storage lot = lots[lotId];
        if (lot.status != LotStatus.Live) revert LotNotLive();
        lot.status = LotStatus.Cancelled;
        emit LotCancelled(lotId);
    }

    function getLot(bytes32 lotId)
        external
        view
        returns (
            address seller,
            uint256 reserveAcp,
            uint256 highBidAcp,
            address highBidder,
            bytes32 claimHash,
            LotStatus status,
            string memory vertical
        )
    {
        Lot storage lot = lots[lotId];
        if (lot.status == LotStatus.None) revert InvalidLot();
        return (
            lot.seller,
            lot.reserveAcp,
            lot.highBidAcp,
            lot.highBidder,
            lot.claimHash,
            lot.status,
            lot.vertical
        );
    }
}
