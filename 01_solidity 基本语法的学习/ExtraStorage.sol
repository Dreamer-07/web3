// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SimpleStorage.sol";

// 创建一个合约，通过 is 关键字可以继承合约
contract ExtraStorage is SimpleStorage {

    // 通过声明 override 可以重写父合约中的声明了 virutal 的方法
    function store(uint256 _number) public override {
        favoriteNumber = _number + 5;
    }
}