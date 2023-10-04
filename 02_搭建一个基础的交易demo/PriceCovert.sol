// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// 从 github 上引入接口文件(remix 会自动识别，如果是本地需要用 npm 安装)
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/*
定义一个库(不能声明静态变量，也不能发送 ETH)
库中的所有方法都需要添加 internal 关键字
*/
library PriceCovert {
    
    // 从 chainlink 上获取 ETH / USD 的价格
    function getPrice() internal view returns(uint256) {
        // 获取 chainlink 测试网上的合约
        // https://docs.chain.link/data-feeds/price-feeds/addresses#Sepolia%20Testnet
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );

        // 获取最新的数据
        (, int256 answer, , ,) = priceFeed.latestRoundData();

        // 返回的是一个 1eth 对应的 usd(solidity 中不存在浮点数)
        return uint256(answer * 1e10);
    }

    // 将输入的 wei 转换成成等价的美刀价格
    function getConversionRate(uint256 ethAmount) internal view returns(uint256){
        // 获取当前 1eth 所能获得的美刀
        uint256 usdPrice = getPrice();
        // 将输入的 eth 换算成等价的 usd
        return (usdPrice * ethAmount) / 1e18;
    }

}