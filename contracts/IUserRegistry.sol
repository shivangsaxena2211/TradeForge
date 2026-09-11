// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal interface for on-chain user registration checks.
interface IUserRegistry {
    function isRegistered(address user) external view returns (bool);
}
