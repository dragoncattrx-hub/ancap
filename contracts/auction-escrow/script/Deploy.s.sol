// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AuctionEscrow} from "../src/AuctionEscrow.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address operator = vm.envOr("AUCTION_OPERATOR", vm.addr(deployerPk));

        vm.startBroadcast(deployerPk);
        AuctionEscrow escrow = new AuctionEscrow(operator);
        vm.stopBroadcast();

        console2.log("AuctionEscrow", address(escrow));
        console2.log("Operator", operator);
    }
}
