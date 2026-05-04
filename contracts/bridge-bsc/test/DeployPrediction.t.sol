// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WACP} from "../src/WACP.sol";
import {BridgeGateway} from "../src/BridgeGateway.sol";

/// @dev Mirrors script/Deploy.s.sol nonce prediction (no temporary gateway on deployer EOA).
contract DeployPredictionTest is Test {
    function test_predictedGatewayMatchesTwoStepDeploy() public {
        address deployer = address(0xA11CE);
        vm.startPrank(deployer);
        vm.deal(deployer, 100 ether);

        uint64 nonce = uint64(vm.getNonce(deployer));
        address predictedGateway = vm.computeCreateAddress(deployer, uint256(nonce) + 1);

        WACP wacp = new WACP(predictedGateway);
        BridgeGateway gw = new BridgeGateway(address(wacp), 100 ether, 1000 ether);

        assertEq(address(gw), predictedGateway, "gateway nonce prediction");
        assertEq(wacp.gateway(), address(gw));

        gw.mintWrapped(address(0xB0B), 1 ether, bytes32("ref"));
        assertEq(wacp.balanceOf(address(0xB0B)), 1 ether);
        vm.stopPrank();
    }
}
