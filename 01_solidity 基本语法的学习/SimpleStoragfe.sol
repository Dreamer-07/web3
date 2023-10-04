// SPDX-License-Identifier: MIT
// 可以在第一行声明 SPDX-License-Identifier 以表示要使用的 License 协议
pragma solidity 0.8.7;
// 定义版本号
/*
什么都不加表示指定版本
以^开头表示大于等于该版本就可以
可以使用 >=x <y 限制使用的版本
*/

// 在 sol 中通过 contract 可以声明智能合约，类似于 java 中的 class 可以声明类
contract SimpleStorage {
    // 定义变量，在sol中变量具有默认值，而不是null
    // 布尔值
    bool hasFavoriteNumber = true;
    // 定义数值，带u表示无符号，后面跟的数字表示使用的bit位，默认是256，最高也是256，最低是8bit(1byte)
    uint32 favoriteNumber = 8;
    int32 favoriteInt = -8;
    // 定义地址
    address myAddress = 0x249693860C4Ddd743286d43B1EBB75228FC2d4b7;
    // 定义字符串
    string favoriteNumberInText = "Eight";
    // bytes 也可以定义字符串，后面的数字表示使用的 byte 数，默认是32，最高也是32，最低是1byte
    // string 可以自动转换成 bytes
    bytes32 favoriteBytes = "cat";

    // 默认情况下变量的权限是 internal(本合约和继承合约才可以看见)，可以通过声明 public 来自动生成该变量的 get 方法
    uint256 public number;

    // 定义一个函数(后面跟上权限修饰符)
    // 每当我们定义的操作越多，在调用时就需要支付更多的 gas
    function store(uint256 _number) public {
        number = _number;
        viewTest();
    }

    /*
    通过声明 view / pure 函数可以在调用时不消耗 gas, 但都有额外的限制条件
        - view：只能使用合约的值，但不能修改合约的值
        - pure：不能使用合约的值，也不能修改合约的值
    !! 但如果是在消耗 gas 的函数中调用 view/pure 的值，就需要消耗额外的 gas
    */
    function viewTest() public view returns(uint256) {
        return number;
    }

    function pureTest() public pure returns(uint256) {
        return 1 + 1;
    }

    // 定义一个结构体
    struct People {
        string name;
        uint32 age;
    }

    // 定义一个数组, 如果在 [] 内指定数组长度就会固定数组长度，如果不指定就是动态数组
    People[] public peoples;

    // 定义一个方法用来像数组中添加对象
    /*
    * 当我们在定义方法参数中使用到了 string / struct / array / mapping 类型时
    * 需要额外声明 calldata(不可以修改的临时变量) / memory(可以修改的临时变量) 
    */
    function addPeople(string memory _name, uint32 _age) public  {
        // 创建对象的方式一：通过属性索引下标直接创建，People(_name, _age) -> name 下标是0，age 下标是1
        peoples.push(People(_name, _age));
        // 创建对象的方式二：通过指定属性
        // peoples.push(People({
        //     name: _name,
        //     age: _age
        // }));
        // 像 mapping 中添加映射属性
        nameToFavoriteNumber[_name] = _age;
    }

    // 构建一个 mapping(hash表)
    mapping(string => uint256) public nameToFavoriteNumber;
}