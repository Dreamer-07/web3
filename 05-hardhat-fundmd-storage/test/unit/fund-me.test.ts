import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { assert, expect } from "chai";
import { Deployment } from "hardhat-deploy/dist/types";
import { equal } from "assert";

// 在开发环境中进行测试
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe: FundMe, mockV3Aggregator: MockV3Aggregator, deployer: string;
      const sendValue = ethers.parseEther("1");

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        // 保证测试代码使用的是同一个环境中部署的合约
        await deployments.fixture(["all"]);

        // 获取合同的部署信息
        const fundMeDeployment: Deployment = await deployments.get("FundMe");
        const mockV3AggregatorDeployment: Deployment = await deployments.get(
          "MockV3Aggregator"
        );

        // 获取合约
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          mockV3AggregatorDeployment.address
        );
      });

      describe("constructor", function () {
        it("判断 fundme 合约中的 priceFeed 合约的地址是否正确", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, await mockV3Aggregator.getAddress());
        });
      });

      describe("fund function", function () {
        it("如果你没有发送足够的 eth, 就会失败", async () => {
          await expect(fundMe.fund()).to.be.reverted;
        });

        it("提供足够的 eth", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("查看捐赠者信息", async () => {
          await fundMe.fund({ value: sendValue });
          const res = await fundMe.getFunder(0);
          assert.equal(res.toString(), deployer);
        });
      });

      /**
       * 单元测试中应该遵循 AAA 原则，即：
       *    Arrange: 先設定我們在這次測試中，所預期的結果
       *    Act: 就是我們想要測試的function 或method.
       *    Assert: 確認在Action 發生後，確認在執行了想要測試function 或method 後，的確符合我們在Arrange 階段設定的目標
       */
      describe("withdraw function", function () {
        beforeEach(async () => {
          await fundMe.fund({
            value: sendValue,
          });
        });

        it("从单个资助者处提取ETH", async () => {
          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, gasPrice } = transactionReceipt!;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            (startingDeployerBalance + startingFundMeBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });

        it("从多个投资者中提取 ETH", async () => {
          // Arrange
          const accounts = await ethers.getSigners();

          await fundMe.connect(accounts[1]).fund({
            value: sendValue,
          });
          await fundMe.connect(accounts[2]).fund({
            value: sendValue,
          });
          await fundMe.connect(accounts[3]).fund({
            value: sendValue,
          });
          await fundMe.connect(accounts[4]).fund({
            value: sendValue,
          });
          await fundMe.connect(accounts[8]).fund({
            value: sendValue,
          });

          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, gasPrice } = transactionReceipt!;
          const gasCost = gasUsed * gasPrice;
          console.log(`GasCount: ${gasCost}`);
          console.log(`GasUsed: ${gasUsed}`);
          console.log(`GasPrice: ${gasPrice}`);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
          await expect(fundMe.getFunder(0)).to.be.reverted;
          assert.equal(
            (await fundMe.getAddressToAmountFunded(accounts[0])).toString(),
            "0"
          );
          assert.equal(
            (await fundMe.getAddressToAmountFunded(accounts[1])).toString(),
            "0"
          );
          assert.equal(
            (await fundMe.getAddressToAmountFunded(accounts[2])).toString(),
            "0"
          );
        });

        it("只有合同的拥有者才可以提取 ETH", async () => {
          const accounts = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(accounts[1]);
          expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__OnlyOwner"
          );
        });
      });
    });
