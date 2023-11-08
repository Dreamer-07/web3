const { network, ethers } = require("hardhat")
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const FUND_AMOUNT = ethers.utils.parseEther("1")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorV2Mock, vrfCoordinatorV2MockAddress, subId

    if (chainId == 31337) {
        // localhost / hardhat => get a mock VRFCoordinatorV2Mock contract
        const vrfCoordinatorV2MockDeploymentInfo = await deployments.get("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2MockDeploymentInfo.address);
        vrfCoordinatorV2MockAddress = vrfCoordinatorV2Mock.address
        // create sub
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        // get sub id for emit events
        subId = transactionReceipt.events[0].args.subId

        // 向 sub 中转入资金
        await vrfCoordinatorV2Mock.fundSubscription(subId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2MockAddress = networkConfig[chainId]["vrfCoordinatorV2"]
        subId = networkConfig[chainId]["subscriptionId"]
    }

    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS

    const { gasLane, keepersUpdateInterval, raffleEntranceFee, callbackGasLimit } = networkConfig[chainId]
    const args = [
        gasLane, raffleEntranceFee, subId, vrfCoordinatorV2MockAddress, callbackGasLimit, keepersUpdateInterval
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        log: true,
        args,
        waitConfirmations: waitBlockConfirmations
    })

    // 创建 sub 的消费者
    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(subId, raffle.address);
    }

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, arguments)
    }

    log("Enter lottery with command:")
    const networkName = network.name == "hardhat" ? "localhost" : network.name
    log(`yarn hardhat run scripts/enterRaffle.js --network ${networkName}`)
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]