// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 引入其他 sol 文件
import "./SimpleStorage.sol";

// 定义一个合约(一个文件中能定义多个合约)
contract StorageFactory {
    // 通过一个合约来部署其他合约
    SimpleStorage[] public simpleStorageArray;

    function createSimpleStorage() public {
        SimpleStorage simpleStorage = new SimpleStorage();
        simpleStorageArray.push(simpleStorage);
    }

    // 与其他合约交互
    function sfStore(uint256 _index, uint256 _storeNumber) public {
        // 获取合约所在的位置
        SimpleStorage simpleStorage = simpleStorageArray[_index];
        simpleStorage.store(_storeNumber);
    }

    function sfGet(uint256 _index) public view returns(uint256) {
        return simpleStorageArray[_index].retrieve();
    }
}