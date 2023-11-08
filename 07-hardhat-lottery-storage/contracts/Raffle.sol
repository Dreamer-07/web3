// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

error Raffle__SendMoreEnterRaffle();
error Raffle__TransferFailed();
error Raffle__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 playersCount,
    uint256 raffleState
);
error Raffle__RaffleNotOpen();

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    // 通过 enum 我们可以定义枚举
    enum RaffleState {
        // 开启
        OPEN,
        // 真正计算中奖人信息
        CALCULATING
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    // CHAIN LINK VAR
    bytes32 private immutable i_gasLine;
    uint64 private immutable i_subId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint16 private constant NUM_WORDS = 1;

    // contract var
    uint256 private immutable i_enteranceFee;
    uint256 private immutable i_interval;
    address payable[] private s_players;
    address payable private s_recentWinner;
    uint256 private s_lastTimeStamp;
    RaffleState private s_raffleState;

    // Events
    /**
     * 用来事件来主动的通知外部有新的参与者参与了合同
     * @param player 参与者
     */
    event RaffleEnter(address indexed player);
    event WinnerPicked(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);

    constructor(
        bytes32 gasLine,
        uint256 enteranceFee,
        uint64 subId,
        address vrfCoordinatorV2,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_enteranceFee = enteranceFee;
        i_gasLine = gasLine;
        i_subId = subId;
        i_callbackGasLimit = callbackGasLimit;
        i_interval = interval;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
    }

    /**
     * @dev chainlink keeper 用来检查是否要触发定时任务的条件函数
     */
    function checkUpkeep(
        bytes memory /**checkData */
    )
        public 
        view
        override
        returns (bool unkeepNeeded, bytes memory /**performData */)
    {
        unkeepNeeded = s_raffleState == RaffleState.OPEN && // isOpen?
            // 有间隔的去执行
            (block.timestamp - s_lastTimeStamp) > i_interval &&
            // enter playes count > 0
            s_players.length > 0 &&
            // this contract balance > 0
            address(this).balance > 0;
        return (unkeepNeeded, "0x0");
    }

    /**
     * @dev chainlink keeper 触发的任务函数
     */
    function performUpkeep(bytes calldata /**performData */) external override {
        // 先检查一遍，避免不是 chainlink keeper 调用的
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        // 修改抽奖的状态
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLine,
            i_subId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    /**
     * 用户参与抽奖
     */
    function enterRaffle() public payable {
        if (msg.value < i_enteranceFee) {
            revert Raffle__SendMoreEnterRaffle();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__RaffleNotOpen();
        }

        s_players.push(payable(msg.sender));

        // 触发事件用来表示已经有新的参与者
        emit RaffleEnter(payable(msg.sender));
    }

    /**
     * chainlink 通过该函数发送随机数
     * 而在本合同内，我们通过该函数获取 chainlink 发送的随机数
     */
    function fulfillRandomWords(
        uint256 /**requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];

        s_recentWinner = recentWinner;
        // clear address payable[]
        s_players = new address payable[](0);
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        // 将合约中的钱转给中奖的用户
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }

        // emit event
        emit WinnerPicked(recentWinner);
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getNumWords() public pure returns (uint16) {
        return NUM_WORDS;
    }

    function getReqConfirmactions() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_enteranceFee;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
