// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {DigitalPassport} from "../src/DigitalPassport.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address minter = vm.envOr("PASSPORT_MINTER", vm.addr(deployerPk));

        vm.startBroadcast(deployerPk);
        DigitalPassport passport = new DigitalPassport(minter);
        vm.stopBroadcast();

        console2.log("DigitalPassport", address(passport));
        console2.log("Minter", minter);
    }
}
