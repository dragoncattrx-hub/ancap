// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AuctionEscrow} from "../src/AuctionEscrow.sol";

contract AuctionEscrowTest is Test {
    AuctionEscrow escrow;
    address operator = address(0xBEEF);
    address seller = address(0x1111);
    address bidder = address(0x2222);

    function setUp() public {
        escrow = new AuctionEscrow(operator);
    }

    function test_create_bid_settle() public {
        bytes32 lotId = keccak256("tech-llm-rail");
        bytes32 claim = keccak256("claim");
        vm.prank(operator);
        escrow.createLot(lotId, seller, 1000 ether, claim, "tech");

        bytes32 bidHash = keccak256("bid1");
        vm.prank(operator);
        escrow.recordBid(lotId, bidder, 1500 ether, bidHash);

        (, , uint256 high, address highBidder, , AuctionEscrow.LotStatus status, ) = escrow.getLot(lotId);
        assertEq(high, 1500 ether);
        assertEq(highBidder, bidder);
        assertEq(uint256(status), uint256(AuctionEscrow.LotStatus.Live));

        vm.prank(operator);
        escrow.settle(lotId, bidder, 1500 ether);
        (, , , , , AuctionEscrow.LotStatus settled, ) = escrow.getLot(lotId);
        assertEq(uint256(settled), uint256(AuctionEscrow.LotStatus.Settled));
    }

    function test_revert_non_operator() public {
        bytes32 lotId = keccak256("x");
        vm.expectRevert(AuctionEscrow.Unauthorized.selector);
        escrow.createLot(lotId, seller, 1, keccak256("c"), "fauna");
    }
}
