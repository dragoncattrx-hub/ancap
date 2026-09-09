// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DigitalPassport} from "../src/DigitalPassport.sol";

contract DigitalPassportTest is Test {
    DigitalPassport internal passport;
    address internal minter = address(0xM1);
    address internal holder = address(0xH0);

    function setUp() public {
        passport = new DigitalPassport(minter);
    }

    function test_mint_and_query() public {
        vm.prank(minter);
        passport.mint(holder, 1, keccak256("claim-1"), "ipfs://passport/1");

        assertEq(passport.ownerOf(1), holder);
        assertEq(passport.balanceOf(holder), 1);
        assertEq(passport.claimHashOf(1), keccak256("claim-1"));
        assertEq(passport.tokenURI(1), "ipfs://passport/1");
        assertFalse(passport.isRevoked(1));
    }

    function test_revoke() public {
        vm.startPrank(minter);
        passport.mint(holder, 2, keccak256("claim-2"), "ipfs://passport/2");
        passport.revoke(2);
        vm.stopPrank();

        assertTrue(passport.isRevoked(2));
        assertEq(passport.ownerOf(2), holder);
    }

    function test_burn() public {
        vm.startPrank(minter);
        passport.mint(holder, 3, keccak256("claim-3"), "ipfs://passport/3");
        passport.burn(3);
        vm.stopPrank();

        assertEq(passport.balanceOf(holder), 0);
        vm.expectRevert(DigitalPassport.InvalidToken.selector);
        passport.tokenURI(3);
    }

    function test_transfer_reverts() public {
        vm.prank(minter);
        passport.mint(holder, 4, keccak256("claim-4"), "ipfs://passport/4");

        vm.prank(holder);
        vm.expectRevert(DigitalPassport.SoulboundTransfer.selector);
        passport.transfer(address(0xBEEF), 4);
    }

    function test_double_mint_reverts() public {
        vm.startPrank(minter);
        passport.mint(holder, 5, keccak256("claim-5"), "ipfs://passport/5");
        vm.expectRevert(DigitalPassport.TokenAlreadyExists.selector);
        passport.mint(holder, 5, keccak256("claim-5b"), "ipfs://passport/5b");
        vm.stopPrank();
    }

    function test_only_minter() public {
        vm.prank(holder);
        vm.expectRevert(DigitalPassport.Unauthorized.selector);
        passport.mint(holder, 6, keccak256("claim-6"), "ipfs://passport/6");
    }
}
