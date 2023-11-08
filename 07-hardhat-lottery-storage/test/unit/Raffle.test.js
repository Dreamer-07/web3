const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
        let accounts, player, vrfCoordinatorV2Mock, raffle, raffleContract, interval, raffleEnterFee

        beforeEach(async () => {
            accounts = await ethers.getSigners()
            player = accounts[1]
            // 部署环境
            await deployments.fixture("all")
            // 获取合约信息

            vrfCoordinatorV2Mock = (await ethers.getContract("VRFCoordinatorV2Mock")).connect(player)
            raffleContract = (await ethers.getContract("Raffle"))
            raffle = raffleContract.connect(player)
            interval = await raffle.getInterval()
            raffleEnterFee = await raffle.getEntranceFee()
        })

        describe("constructor", () => {
            it("initializes the raffle correctly", async () => {
                const raffleState = (await raffle.getRaffleState()).toString()

                assert.equal(raffleState, "0")
                assert.equal(interval.toString(), networkConfig[network.config.chainId]["keepersUpdateInterval"])
            })
        })

        describe("enterRaffle", () => {
            it("reverts when you don't pay enough", async () => {
                await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__SendMoreEnterRaffle")
            })

            it("参与者是否被正常记录", async () => {
                await raffle.enterRaffle({ value: raffleEnterFee })
                const contractPlayer = await raffle.getPlayer(0)
                assert.equal(contractPlayer, player.address);
            })

            it("emits event on enter", async () => {
                await expect(raffle.enterRaffle({ value: raffleEnterFee })).to.emit( // emits RaffleEnter event if entered to index player(s) address
                    raffle,
                    "RaffleEnter"
                )
            })

            it("doesn't allow entrance when raffle is calculating", async () => {
                await raffle.enterRaffle({ value: raffleEnterFee })
                // 在本地区块链上可以直接加快时间
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                // 等待区块
                await network.provider.send("evm_mine", [])
                // 这两个事件的作用可以在 https://hardhat.org/hardhat-network/docs/reference#special-testing/debugging-methods 中看到(或者看看 Ganache)
                // 模拟 chainlink keeper 触发 选中中奖者行为(将 raffleState.open => raffleState.calculating)
                await raffle.performUpkeep([])

                // 再次模拟用户进入
                await expect(raffle.enterRaffle({ value: raffleEnterFee })).to.be.revertedWith("Raffle__RaffleNotOpen")
            })
        })

        describe("checkUpKeep", function () {
            it("returns false if people haven't sent any ETH", async () => {
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upKeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                assert(!upKeepNeeded)
            })

            it("returns false if raffle isn't open", async () => {
                await raffle.enterRaffle({ value: raffleEnterFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                await raffle.performUpkeep([])

                const { upKeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
                assert(!upKeepNeeded)
            })

            it("updates the raffle state and emits a requestId", async () => {
                await raffle.enterRaffle({ value: raffleEnterFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                const txResponse = await raffle.performUpkeep([])
                const txReceipt = await txResponse.wait(1)
                const raffleState = await raffle.getRaffleState()
                const requestId = txReceipt.events[1].args.requestId

                assert(requestId.toNumber() > 0)
                assert(raffleState == 1)
            })
        })

        describe("fulfillRandomWords", function () {
            beforeEach(async () => {
                await raffle.enterRaffle({ value: raffleEnterFee })
                await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await ethers.provider.send("evm_mine", [])
            })

            it("can only be called after performUpkeep", async () => {
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request")
            })

            it("picks a winner, resets, and sends money", async () => {
                let startingBalance
                for (let i = 2; i < 5; i++) {
                    raffle = raffleContract.connect(accounts[i]);
                    raffle.enterRaffle({ value: raffleEnterFee })
                }

                const startingTimestamp = await raffle.getLastTimeStamp();
                // 需要创建一个 promise 用来等待监听器(中奖者产生)触发
                return new Promise(async (resolve, reject) => {
                    // 监听 WinnerPicked event
                    raffle.once("WinnerPicked", async () => {
                        console.log("WinnerPicked event fired!")
                        try {
                            const recentWinner = await raffle.getWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerBalance = await accounts[2].getBalance()
                            const endingTimestamp = await raffle.getLastTimeStamp()

                            await expect(raffle.getPlayer(0)).to.be.reverted
                            assert.equal(recentWinner.toString(), accounts[2].address)
                            assert.equal(raffleState, 0)
                            assert.equal(winnerBalance.toString(), startingBalance.add(raffleEnterFee.mul(4)).toString())
                            assert(endingTimestamp > startingTimestamp)
                            resolve()
                        } catch (e) {
                            reject(e)
                        }
                    })

                    // 发送抽奖请求
                    try {
                        const tx = await raffle.performUpkeep("0x")
                        const txReceipt = await tx.wait(1)
                        startingBalance = await accounts[2].getBalance()
                        await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId, raffle.address)
                    } catch (e) {
                        reject(e)
                    }
                })
            })
        })


    })