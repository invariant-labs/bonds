export type Bonds = {
  "version": "0.1.0",
  "name": "bonds",
  "instructions": [
    {
      "name": "initBondSale",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBuy",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenSell",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSaleBuy",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSaleSell",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerBuyAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerSellAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "floorPrice",
          "type": "u128"
        },
        {
          "name": "upBound",
          "type": "u128"
        },
        {
          "name": "velocity",
          "type": "u128"
        },
        {
          "name": "buyAmount",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createBond",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bond",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBuy",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenSell",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondBuy",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSell",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSaleBuy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bondSaleSell",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "buyAmount",
          "type": "u64"
        },
        {
          "name": "sellAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bond",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bondSale",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "currentPrice",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "previousPrice",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "buyAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "lastTrade",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bondSale",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenBuy",
            "type": "publicKey"
          },
          {
            "name": "tokenSell",
            "type": "publicKey"
          },
          {
            "name": "tokenBuyAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenSellAccount",
            "type": "publicKey"
          },
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "floorPrice",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "upBound",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "velocity",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "buyAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "remainingAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "sellAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "saleTime",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Decimal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPoolTokenAddresses",
      "msg": "Invalid pool token addresses"
    },
    {
      "code": 6001,
      "name": "InsufficientTokenAmount",
      "msg": "Buy amount exceeds remaining amount"
    }
  ]
};

export const IDL: Bonds = {
  "version": "0.1.0",
  "name": "bonds",
  "instructions": [
    {
      "name": "initBondSale",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBuy",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenSell",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSaleBuy",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSaleSell",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerBuyAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerSellAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "floorPrice",
          "type": "u128"
        },
        {
          "name": "upBound",
          "type": "u128"
        },
        {
          "name": "velocity",
          "type": "u128"
        },
        {
          "name": "buyAmount",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createBond",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bond",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBuy",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenSell",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondBuy",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSell",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bondSaleBuy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bondSaleSell",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "buyAmount",
          "type": "u64"
        },
        {
          "name": "sellAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bond",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bondSale",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "currentPrice",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "previousPrice",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "buyAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "lastTrade",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bondSale",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenBuy",
            "type": "publicKey"
          },
          {
            "name": "tokenSell",
            "type": "publicKey"
          },
          {
            "name": "tokenBuyAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenSellAccount",
            "type": "publicKey"
          },
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "floorPrice",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "upBound",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "velocity",
            "type": {
              "defined": "Decimal"
            }
          },
          {
            "name": "buyAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "remainingAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "sellAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "saleTime",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Decimal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPoolTokenAddresses",
      "msg": "Invalid pool token addresses"
    },
    {
      "code": 6001,
      "name": "InsufficientTokenAmount",
      "msg": "Buy amount exceeds remaining amount"
    }
  ]
};
