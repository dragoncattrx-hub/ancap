// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WACP} from "../src/WACP.sol";
import {BridgeGateway} from "../src/BridgeGateway.sol";

contract BridgeGatewayTest is Test {
    WACP public wacp;
    BridgeGateway public gw;
    address public operator = address(0xBEEF);
    address public user = address(0xCAFE);

    function setUp() public {
        vm.startPrank(operator);
        wacp = new WACP(operator);
        gw = new BridgeGateway(address(wacp), type(uint256).max / 2, type(uint256).max / 2);
        wacp.setGateway(address(gw));
        wacp.transferOwnership(operator);
        gw.transferOwnership(operator);
        vm.stopPrank();
    }

    function testMintWrapped_onlyOwner() public {
        vm.prank(operator);
        bytes32 ref = keccak256("deposit-1");
        gw.mintWrapped(user, 1e18, ref);
        assertEq(wacp.balanceOf(user), 1e18);
    }

    function testMintWrapped_revertsWhenNotOwner() public {
        vm.expectRevert(BridgeGateway.Unauthorized.selector);
        gw.mintWrapped(user, 1e18, bytes32(0));
    }

    function testMintWrapped_revertsWhenPaused() public {
        vm.prank(operator);
        gw.pause();
        vm.prank(operator);
        vm.expectRevert(BridgeGateway.EnforcedPause.selector);
        gw.mintWrapped(user, 1e18, bytes32(0));
    }

    function testMaxSingleMint() public {
        vm.startPrank(operator);
        BridgeGateway gw2 = new BridgeGateway(address(wacp), 100, type(uint256).max);
        wacp.setGateway(address(gw2));
        gw2.transferOwnership(operator);
        vm.expectRevert(BridgeGateway.ExceedsMaxSingleMint.selector);
        gw2.mintWrapped(user, 101, bytes32(0));
        vm.stopPrank();
    }

    function testRequestRelease_burnsAndEmits() public {
        vm.prank(operator);
        gw.mintWrapped(user, 5e18, bytes32("a"));
        vm.prank(user);
        wacp.approve(address(gw), 5e18);
        vm.prank(user);
        gw.requestRelease("acp1test", 5e18);
        assertEq(gw.nextRequestId(), 1);
        assertEq(wacp.balanceOf(user), 0);
        assertEq(wacp.totalSupply(), 0);
    }

    function testNonGatewayCannotMint() public {
        vm.expectRevert(WACP.Unauthorized.selector);
        wacp.mintByGateway(user, 1);
    }
}
