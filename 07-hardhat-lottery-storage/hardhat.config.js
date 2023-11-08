require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()
const { ProxyAgent, setGlobalDispatcher } = require("undici")

const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);


const {
  PRIVATE_KEY = "",
  SEPOLIA_RPC_URL,
  COINMARKETCAP_API_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: "0.8.19",
  networks: {
    "hardhat": {
      chainId: 31337,
    },
    "localhost": {
      chainId: 31337
    },
    "sepolia": {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: false,
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
    player: {
      default: 1
    }
  },
  mocha: {
    // 配置测试上链超时时间，一般可以设置大一点
    timeout: 500000,
  },
};
