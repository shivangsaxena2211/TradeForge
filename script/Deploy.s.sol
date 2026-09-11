// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {User} from "../contracts/User.sol";
import {Stock} from "../contracts/Stock.sol";

/// @notice Deploy DEFINN smart contracts to the local Anvil network.
contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        User user = new User();
        Stock stock = new Stock(address(user));

        vm.stopBroadcast();

        console2.log("User deployed at:", address(user));
        console2.log("Stock deployed at:", address(stock));
        console2.log("Stock owner (admin):", stock.owner());
        console2.log("Chain ID:", block.chainid);

        string memory json = string.concat(
            "{\n",
            '  "chainId": ',
            vm.toString(block.chainid),
            ",\n",
            '  "networkName": "DEFINN Local Network",\n',
            '  "user": "',
            vm.toString(address(user)),
            '",\n',
            '  "stock": "',
            vm.toString(address(stock)),
            '",\n',
            '  "deployedAt": "',
            vm.toString(block.timestamp),
            "\"\n",
            "}\n"
        );

        vm.writeFile("lib/blockchain/contracts/addresses.local.json", json);
        console2.log("Addresses written to lib/blockchain/contracts/addresses.local.json");
    }
}
