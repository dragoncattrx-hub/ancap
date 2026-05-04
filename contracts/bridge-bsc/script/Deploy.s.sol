// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {WACP} from "../src/WACP.sol";
import {BridgeGateway} from "../src/BridgeGateway.sol";

/// @notice Deploy WACP + BridgeGateway in two CREATEs with no temporary-gateway window:
/// WACP is constructed with `gateway = predicted` where `predicted` is the address of the
/// BridgeGateway deployment (deployer nonce + 1). See test/DeployPrediction.t.sol.
contract DeployScript is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);

        uint256 maxSingle = vm.envOr("BRIDGE_MAX_SINGLE_MINT_WEI", uint256(1_000 ether));
        uint256 perDay = vm.envOr("BRIDGE_MINT_CAP_PER_DAY_WEI", uint256(10_000 ether));

        uint64 nonce = uint64(vm.getNonce(deployer));
        address predictedGateway = vm.computeCreateAddress(deployer, uint256(nonce) + 1);

        vm.startBroadcast(deployerPk);

        WACP wacp = new WACP(predictedGateway);
        BridgeGateway gateway = new BridgeGateway(address(wacp), maxSingle, perDay);

        require(address(gateway) == predictedGateway, "DeployScript: gateway address mismatch");

        vm.stopBroadcast();

        console2.log("WACP", address(wacp));
        console2.log("BridgeGateway", address(gateway));
    }
}
