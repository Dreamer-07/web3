// 编写测试代码
import { ethers } from "hardhat"
import { SimpleStorage, SimpleStorage__factory } from "../typechain-types"
import { assert, expect } from "chai";

describe("SimpleStorage", function() {
    let simpleStorage: SimpleStorage;
    let simpleStorageFactory: SimpleStorage__factory

    // 每次测试都会执行的方法
    beforeEach(async () => {
        simpleStorageFactory = (await ethers.getContractFactory("SimpleStorage")) as SimpleStorage__factory
        simpleStorage = await simpleStorageFactory.deploy();
    })

    // it 就是测试的具体方法
    it("Should start with a favorite number of 0", async function() {
        let currentValue = await simpleStorage.retrieve();
        // 验证方法 assert 和 expect 只是 api 使用的方式不同
        assert.equal(currentValue.toString(), "0");
    })

    it("Shoule update when we call store", async function() {
        let expectedValue = 8;
        let transactionResponse = await simpleStorage.store(expectedValue);
        let transactionReceipot = await transactionResponse.wait();
        let currentValue = await simpleStorage.retrieve();
        expect(currentValue).to.equal(expectedValue)
    })
})