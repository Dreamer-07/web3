import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "dotenv/config";
import "./tasks/block-number";
// 配置代理网络
import {ProxyAgent, setGlobalDispatcher} from "undici";
const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);

const { SEPOLIA_PRC_URL, PRIVATE_KEY = "key", ETHERSCAN_API_KEY, COINMARKETCAP_API_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: SEPOLIA_PRC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: true,
    // 将输出的 gas 消费信息保存到文件中
    outputFile: "gas-report.txt",
    // 关闭颜色
    noColors: true,
    // 消费的金额的货币单位
    currency: "CNY",
    coinmarketcap: COINMARKETCAP_API_KEY,
  }
};

export default config;
