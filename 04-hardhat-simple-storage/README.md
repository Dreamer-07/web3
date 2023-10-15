# Hardhat 框架的学习

- hardhat 框架的基本命令和使用
    - 编译 sol
    - 部署
    - 交互
    - 自定义 hardhat 的任务(通过命令行执行)
    - 通过 pnpm hardhat node 可以启动一个本地的区块链(类似于 Ganache)
    - 通过 pnpm hardhat console 可以在命令行通过 js 编码的方式与区块链进行交互(感觉用的很少)
- 通过 etherscan 可以通过编码的方式验证合同
- 通过 typechain 生成 sol 文件对应的 ts 类型(现在 pnpm hardhat compile 已经自带这个功能了，可以看 typechain-types 文件夹)
- 通过 chai 验证测试代码
    - 通过命令行 `pnpm hardhat test` 可以执行测试代码
    - 在后面添加 -grep xxx 可以根据 it 方法的名称(第一个参数) 来执行含有该参数值(xxx)的方法
- 通过 hardhat-gas-reporter 可以帮助我们计算部署合同以及合同交互需要消费的gas
    - 在 `hardhat.config.ts` 中开启并引入 `hardhat-gas-reporter` 再执行测试命令即可
    - 关于计算货币的单位转换库的 key，可以再 https://pro.coinmarketcap.com/account/ 中获取
- 通过 solidity-coverage 可以帮助我们检查代码的使用率