// 加密我们的密钥
import { ethers } from "ethers";
import * as fs from "fs-extra"
import "dotenv/config"

async function main() {
    console.log(process.env.PRIVATE_KEY);
    console.log(process.env.PRIVATE_KEY_PASSWORD);
    // 首先链接到钱包
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
    // 通过指定的密码进行加密
    const encryptedJsonKey = await wallet.encrypt(
        process.env.PRIVATE_KEY_PASSWORD!,
        process.env.PRIVATE_KEY
    );
    // 将加密后的内容写出到 json 文件
    fs.writeFileSync("./encryptedKey.json", encryptedJsonKey);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })