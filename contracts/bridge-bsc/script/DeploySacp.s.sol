// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SACP} from "../src/SACP.sol";
import {SacpGateway} from "../src/SacpGateway.sol";

/// @notice Deploy SACP + SacpGateway with predicted gateway address (same pattern as wACP Deploy.s.sol).
contract DeploySacpScript is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);

        uint256 maxSingle = vm.envOr("SACP_MAX_SINGLE_MINT_WEI", uint256(1_000 ether));
        uint256 perDay = vm.envOr("SACP_MINT_CAP_PER_DAY_WEI", uint256(10_000 ether));

        uint64 nonce = uint64(vm.getNonce(deployer));
        address predictedGateway = vm.computeCreateAddress(deployer, uint256(nonce) + 1);

        vm.startBroadcast(deployerPk);

        SACP token = new SACP(predictedGateway);
        SacpGateway gateway = new SacpGateway(address(token), maxSingle, perDay);

        require(address(gateway) == predictedGateway, "DeploySacpScript: gateway address mismatch");

        vm.stopBroadcast();

        console2.log("SACP", address(token));
        console2.log("SacpGateway", address(gateway));
    }
}
