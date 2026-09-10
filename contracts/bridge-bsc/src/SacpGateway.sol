// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISACP {
    function mintByGateway(address to, uint256 amount) external;
    function burnByGateway(uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title SacpGateway — operator mint caps + user burn/redeem for Stable ACP.
/// @notice Distinct from BridgeGateway/wACP. See docs/STABLECOIN_SACP_SPEC.md.
contract SacpGateway {
    ISACP public immutable sacp;
    address public owner;

    bool public paused;
    uint256 public mintCapPerDay;
    uint256 public maxSingleMint;
    uint256 private mintedToday;
    uint256 private mintDayBucket;
    uint256 public nextRequestId;

    event MintStable(address indexed to, uint256 amount, bytes32 indexed collateralRef);
    event RedeemRequested(
        uint256 indexed requestId, address indexed from, string acpAddress, uint256 amount
    );
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event CapsUpdated(uint256 maxSingleMint, uint256 mintCapPerDay);

    error Unauthorized();
    error EnforcedPause();
    error ExpectedNotPause();
    error ExceedsMaxSingleMint();
    error ExceedsMintCapPerDay();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert EnforcedPause();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert ExpectedNotPause();
        _;
    }

    constructor(address sacp_, uint256 maxSingleMint_, uint256 mintCapPerDay_) {
        owner = msg.sender;
        sacp = ISACP(sacp_);
        maxSingleMint = maxSingleMint_;
        mintCapPerDay = mintCapPerDay_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert Unauthorized();
        owner = newOwner;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function setCaps(uint256 maxSingle, uint256 perDay) external onlyOwner {
        maxSingleMint = maxSingle;
        mintCapPerDay = perDay;
        emit CapsUpdated(maxSingle, perDay);
    }

    function _rollMintDay() internal {
        uint256 day = block.timestamp / 1 days;
        if (day != mintDayBucket) {
            mintDayBucket = day;
            mintedToday = 0;
        }
    }

    /// @notice Operator mint after off-chain ACP collateral proof.
    function mintStable(address to, uint256 amount, bytes32 collateralRef)
        external
        onlyOwner
        whenNotPaused
    {
        if (amount > maxSingleMint) revert ExceedsMaxSingleMint();
        _rollMintDay();
        if (mintedToday + amount > mintCapPerDay) revert ExceedsMintCapPerDay();
        mintedToday += amount;
        sacp.mintByGateway(to, amount);
        emit MintStable(to, amount, collateralRef);
    }

    /// @notice User locks sACP into gateway and burns; backend unlocks ACP collateral after event.
    function requestRedeem(string calldata acpAddress, uint256 amount) external whenNotPaused {
        require(sacp.transferFrom(msg.sender, address(this), amount), "transferFrom");
        sacp.burnByGateway(amount);
        uint256 rid = ++nextRequestId;
        emit RedeemRequested(rid, msg.sender, acpAddress, amount);
    }
}
