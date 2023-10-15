import { task } from "hardhat/config"

export default task("block-number", "Prints the current block number")
    .setAction(async (_trakArgs, hre) => {
        await hre.ethers.provider.getBlockNumber().then((blockNumber: number) => {
            console.log(`current block number: ${blockNumber}`);
        })
    })