// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// 引入库
import "./PriceCovert.sol";

// 通过 "合约名__错误信息的格式来定义错误信息"
error FundMe__SendEnough();
error FundMe__OnlyOwner();
error FundMe__CallFailed();

contract FundMe {
    // 通过 using 关键字可以将指定的库符合到指定类型A(符合后当前合约内的该类型A可以直接调用库中的方法，库中的函数将会默认接收调用函数对象的实例作为第一个参数)
    using PriceCovert for uint256;

    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

    address private immutable i_owner;
    // 存储在 storage 中的变量使用 s_ 开头
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed;

    // 通过 modifier 关键字可以定义修饰器，用于在指定方法之前执行(比如进行一些权限检查)
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert FundMe__OnlyOwner();
        _;
    }

    // Functions Order: 函数在文件中的编写顺序
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

    // payable：该函数需要发送一些 eth
    function fund() public payable {
        // require：断言，需要保证第一个参数为 true，才会执行后续的操作，否则终止操作并提示第二个参数的字符串
        // 注意：如果在 require 终止之前进行了一些操作，仍然要支付 gas
        // 同时，之前的操作都会回滚(类似于事务)
        if (msg.value.getConversionRate(s_priceFeed) <= MINIMUM_USD) {
            revert FundMe__SendEnough();
        }
        // 记录捐赠者的信息
        s_addressToAmountFunded[msg.sender] = msg.value;
        s_funders.push(msg.sender);
    }

    // 提款的方法
    function withdraw() public onlyOwner {
        // 由于直接操作 storage 中的数据会非常消耗 gas，所以采用读取一次，操作后复写一次的方式
        address[] memory funders = s_funders;
        for (uint256 funderIdx = 0; funderIdx < funders.length; funderIdx++) {
            address funder = funders[funderIdx];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        // 将合同的资产发送到调用者身上
        /*
        调用需要使用到 payable address 类型，该类型可以通过 payable(msg.sender) 方法得到，同时提供三种提取方法
            1. transfer：运行错误会直接报错回滚
            2. send：运行错误是返回布尔值
            3. call：和 2 一样, 但类似于底层函数，推荐使用(具体原因进阶篇会说 - 关于 gas)
        */
        (bool callStatus, ) = i_owner.call{value: address(this).balance}("");

        if (!callStatus) {
            revert FundMe__CallFailed();
        }
    }

    function getAddressToAmountFunded(
        address fundingAddress
    ) public view returns (uint256) {
        return s_addressToAmountFunded[fundingAddress];
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
