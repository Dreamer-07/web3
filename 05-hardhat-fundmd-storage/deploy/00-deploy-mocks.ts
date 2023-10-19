// 部署本地环境需要的 mock 合约
import { HardhatRuntimeEnvironment } from "hardhat/types";

const DECIMALS = "18";
const INITIAL_PRICE = "2000000000000000000000"; // 2000

const deployMocks = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;

  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log("Local network detected! deploying mocks....");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_PRICE],
    });
    log("Mocks Deployed!");
  }
};

export default deployMocks;
deployMocks.tags = ["all", "mocks"];
