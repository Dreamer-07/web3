import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Deployment } from "hardhat-deploy/dist/types";
import { assert } from "chai";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging Tests", async function () {
      let fundMe: FundMe, deployer: SignerWithAddress;

      const sendValue = ethers.parseEther("0.1");

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];

        const fundMeDeployment: Deployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
      });

      it("Allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw({
          gasLimit: 100000,
        });

        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );

        console.log((await ethers.provider.getBalance(deployer)).toString());

        assert.equal(endingFundMeBalance.toString(), "0");
      });
    });
