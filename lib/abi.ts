export const flickRegistryAbi = [
  { type: "error", name: "InvalidNickname", inputs: [] },
  { type: "error", name: "ReservedNickname", inputs: [] },
  { type: "error", name: "NicknameTaken", inputs: [] },
  { type: "error", name: "CreatorAlreadyClaimed", inputs: [] },
  { type: "error", name: "CreatorNotFound", inputs: [] },
  { type: "error", name: "EmptyAmount", inputs: [] },
  { type: "error", name: "SenderNameTooLong", inputs: [] },
  { type: "error", name: "MessageTooLong", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  {
    type: "function",
    name: "claimNickname",
    stateMutability: "nonpayable",
    inputs: [{ name: "nickname", type: "string" }],
    outputs: []
  },
  {
    type: "function",
    name: "tipUSDC",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nickname", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "senderName", type: "string" },
      { name: "message", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "tipEURC",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nickname", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "senderName", type: "string" },
      { name: "message", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "creatorOf",
    stateMutability: "view",
    inputs: [{ name: "nickname", type: "string" }],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "nicknameOf",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    type: "function",
    name: "totalUsdcTipsReceived",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "totalEurcTipsReceived",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "CreatorClaimed",
    inputs: [
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "nickname", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "UsdcTipSent",
    inputs: [
      { indexed: true, name: "creator", type: "address" },
      { indexed: true, name: "sender", type: "address" },
      { indexed: false, name: "nickname", type: "string" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "senderName", type: "string" },
      { indexed: false, name: "message", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "EurcTipSent",
    inputs: [
      { indexed: true, name: "creator", type: "address" },
      { indexed: true, name: "sender", type: "address" },
      { indexed: false, name: "nickname", type: "string" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "senderName", type: "string" },
      { indexed: false, name: "message", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" }
    ]
  }
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;
