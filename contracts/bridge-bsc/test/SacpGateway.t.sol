// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SACP} from "../src/SACP.sol";
import {SacpGateway} from "../src/SacpGateway.sol";

contract SacpGatewayTest is Test {
    SACP internal token;
    SacpGateway internal gateway;
    address internal user = address(0xBEEF);

    function setUp() public {
        address predicted = vm.computeCreateAddress(address(this), uint256(vm.getNonce(address(this))) + 1);
        token = new SACP(predicted);
        gateway = new SacpGateway(address(token), 1_000 ether, 10_000 ether);
        assertEq(address(gateway), predicted);
    }

    function testMintAndRedeem() public {
        gateway.mintStable(user, 10 ether, bytes32("col1"));
        assertEq(token.balanceOf(user), 10 ether);
        assertEq(token.totalSupply(), 10 ether);

        vm.prank(user);
        token.approve(address(gateway), 4 ether);
        vm.prank(user);
        gateway.requestRedeem("acp1test", 4 ether);

        assertEq(token.balanceOf(user), 6 ether);
        assertEq(token.totalSupply(), 6 ether);
    }

    function testPauseBlocksMint() public {
        gateway.pause();
        vm.expectRevert(SacpGateway.EnforcedPause.selector);
        gateway.mintStable(user, 1 ether, bytes32(0));
    }
}
