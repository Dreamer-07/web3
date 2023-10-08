// 使用加密后的 key 来进行部署等操作
import { ethers } from "ethers";
import * as fs from "fs-extra"
import "dotenv/config"

/**
 * 通过先执行本函数得到加密后的文件
 * 当链接钱包时再通过相关的api(./encryptKeyDeploy.ts)访问文件去链接，避免密钥泄露
 */
async function main() {
    // 部署合约
    // 链接到区块链的 rpc url
    let provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    // 获取加密的 json 数据
    const encryptedJson = await fs.readFileSync("./encryptedKey.json", "utf-8");
    // 通过加密的 json 文件获取钱包
    const wallet = await ethers.Wallet.fromEncryptedJsonSync(
        encryptedJson,
        process.env.PRIVATE_KEY_PASSWORD!
    ).connect(provider);

    // const wallet = new ethers.Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
    // 读取要部署的 abi 和 binary
    const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf-8");
    const binary = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.bin", "utf-8");
    // 创建合约工厂(用来部署合约)
    const factory = new ethers.ContractFactory(abi, binary, wallet);
    // 部署合约
    console.log("Depolying, please wait...");
    const contract = await factory.deploy();
    // 等待区块交易完成(获取交易回执)
    const deploymentReceipt = await contract.deployTransaction.wait();
    // 查看合约地址
    console.log("contract address:" + contract.address);

    // 可以通过 contract 对象与合约交互
    const currentFavoriteNumber = await contract.retrieve();
    // 由于 js 中的整数位大小有限制，所以 ethers 会帮我们将返回值使用其特殊类型 BigNumber 包装
    // 通过 toString() 可以获取到具体数值
    console.log(`current favorite number: ${currentFavoriteNumber.toString()}`);
    // 当我们需要传递一些整数时，最好也有字符串进行保证
    const transactionResponse = await contract.store("8");
    // 等待交易完成
    const transcationReceipt = await transactionResponse.wait(1);
    // 重新获取
    const updateFavoriteNumber = await contract.retrieve();
    console.log(`update favorite number: ${updateFavoriteNumber.toString()}`);
    
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })