// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract FlickRegistry {
    error InvalidNickname();
    error NicknameTaken();
    error CreatorAlreadyClaimed();
    error CreatorNotFound();
    error EmptyAmount();
    error TransferFailed();

    IERC20 public immutable usdc;
    IERC20 public immutable eurc;

    mapping(string nickname => address creator) public creatorOf;
    mapping(address creator => string nickname) public nicknameOf;
    mapping(address creator => uint256 amount) public totalUsdcTipsReceived;
    mapping(address creator => uint256 amount) public totalEurcTipsReceived;

    event CreatorClaimed(address indexed creator, string nickname, uint256 timestamp);
    event UsdcTipSent(
        address indexed creator,
        address indexed sender,
        string nickname,
        uint256 amount,
        string senderName,
        string message,
        uint256 timestamp
    );
    event EurcTipSent(
        address indexed creator,
        address indexed sender,
        string nickname,
        uint256 amount,
        string senderName,
        string message,
        uint256 timestamp
    );

    constructor(address usdc_, address eurc_) {
        usdc = IERC20(usdc_);
        eurc = IERC20(eurc_);
    }

    function claimNickname(string calldata nickname) external {
        _validateNickname(nickname);

        if (bytes(nicknameOf[msg.sender]).length != 0) revert CreatorAlreadyClaimed();
        if (creatorOf[nickname] != address(0)) revert NicknameTaken();

        creatorOf[nickname] = msg.sender;
        nicknameOf[msg.sender] = nickname;

        emit CreatorClaimed(msg.sender, nickname, block.timestamp);
    }

    function tipUSDC(
        string calldata nickname,
        uint256 amount,
        string calldata senderName,
        string calldata message
    ) external {
        address creator = _creatorFor(nickname);
        _collect(usdc, creator, amount);
        totalUsdcTipsReceived[creator] += amount;

        emit UsdcTipSent(creator, msg.sender, nickname, amount, senderName, message, block.timestamp);
    }

    function tipEURC(
        string calldata nickname,
        uint256 amount,
        string calldata senderName,
        string calldata message
    ) external {
        address creator = _creatorFor(nickname);
        _collect(eurc, creator, amount);
        totalEurcTipsReceived[creator] += amount;

        emit EurcTipSent(creator, msg.sender, nickname, amount, senderName, message, block.timestamp);
    }

    function _creatorFor(string calldata nickname) private view returns (address creator) {
        creator = creatorOf[nickname];
        if (creator == address(0)) revert CreatorNotFound();
    }

    function _collect(IERC20 token, address creator, uint256 amount) private {
        if (amount == 0) revert EmptyAmount();
        bool ok = token.transferFrom(msg.sender, creator, amount);
        if (!ok) revert TransferFailed();
    }

    function _validateNickname(string calldata nickname) private pure {
        bytes calldata raw = bytes(nickname);
        if (raw.length < 3 || raw.length > 20) revert InvalidNickname();

        for (uint256 i = 0; i < raw.length; i++) {
            bytes1 char = raw[i];
            bool isLower = char >= 0x61 && char <= 0x7a;
            bool isNumber = char >= 0x30 && char <= 0x39;
            bool isUnderscore = char == 0x5f;
            if (!isLower && !isNumber && !isUnderscore) revert InvalidNickname();
        }
    }
}
