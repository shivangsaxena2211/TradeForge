// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {User} from "../contracts/User.sol";

contract UserTest is Test {
    User internal userContract;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        userContract = new User();
    }

    function test_UserCanRegister() public {
        vm.prank(alice);
        userContract.register();

        assertTrue(userContract.isRegistered(alice));
    }

    function test_RegistrationEmitsEvent() public {
        vm.prank(alice);

        vm.expectEmit(true, false, false, true);
        emit User.UserRegistered(alice, block.timestamp);

        userContract.register();
    }

    function test_UserBecomesRegistered() public {
        vm.prank(alice);
        userContract.register();

        (bool registered, uint256 timestamp) = userContract.getUserRecord(alice);
        assertTrue(registered);
        assertGt(timestamp, 0);
    }

    function test_DuplicateRegistrationFails() public {
        vm.startPrank(alice);
        userContract.register();
        vm.expectRevert(User.AlreadyRegistered.selector);
        userContract.register();
        vm.stopPrank();
    }

    function test_AnotherAddressCanRegisterIndependently() public {
        vm.prank(alice);
        userContract.register();

        vm.prank(bob);
        userContract.register();

        assertTrue(userContract.isRegistered(alice));
        assertTrue(userContract.isRegistered(bob));
    }

    function test_UnregisteredAddressReportedCorrectly() public {
        assertFalse(userContract.isRegistered(alice));

        (bool registered, uint256 timestamp) = userContract.getUserRecord(alice);
        assertFalse(registered);
        assertEq(timestamp, 0);
    }

    function test_RegistrationTimestampIsSet() public {
        uint256 beforeTs = block.timestamp;

        vm.prank(alice);
        userContract.register();

        (, uint256 timestamp) = userContract.getUserRecord(alice);
        assertGe(timestamp, beforeTs);
    }

    function test_NoPersonalInformationStored() public {
        vm.prank(alice);
        userContract.register();

        // The contract only exposes registration status and timestamp.
        (bool registered, uint256 timestamp) = userContract.getUserRecord(alice);
        assertTrue(registered);
        assertGt(timestamp, 0);
    }
}
