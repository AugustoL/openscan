<p align="center">
  <img src="https://augustol.github.io/openscan/openscan-logo.png" alt="OpenScan Logo" width="128" height="128">
</p>

# OpenScan

![Production IPFS Hash](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/AugustoL/e3a56e2c5255a748f6334af4c9c58bfc/raw/ipfs-hash.json)

A trustless, open-source, standalone web-app, multi-chain blockchain explorer for Ethereum, Layer 2 networks, and local development chains, allowing the direct interaction with verified smart contracts.

**Official URL:** [https://openscan.eth.link/](https://openscan.eth.link/)  
**GitHub Pages:** [https://augustol.github.io/openscan/](https://augustol.github.io/openscan/)

## Features

### 🌐 Multi-Chain Support

- **Ethereum Mainnet** - The main Ethereum network
- **Sepolia Testnet** - Ethereum test network for development
- **Arbitrum One** - Ethereum Layer 2 scaling solution
- **Optimism** - Ethereum Layer 2 with low fees
- **Base** - Coinbase's Layer 2 network
- **BSC (BNB Chain)** - Binance Smart Chain mainnet
- **BSC Testnet** - Binance Smart Chain testnet
- **Polygon POS** - Polygon proof-of-stake mainnet
- **Localhost** - Local development networks (Hardhat/Anvil)

### 🔍 Core Functionality

- **Block Explorer** - View detailed block information including transactions, gas usage, and timestamps
- **Transaction Details** - Inspect transaction data, receipts, logs, and execution details
- **Address Lookup** - Check balance, transaction history, and contract code
- **Contract Interaction** - Read from and write to verified smart contracts with an interactive interface
- **Network Statistics** - Track chain metrics, gas prices, and block times
- **Read/Write Operations** - Execute smart contract calls on verified smart contracts.

### 🎨 User Experience

- **Modern UI** - Clean, card-based design with smooth animations
- **Dark Mode** - Toggle between light and dark themes
- **Responsive** - Mobile-friendly interface
- **Network Cards** - Visual network selection with logos and descriptions
- **Real-time Updates** - Live data from RPC endpoints

### 🛠️ Developer Tools

- **Hex Encoder/Decoder** - Convert between hex and text formats
- **Unit Converter** - Convert between Wei, Gwei, and ETH
- **Custom RPC Support** - Configure custom RPC endpoints for each network
- **HH3 Ignition Support** – Import, inspect, and interact with Hardhat 3 Ignition deployments locally
- **Multiple Fallback URLs** - Automatic failover to backup RPC providers
- **Read/Write Operations** - Execute smart contract calls on verified smart contracts.

### ⚡ Layer 2 Support

- **Arbitrum-Specific Fields** - Display L1 block numbers, send counts, and request IDs
- **Optimism Fee Data** - Show L1 fee breakdown (l1Fee, l1GasPrice, l1GasUsed, l1FeeScalar)

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openscan.git

# Navigate to the project directory
cd openscan

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at `http://localhost:3000`

### Use with Anvil/Foundry

After following the installation steps here https://getfoundry.sh/introduction/installation/ you can just run an anvil mainnet fork with `anvil --fork-url https://reth-ethereum.ithaca.xyz/rpc` or if you run any Anvil instance on the port 8545 it would be automatically detected by Openscan, if you run Anvil on a different port make sure to change the RPC on the app settings.

### Use with Hardhat node

If you run any Hardhat node instance on the port 8545 it would be automatically detected by Openscan, if you run hardhat node on a different port make sure to change the RPC on the app settings.

### Test Environment Script

For development and testing, use the included script that starts a local node with sample transactions and OpenScan:

```bash
# Run with npm script
npm run dev

# Run the script directly
bash scripts/run-test-hardhat-env.sh
```

This script will:
1. Start a Hardhat or Anvil node on port 8545.
2. Deploy test contracts and generate sample transactions
3. Start OpenScan with only Ethereum Mainnet and Localhost networks enabled
4. Create a `hardhat-test-artifacts.zip` for importing contract ABIs

### Build for Production

```bash
npm run build
```

### Type guards

```bash
npm run typecheck
```

### Lint and prettier

```bash
npm run lint:fix
```

## Configuration

### Custom RPC Endpoints

Navigate to Settings to configure custom RPC endpoints for each network. The app supports multiple fallback URLs for reliability.

Default RPC endpoints:

- **Ethereum**: `https://eth.llamarpc.com`, `https://rpc.ankr.com/eth`
- **Sepolia**: `https://rpc.sepolia.org`, `https://ethereum-sepolia-rpc.publicnode.com`
- **Arbitrum**: `https://arb1.arbitrum.io/rpc`, `https://arbitrum-one.publicnode.com`
- **Optimism**: `https://mainnet.optimism.io`, `https://optimism.publicnode.com`
- **BSC**: `https://bsc-dataseed.binance.org`, `https://bsc.publicnode.com`
- **BSC Testnet**: `https://data-seed-prebsc-1-s1.binance.org:8545`, `https://bsc-testnet.publicnode.com`
- **Polygon**: `https://polygon-rpc.com`, `https://polygon.llamarpc.com`
- **Localhost**: `http://localhost:8545`

### Supported Chain IDs

| Network | Chain ID |
|---------|----------|
| Ethereum Mainnet | 1 |
| Sepolia Testnet | 11155111 |
| Arbitrum One | 42161 |
| Optimism | 10 |
| Base | 8453 |
| BSC (BNB Chain) | 56 |
| BSC Testnet | 97 |
| Polygon POS | 137 |
| Localhost | 31337 |

## Architecture

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Custom RPC Service** - Direct JSON-RPC calls to blockchain nodes
- **Biome** – Code formatting and linting

### Project Structure

```mermaid
src/
├── components/       # React components
│   ├── common/       # Reusable UI components
│   └── pages/        # Page components
├── config/           # Default RPCs configurations
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── services/         # Blockchain data services
│   ├── adapters      # General reusable adapters
│   └── EVM/          # EVM-compatible chain adapters
│       ├── Arbitrum/ # Arbitrum-specific adapters
│       ├── common/   # EVM common resources
│       ├── L1/       # EVM L1 resources
│       └── Optimism/ # Optimism-specific adapters
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── styles/           # CSS stylesheets
```

### Data Flow

1. User selects a network (chain ID)
2. `DataService` instantiates network-specific adapters
3. Fetchers make JSON-RPC calls to configured endpoints
4. Adapters transform raw RPC data into typed structures
5. Components render the processed data

## Development

### Key Components

- **DataService** - Main service layer orchestrating RPC calls
- **Network Adapters** - Transform chain-specific data formats
- **Type Guards** - Runtime type checking for L2-specific fields
- **RPC Storage** - Persistent storage for custom RPC configurations

### Adding a New Network

1. Add chain ID to `src/types/index.ts`
2. Add default RPC endpoints to `src/utils/rpcStorage.ts`
3. Create adapters and fetchers in `src/services/EVM/[Network]/`
4. Update `DataService` conditional logic
5. Add network card to Home page
6. Add network logo to assets folder

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
