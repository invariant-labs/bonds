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
          "name": "tokenBond",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenQuote",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBondAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenQuoteAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerBondAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerQuoteAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
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
          "name": "bondAmount",
          "type": "u64"
        },
        {
          "name": "duration",
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
          "name": "tokenBond",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenQuote",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ownerQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bondSaleBondAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bondSaleQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
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
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "byAmountIn",
          "type": "bool"
        },
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "endBondSale",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenQuote",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "changeVelocity",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "velocity",
          "type": "u128"
        }
      ]
    },
    {
      "name": "changeUpBound",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "upBound",
          "type": "u128"
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
            "name": "bondAccount",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "buyAmount",
            "type": {
              "defined": "TokenAmount"
            }
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
            "name": "tokenBond",
            "type": "publicKey"
          },
          {
            "name": "tokenQuote",
            "type": "publicKey"
          },
          {
            "name": "tokenBondAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenQuoteAccount",
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
            "name": "previousPrice",
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
            "name": "bondAmount",
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
            "name": "quoteAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "saleTime",
            "type": "u64"
          },
          {
            "name": "lastTrade",
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
    },
    {
      "name": "TokenAmount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u64"
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
          "name": "tokenBond",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenQuote",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBondAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenQuoteAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payerBondAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerQuoteAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
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
          "name": "bondAmount",
          "type": "u64"
        },
        {
          "name": "duration",
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
          "name": "tokenBond",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenQuote",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ownerQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bondSaleBondAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bondSaleQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
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
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "byAmountIn",
          "type": "bool"
        },
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "endBondSale",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenQuote",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerQuoteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "changeVelocity",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "velocity",
          "type": "u128"
        }
      ]
    },
    {
      "name": "changeUpBound",
      "accounts": [
        {
          "name": "bondSale",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "upBound",
          "type": "u128"
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
            "name": "bondAccount",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "buyAmount",
            "type": {
              "defined": "TokenAmount"
            }
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
            "name": "tokenBond",
            "type": "publicKey"
          },
          {
            "name": "tokenQuote",
            "type": "publicKey"
          },
          {
            "name": "tokenBondAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenQuoteAccount",
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
            "name": "previousPrice",
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
            "name": "bondAmount",
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
            "name": "quoteAmount",
            "type": {
              "defined": "TokenAmount"
            }
          },
          {
            "name": "saleTime",
            "type": "u64"
          },
          {
            "name": "lastTrade",
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
    },
    {
      "name": "TokenAmount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u64"
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
