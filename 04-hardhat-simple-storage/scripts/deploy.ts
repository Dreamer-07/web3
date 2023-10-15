import { ethers, network, run } from "hardhat";
import { SimpleStorage, SimpleStorage__factory } from "../typechain-types";

async function main() {
  // 获取合约工厂
  const simpleStorageFactory: SimpleStorage__factory = await ethers.getContractFactory("SimpleStorage");

  // 部署合约
  const simpleStorage: SimpleStorage = await simpleStorageFactory.deploy();
  // 等待合约部署完成
  await simpleStorage.waitForDeployment();

  // 查看合约地址
  console.log(`SimpleStorage Contract Address: ${simpleStorage.target}`);

  // 验证合同
  if (network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
    // echersacn 需要一定的时间才可以同步区块链上的信息，等待 n 个区块
    const deployTx = simpleStorage.deploymentTransaction()
    if (deployTx) {
      await deployTx.wait(6)
    }

    // 校验合同
    await check((simpleStorage.target) as string, []);
  }

  // 与合同中的函数交互
  const currValue = await simpleStorage.retrieve();
  console.log(`current value is: ${currValue}`);

  await simpleStorage.store(8);
  const updatedValue = await simpleStorage.retrieve();
  console.log(`updated value is: ${updatedValue}`);
}

async function check(contractAddress: string, args: any[]) {
  console.log("Verifying contract...");
  try {
    // 通过 run 可以模拟命令行执行命令
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args
    })
  } catch (e: any) {
    // 如果重复校验已经校验过的合同，会自动报错
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!")
    } else {
      console.log(e)
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
check("0x6990416afcdde6a982fa2c04f263a0b167fb0f3a", []).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});