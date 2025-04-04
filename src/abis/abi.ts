    // Factory contract ABI
    export const ABI = [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_factory",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_WHBAR",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "int256",
            "name": "respCode",
            "type": "int256"
          }
        ],
        "name": "AssociateFail",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenSN",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "int256",
            "name": "respCode",
            "type": "int256"
          }
        ],
        "name": "CF",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "int256",
            "name": "respCode",
            "type": "int256"
          }
        ],
        "name": "HederaFail",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "int32",
            "name": "respCode",
            "type": "int32"
          }
        ],
        "name": "RespCode",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenSN",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "Burn",
        "type": "event"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "tokenSN",
                "type": "uint256"
              },
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint128",
                "name": "amount0Max",
                "type": "uint128"
              },
              {
                "internalType": "uint128",
                "name": "amount1Max",
                "type": "uint128"
              }
            ],
            "internalType": "struct INonfungiblePositionManager.CollectParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "collect",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenSN",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "Collect",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token0",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token1",
            "type": "address"
          },
          {
            "internalType": "uint24",
            "name": "fee",
            "type": "uint24"
          },
          {
            "internalType": "uint160",
            "name": "sqrtPriceX96",
            "type": "uint160"
          }
        ],
        "name": "createAndInitializePoolIfNecessary",
        "outputs": [
          {
            "internalType": "address",
            "name": "pool",
            "type": "address"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_rentPayer",
            "type": "address"
          },
          {
            "internalType": "int64",
            "name": "_autoRenewPeriod",
            "type": "int64"
          }
        ],
        "name": "createNonFungible",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "tokenSN",
                "type": "uint256"
              },
              {
                "internalType": "uint128",
                "name": "liquidity",
                "type": "uint128"
              },
              {
                "internalType": "uint256",
                "name": "amount0Min",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount1Min",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
              }
            ],
            "internalType": "struct INonfungiblePositionManager.DecreaseLiquidityParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "decreaseLiquidity",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenSN",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint128",
            "name": "liquidity",
            "type": "uint128"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "DecreaseLiquidity",
        "type": "event"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "tokenSN",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount0Desired",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount1Desired",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount0Min",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount1Min",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
              }
            ],
            "internalType": "struct INonfungiblePositionManager.IncreaseLiquidityParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "increaseLiquidity",
        "outputs": [
          {
            "internalType": "uint128",
            "name": "liquidity",
            "type": "uint128"
          },
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenSN",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint128",
            "name": "liquidity",
            "type": "uint128"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "name": "IncreaseLiquidity",
        "type": "event"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "token0",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "token1",
                "type": "address"
              },
              {
                "internalType": "uint24",
                "name": "fee",
                "type": "uint24"
              },
              {
                "internalType": "int24",
                "name": "tickLower",
                "type": "int24"
              },
              {
                "internalType": "int24",
                "name": "tickUpper",
                "type": "int24"
              },
              {
                "internalType": "uint256",
                "name": "amount0Desired",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount1Desired",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount0Min",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amount1Min",
                "type": "uint256"
              },
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
              }
            ],
            "internalType": "struct INonfungiblePositionManager.MintParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "tokenSN",
            "type": "uint256"
          },
          {
            "internalType": "uint128",
            "name": "liquidity",
            "type": "uint128"
          },
          {
            "internalType": "uint256",
            "name": "amount0",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes[]",
            "name": "data",
            "type": "bytes[]"
          }
        ],
        "name": "multicall",
        "outputs": [
          {
            "internalType": "bytes[]",
            "name": "results",
            "type": "bytes[]"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "refundETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amountMinimum",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          }
        ],
        "name": "sweepToken",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount0Owed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1Owed",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "uniswapV3MintCallback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amountMinimum",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          }
        ],
        "name": "unwrapWHBAR",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "stateMutability": "payable",
        "type": "receive"
      },
      {
        "inputs": [],
        "name": "baseUrl",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "deployer",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "factory",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nft",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "onlyOnce",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenSN",
            "type": "uint256"
          }
        ],
        "name": "positions",
        "outputs": [
          {
            "internalType": "address",
            "name": "token0",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token1",
            "type": "address"
          },
          {
            "internalType": "uint24",
            "name": "fee",
            "type": "uint24"
          },
          {
            "internalType": "int24",
            "name": "tickLower",
            "type": "int24"
          },
          {
            "internalType": "int24",
            "name": "tickUpper",
            "type": "int24"
          },
          {
            "internalType": "uint128",
            "name": "liquidity",
            "type": "uint128"
          },
          {
            "internalType": "uint256",
            "name": "feeGrowthInside0LastX128",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "feeGrowthInside1LastX128",
            "type": "uint256"
          },
          {
            "internalType": "uint128",
            "name": "tokensOwed0",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "tokensOwed1",
            "type": "uint128"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "whbar",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "WHBAR",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];