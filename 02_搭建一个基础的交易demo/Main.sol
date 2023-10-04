// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// 引入库
import "./PriceCovert.sol";

// 通过在外部定义 error, 而不是在合约内存储和使用字符串作为错误信息(优化 gas)
error ErrorTest();

contract FundMe {
    // 通过 using 关键字可以将指定的库符合到指定类型A(符合后当前合约内的该类型A可以直接调用库中的方法，库中的函数将会默认接收调用函数对象的实例作为第一个参数)
    using PriceCovert for uint256;
    // 用来记录捐赠用户的地址和金额
    mapping(address => uint256) public addressToAmountFunded;
    // 用来记录捐赠用户的地址
    address[] public funders;

    // 用来记录合同的所有者(用于提取捐赠金额)
    // 通过 immutable 关键字表示该变量将在 constructor 中初始化后不可变(优化gas)
    address public immutable i_owner;
    // 通过 constant 表示该变量是常量(优化 gas)
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

    constructor() {
        i_owner = msg.sender;
    }

    // payable：该函数需要发送一些 eth
    function fund() public payable {
        // require：断言，需要保证第一个参数为 true，才会执行后续的操作，否则终止操作并提示第二个参数的字符串
        // 注意：如果在 require 终止之前进行了一些操作，仍然要支付 gas
        // 同时，之前的操作都会回滚(类似于事务)
        require(
            msg.value.getConversionRate() >= MINIMUM_USD,
            "Didn't send enough!"
        );
        // 如果触发了 require 的终止(revert), 后续的操作由于没有执行是不需要的

        // 记录捐赠者的信息
        addressToAmountFunded[msg.sender] = msg.value;
        funders.push(msg.sender);
    }

    // 通过 modifier 关键字可以定义修饰器，用于在指定方法之前执行(比如进行一些权限检查)
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert ErrorTest();
        _;
    }

    // 提款的方法
    function withdraw() public onlyOwner {
        // 清空捐赠者的信息
        for (uint256 funderIdx = 0; funderIdx < funders.length; funderIdx++) {
            address funder = funders[funderIdx];
            addressToAmountFunded[funder] = 0;
        }
        funders = new address[](0);

        // 将合同的资产发送到调用者身上
        /*
        调用需要使用到 payable address 类型，该类型可以通过 payable(msg.sender) 方法得到，同时提供三种提取方法
            1. transfer：运行错误会直接报错回滚
            2. send：运行错误是返回布尔值
            3. call：和 2 一样, 但类似于底层函数，推荐使用(具体原因进阶篇会说 - 关于 gas)
        */
        (bool callStatus, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callStatus, "Call Failed");
    }

    // 定义两个兜底函数(当用户直接调用合约而不是其中的函数时)
    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //             msg.data 是否为空?
    //                   /     \
    //                 yes     no
    //                 /         \
    //    是否定义了 receive()?  fallback()
    //     /   \
    //   yes   no
    //  /        \
    //receive()  fallback()

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }
}
