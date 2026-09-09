// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DigitalPassport — soulbound identity attestation on BSC.
/// @notice Non-transferable tokens; only minter may mint/revoke/burn.
contract DigitalPassport {
    string public constant name = "ANCAP Digital Passport";
    string public constant symbol = "ADP";
    string public constant version = "1";

    address public owner;
    address public minter;

    uint256 public totalSupply;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => bytes32) public claimHashOf;
    mapping(uint256 => string) public tokenURIOf;
    mapping(uint256 => bool) public revoked;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MinterChanged(address indexed previousMinter, address indexed newMinter);
    event PassportMinted(address indexed to, uint256 indexed tokenId, bytes32 claimHash, string uri);
    event PassportRevoked(uint256 indexed tokenId, address indexed holder);
    event PassportBurned(uint256 indexed tokenId, address indexed holder);

    error Unauthorized();
    error InvalidAddress();
    error InvalidToken();
    error TokenAlreadyExists();
    error TokenRevoked();
    error SoulboundTransfer();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyMinter() {
        if (msg.sender != minter) revert Unauthorized();
        _;
    }

    constructor(address initialMinter) {
        if (initialMinter == address(0)) revert InvalidAddress();
        owner = msg.sender;
        minter = initialMinter;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setMinter(address newMinter) external onlyOwner {
        if (newMinter == address(0)) revert InvalidAddress();
        emit MinterChanged(minter, newMinter);
        minter = newMinter;
    }

    /// @notice Mint soulbound passport to `to`. `tokenId` is backend-assigned passport id.
    function mint(address to, uint256 tokenId, bytes32 claimHash, string calldata uri) external onlyMinter {
        if (to == address(0)) revert InvalidAddress();
        if (ownerOf[tokenId] != address(0)) revert TokenAlreadyExists();
        ownerOf[tokenId] = to;
        claimHashOf[tokenId] = claimHash;
        tokenURIOf[tokenId] = uri;
        revoked[tokenId] = false;
        balanceOf[to] += 1;
        totalSupply += 1;
        emit PassportMinted(to, tokenId, claimHash, uri);
    }

    /// @notice Mark passport revoked; holder keeps soulbound token but status is on-chain.
    function revoke(uint256 tokenId) external onlyMinter {
        address holder = ownerOf[tokenId];
        if (holder == address(0)) revert InvalidToken();
        if (revoked[tokenId]) revert TokenRevoked();
        revoked[tokenId] = true;
        emit PassportRevoked(tokenId, holder);
    }

    /// @notice Burn passport and clear mappings.
    function burn(uint256 tokenId) external onlyMinter {
        address holder = ownerOf[tokenId];
        if (holder == address(0)) revert InvalidToken();
        delete ownerOf[tokenId];
        delete claimHashOf[tokenId];
        delete tokenURIOf[tokenId];
        revoked[tokenId] = false;
        balanceOf[holder] -= 1;
        totalSupply -= 1;
        emit PassportBurned(tokenId, holder);
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (ownerOf[tokenId] == address(0)) revert InvalidToken();
        return tokenURIOf[tokenId];
    }

    function isRevoked(uint256 tokenId) external view returns (bool) {
        if (ownerOf[tokenId] == address(0)) revert InvalidToken();
        return revoked[tokenId];
    }

    /// @dev Soulbound: all transfers revert.
    function transfer(address, uint256) external pure {
        revert SoulboundTransfer();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert SoulboundTransfer();
    }

    function transferFrom(address, address, uint256) external pure {
        revert SoulboundTransfer();
    }

    function approve(address, uint256) external pure {
        revert SoulboundTransfer();
    }

    function setApprovalForAll(address, bool) external pure {
        revert SoulboundTransfer();
    }
}
