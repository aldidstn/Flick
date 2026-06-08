// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract FlickRegistry {
    uint256 public constant MAX_NICKNAME_LENGTH = 32;
    uint256 public constant MAX_SENDER_NAME_LENGTH = 32;
    uint256 public constant MAX_MESSAGE_LENGTH = 140;

    error InvalidNickname();
    error ReservedNickname();
    error NicknameTaken();
    error CreatorAlreadyClaimed();
    error CreatorNotFound();
    error EmptyAmount();
    error SenderNameTooLong();
    error MessageTooLong();
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
        _validateTipMetadata(senderName, message);
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
        _validateTipMetadata(senderName, message);
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
        if (raw.length < 3 || raw.length > MAX_NICKNAME_LENGTH) revert InvalidNickname();

        for (uint256 i = 0; i < raw.length; i++) {
            bytes1 char = raw[i];
            bool isLower = char >= 0x61 && char <= 0x7a;
            bool isNumber = char >= 0x30 && char <= 0x39;
            bool isUnderscore = char == 0x5f;
            if (!isLower && !isNumber && !isUnderscore) revert InvalidNickname();
        }

        if (_isReservedNickname(nickname)) revert ReservedNickname();
    }

    function _validateTipMetadata(string calldata senderName, string calldata message) private pure {
        if (bytes(senderName).length > MAX_SENDER_NAME_LENGTH) revert SenderNameTooLong();
        if (bytes(message).length > MAX_MESSAGE_LENGTH) revert MessageTooLong();
    }

    function _isReservedNickname(string calldata nickname) private pure returns (bool) {
        bytes32 value = keccak256(bytes(nickname));
        return value == keccak256("claim")
            || value == keccak256("dashboard")
            || value == keccak256("api")
            || value == keccak256("settings")
            || value == keccak256("admin")
            || value == keccak256("creators")
            || value == keccak256("flickdemo")
            || value == keccak256("demo")
            || value == keccak256("admindemo")
            || value == keccak256("loading");
    }
}
