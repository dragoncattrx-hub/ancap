// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title WACP — Wrapped ACP (18 decimals), mint/burn only via gateway contract.
contract WACP {
    string public constant name = "Wrapped ACP";
    string public constant symbol = "wACP";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public gateway;
    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event GatewayChanged(address indexed previousGateway, address indexed newGateway);

    error Unauthorized();
    error InvalidAddress();

    constructor(address initialGateway) {
        if (initialGateway == address(0)) revert InvalidAddress();
        owner = msg.sender;
        gateway = initialGateway;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyGateway() {
        if (msg.sender != gateway) revert Unauthorized();
        _;
    }

    function setGateway(address newGateway) external onlyOwner {
        if (newGateway == address(0)) revert InvalidAddress();
        emit GatewayChanged(gateway, newGateway);
        gateway = newGateway;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    /// @notice Mint wACP to `to`. Callable only by the gateway (BridgeGateway).
    function mintByGateway(address to, uint256 amount) external onlyGateway {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Burn wACP from gateway balance (gateway must hold tokens).
    function burnByGateway(uint256 amount) external onlyGateway {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}
