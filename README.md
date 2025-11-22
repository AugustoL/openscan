# OpenScan

A trustless, open-open source, standalone web-app, multi-chain blockchain explorer for Ethereum, Layer 2 networks, and local development chains with an intuitive interface.

## Features

### 🌐 Multi-Chain Support
- **Ethereum Mainnet** - The main Ethereum network
- **Sepolia Testnet** - Ethereum test network for development
- **Arbitrum One** - Ethereum Layer 2 scaling solution
- **Optimism** - Ethereum Layer 2 with low fees
- **Localhost** - Local development networks (Hardhat/Anvil)

### 🔍 Core Functionality
- **Block Explorer** - View detailed block information including transactions, gas usage, and timestamps
- **Transaction Details** - Inspect transaction data, receipts, logs, and execution details
- **Address Lookup** - Check balance, transaction history, and contract code
- **Mempool Viewer** - Monitor pending transactions in real-time
- **Network Statistics** - Track chain metrics, gas prices, and block times

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
- **Multiple Fallback URLs** - Automatic failover to backup RPC providers

### ⚡ Layer 2 Support
- **Arbitrum-Specific Fields** - Display L1 block numbers, send counts, and request IDs
- **Optimism Fee Data** - Show L1 fee breakdown (l1Fee, l1GasPrice, l1GasUsed, l1FeeScalar)
- **Network Detection** - Automatic adapter selection based on chain ID

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

### Build for Production

```bash
npm run build
```

## Configuration

### Custom RPC Endpoints

Navigate to Settings to configure custom RPC endpoints for each network. The app supports multiple fallback URLs for reliability.

Default RPC endpoints:
- **Ethereum**: `https://eth.llamarpc.com`, `https://rpc.ankr.com/eth`
- **Sepolia**: `https://rpc.sepolia.org`, `https://ethereum-sepolia-rpc.publicnode.com`
- **Arbitrum**: `https://arb1.arbitrum.io/rpc`, `https://arbitrum-one.publicnode.com`
- **Optimism**: `https://mainnet.optimism.io`, `https://optimism.publicnode.com`
- **Localhost**: `http://localhost:8545`

### Supported Chain IDs

| Network | Chain ID |
|---------|----------|
| Ethereum Mainnet | 1 |
| Sepolia Testnet | 11155111 |
| Arbitrum One | 42161 |
| Optimism | 10 |
| Localhost | 31337 |

## Architecture

### Tech Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Custom RPC Service** - Direct JSON-RPC calls to blockchain nodes

### Project Structure
```
src/
├── components/        # React components
│   ├── common/       # Reusable UI components
│   └── pages/        # Page components
├── services/         # Blockchain data services
│   └── EVM/          # EVM-compatible chain adapters
│       ├── Arbitrum/ # Arbitrum-specific adapters
│       └── Optimism/ # Optimism-specific adapters
├── context/          # React context providers
├── hooks/            # Custom React hooks
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
- **`DataService`** - Main service layer orchestrating RPC calls
- **Network Adapters** - Transform chain-specific data formats
- **Type Guards** - Runtime type checking for L2-specific fields
- **RPC Storage** - Persistent storage for custom RPC configurations

### Adding a New Network

1. Add chain ID to `src/types/index.ts`
2. Add RPC endpoints to `src/utils/rpcStorage.ts`
3. Create adapters in `src/services/EVM/[Network]/`
4. Update `DataService` conditional logic
5. Add network card to Home page
6. Add network logo to assets folder

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.