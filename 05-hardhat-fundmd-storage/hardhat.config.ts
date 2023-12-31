import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "dotenv/config";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);

const {
  PRIVATE_KEY = "",
  SEPOLIA_RPC_URL,
  COINMARKETCAP_API_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.19",
      },
      {
        version: "0.6.6",
      },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-reports.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
  },
  mocha: {
    // 配置测试上链超时时间，一般可以设置大一点
    timeout: 50000,
  },
};

export default config;
