// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IUserRegistry} from "./IUserRegistry.sol";

/// @title User
/// @notice On-chain user registry for DEFINN academic stock-trading simulation.
/// @dev Stores only blockchain-safe identifiers. Never store PII, passwords, or keys.
contract User is IUserRegistry {
    struct UserRecord {
        bool registered;
        uint256 registrationTimestamp;
    }

    mapping(address => UserRecord) private _users;

    error AlreadyRegistered();

    event UserRegistered(address indexed user, uint256 timestamp);

    /// @notice Register the caller as an on-chain DEFINN user.
    function register() external {
        if (_users[msg.sender].registered) {
            revert AlreadyRegistered();
        }

        _users[msg.sender] = UserRecord({
            registered: true,
            registrationTimestamp: block.timestamp
        });

        emit UserRegistered(msg.sender, block.timestamp);
    }

    /// @inheritdoc IUserRegistry
    function isRegistered(address user) external view returns (bool) {
        return _users[user].registered;
    }

    /// @notice Read registration metadata for an address.
    /// @param user The wallet address to query.
    /// @return registered Whether the address is registered.
    /// @return registrationTimestamp Unix timestamp of registration (0 if unregistered).
    function getUserRecord(address user)
        external
        view
        returns (bool registered, uint256 registrationTimestamp)
    {
        UserRecord memory record = _users[user];
        return (record.registered, record.registrationTimestamp);
    }
}
