import { abi, contractAddress } from "./constant.js"

import { ethers } from "./ethers.min.js"

const connectButton = document.getElementById("connectButton")
const withdrawButton = document.getElementById("withdrawButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")

connectButton.onclick = async function () {
    if (typeof window.ethereum !== "undefined") {
        try {
            // 链接账户
            await ethereum.request({
                // 这些方法都可以再 ethers 的文档上找到
                method: "eth_requestAccounts"
            })
        } catch (error) {
            console.log(error)
        }
        connectButton.innerHTML = "Connected"
        // 看一下链接的账户地址
        const accounts = await ethereum.request({ method: "eth_accounts" })
        console.log(accounts);
    } else {
        connectButton.innerHTML = "Please Install MetaMask"
    }
}

balanceButton.onclick = async function () {
    if (typeof window.ethereum !== "undefined") {
        // 获取节点网络
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            const balance = await provider.getBalance(contractAddress)
            console.log(ethers.utils.formatEther(balance));

            const signer = provider.getSigner()
            const contract = new ethers.Contract(contractAddress, abi, signer)
            const owner = await contract.getOwner();
            console.log(`owner: ${owner}`)
        } catch (error) {
            console.log(error)
        }
    } else {
        balanceButton.innerHTML = "Please Install MetaMask"
    }
}

fundButton.onclick = async function () {
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount}...`);
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        // 获取账户
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer)

        // 调用 fund 函数
        try {
            const transactionResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount)
            })
            // 监听交易
            await listenFotTransactionMine(transactionResponse, provider)
        } catch (error) {
            console.log(error)
        }
    } else {
        fundButton.innerHTML = "Please install MetaMask"
    }
}

withdrawButton.onclick = async function () {
    console.log('Withdrawing....');
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send(`eth_requestAccounts`, [])
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)

        try {
            const transactionResponse = await contract.withdraw();
            
            await listenFotTransactionMine(transactionResponse, provider);
        } catch (error) {
            console.log(error)
        }
    } else {
        withdrawButton.innerHTML = "Please install MetaMask"
    }
}

function listenFotTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}`);

    return new Promise((resolve, reject) => {
        try {
            provider.once(transactionResponse.hash, (transactionReceipt) => {
                console.log(`Completed with ${transactionReceipt.confirmations} confirmations`);
                resolve()
            })
        } catch (error) {
            reject(error)
        }
    })
}