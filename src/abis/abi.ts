    // Factory contract ABI
    export const ABI = [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint24",
                    "name": "fee",
                    "type": "uint24"
                },
                {
                    "indexed": true,
                    "internalType": "int24",
                    "name": "tickSpacing",
                    "type": "int24"
                }
            ],
            "name": "FeeAmountEnabled",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "token0",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "token1",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "uint24",
                    "name": "fee",
                    "type": "uint24"
                },
                {
                    "indexed": false,
                    "internalType": "int24",
                    "name": "tickSpacing",
                    "type": "int24"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "pool",
                    "type": "address"
                }
            ],
            "name": "PoolCreated",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "collectRent",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "tokenA",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "tokenB",
                    "type": "address"
                },
                {
                    "internalType": "uint24",
                    "name": "fee",
                    "type": "uint24"
                }
            ],
            "name": "createPool",
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
                    "internalType": "uint24",
                    "name": "fee",
                    "type": "uint24"
                },
                {
                    "internalType": "int24",
                    "name": "tickSpacing",
                    "type": "int24"
                }
            ],
            "name": "enableFeeAmount",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint24",
                    "name": "fee",
                    "type": "uint24"
                }
            ],
            "name": "feeAmountTickSpacing",
            "outputs": [
                {
                    "internalType": "int24",
                    "name": "",
                    "type": "int24"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "tokenA",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "tokenB",
                    "type": "address"
                },
                {
                    "internalType": "uint24",
                    "name": "fee",
                    "type": "uint24"
                }
            ],
            "name": "getPool",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "pool",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "mintFee",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
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
            "name": "poolCreateFee",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "rentPayer",
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
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_mintFee",
                    "type": "uint256"
                }
            ],
            "name": "setMintFee",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "setOwner",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_poolCreateFee",
                    "type": "uint256"
                }
            ],
            "name": "setPoolCreateFee",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_rentPayer",
                    "type": "address"
                }
            ],
            "name": "setRentPayer",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];



    