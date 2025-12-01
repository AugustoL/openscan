# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenScan is a trustless, open-source, standalone web-app and multi-chain blockchain explorer for Ethereum and Layer 2 networks. It allows direct interaction with verified smart contracts and supports local development chains.

## Development Commands

### Start Development Server

```bash
npm start
# Runs on http://localhost:3000
```

### Build for Production

```bash
npm run build
# Output: dist/
```

### Type Checking

```bash
npm run typecheck
```

### Formatting and Linting

```bash
# Check formatting (dry run)
npm run format

# Fix formatting issues automatically
npm run format:fix

# Check linting issues (dry run)
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Test Environment with Local Node

```bash
npm run dev
# Starts Hardhat node + OpenScan with sample contracts
# Creates hardhat-test-artifacts.zip for importing ABIs
```

### Individual Script Execution

```bash
# Build for production deployment
bash scripts/build-production.sh

# Build for staging
bash scripts/build-staging.sh

# Run test environment
bash scripts/run-test-env.sh
```

## Architecture Overview

### Data Flow Pattern

OpenScan follows a layered architecture with clear separation between data fetching, transformation, and presentation:

1. **RPC Layer** (`RPCClient.ts`) - Handles JSON-RPC communication with blockchain nodes
   - Supports two strategies: `fallback` (sequential with automatic failover) and `parallel` (query all providers simultaneously)
   - Strategy is configurable via user settings (`useDataService` hook applies strategy)
   - Parallel mode enables provider comparison and inconsistency detection

2. **Fetcher Layer** (`services/EVM/*/fetchers/`) - Makes raw RPC calls for specific data types
   - Network-specific implementations: `L1/`, `Arbitrum/`, `Optimism/`
   - Each fetcher handles one domain (blocks, transactions, addresses, network stats)

3. **Adapter Layer** (`services/EVM/*/adapters/`) - Transforms raw RPC responses into typed domain objects
   - Normalizes network-specific fields (e.g., Arbitrum's `l1BlockNumber`, Optimism's L1 fee data)
   - Ensures consistent type structure across networks

4. **Service Layer** (`DataService.ts`) - Orchestrates data fetching with caching and metadata
   - Instantiates network-specific fetchers/adapters based on chain ID
   - Returns `DataWithMetadata<T>` when using parallel strategy, containing:
     - `data`: The primary result (from first successful provider)
     - `metadata`: Optional RPCMetadata with all provider responses, hashes, and inconsistency flags
   - 30-second in-memory cache keyed by `chainId:type:identifier`
   - Supports trace operations (debug_traceTransaction, etc.) for localhost networks only

5. **Hook Layer** (`hooks/`) - React integration
   - `useDataService(chainId)`: Creates DataService instance with strategy from settings
   - `useProviderSelection`: Manages user's selected RPC provider in parallel mode
   - `useSelectedData`: Extracts data from specific provider based on user selection

6. **Context Layer** (`context/`) - Global state management
   - `AppContext`: RPC URLs configuration
   - `SettingsContext`: User settings including `rpcStrategy` ('fallback' | 'parallel')

### Network-Specific Handling

Chain ID detection in `DataService` constructor determines which adapters/fetchers to use:

- **Arbitrum** (42161): `BlockFetcherArbitrum`, `BlockArbitrumAdapter` - adds `l1BlockNumber`, `sendCount`, `requestId`
- **OP Stack** (10, 8453): Optimism (10), Base (8453) - adds L1 fee breakdown (`l1Fee`, `l1GasPrice`, `l1GasUsed`)
- **Localhost** (31337): All networks + trace support (`debug_traceTransaction`, `trace_block`, etc.)
- **Default**: L1 fetchers/adapters for Ethereum (1), BSC (56, 97), Polygon (137), Sepolia (11155111)

### Parallel RPC Strategy

Recent addition supporting simultaneous queries to all configured RPC providers:

- **RPCClient.parallelCall()**: Sends same request to all URLs, returns array of `ParallelRequestResult`
- **RPCMetadataService**: Creates metadata with provider responses, hashes, and inconsistency detection
- **DataService methods**: When `strategy === "parallel"`:
  - Build complete domain objects for each provider (e.g., transactions include receipts)
  - Return metadata alongside default data
  - Enable UI to show provider comparison and allow user switching

### Key Type Definitions

Located in `src/types/index.ts`:

- **Block** / **BlockArbitrum** - Block data with optional L2 fields
- **Transaction** / **TransactionArbitrum** - Transaction data with optional receipt
- **Address** - Balance, code, tx count, recent transactions
- **NetworkStats** - Gas price, sync status, block number
- **DataWithMetadata<T>** - Wrapper type for data + optional RPC metadata
- **RPCMetadata** - Contains strategy, timestamp, provider responses, and inconsistency flags

## Network Configuration

Networks are defined in `src/config/networks.ts`. To control which networks are displayed:

```bash
# Show only specific networks (comma-separated chain IDs)
REACT_APP_OPENSCAN_NETWORKS="1,31337" npm start

# Show all networks (default)
npm start
```

Supported chain IDs: 1 (Ethereum), 42161 (Arbitrum), 10 (Optimism), 8453 (Base), 56 (BSC), 137 (Polygon), 31337 (Localhost), 97 (BSC Testnet), 11155111 (Sepolia)

## Adding a New Network

1. Add chain ID to `src/types/index.ts` if creating new domain types
2. Add default RPC endpoints to `src/config/rpcConfig.ts`
3. Determine if network needs custom fetchers/adapters (L1, Arbitrum-like, OP Stack-like)
4. If custom: create `src/services/EVM/[Network]/fetchers/` and `adapters/`
5. Update `DataService` constructor to detect chain ID and instantiate correct fetchers/adapters
6. Add network config to `ALL_NETWORKS` in `src/config/networks.ts`
7. Add network logo to `public/` and update `logoType` in network config

## Testing with Local Networks

OpenScan includes special support for localhost development:

- **Hardhat 3 Ignition**: Import deployment artifacts via Settings → Import Ignition Deployment
- **Trace Support**: `debug_traceTransaction`, `debug_traceBlockByHash`, `debug_traceCall` available on localhost (31337)
- **Auto-detection**: Port 8545 automatically recognized as localhost network

## Build Configuration

- **Webpack** (`webpack.config.js`) - Custom config with TypeScript, CSS, asset loading
- **GitHub Pages**: Set `GITHUB_PAGES=true` for `/openscan/` base path
- **Environment Variables**: Injected via `webpack.DefinePlugin`:
  - `REACT_APP_COMMIT_HASH` - Git commit hash
  - `REACT_APP_OPENSCAN_NETWORKS` - Comma-separated chain IDs to display
  - `REACT_APP_ENVIRONMENT` - production/development

## Code Style

- **Biome** for formatting and linting (config: `biome.json`)
  - Line width: 100 characters
  - Indentation: 2 spaces
  - Scope: `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.json` (excludes CSS files)
  - Enabled rules: All recommended Biome linting rules
  - Use `npm run format:fix` to auto-format code before committing
  - Use `npm run lint:fix` to auto-fix linting issues (max 1024 diagnostics shown)
- **TypeScript** with strict mode (`noImplicitAny`, `noImplicitReturns`, `noUncheckedIndexedAccess`)
- **React 19** with functional components and hooks

## Coding Standards and Workflow

### Before Committing Code

ALWAYS run these commands before committing to ensure code quality:

```bash
# 1. Fix formatting issues
npm run format:fix

# 2. Fix linting issues
npm run lint:fix

# 3. Verify type safety
npm run typecheck

# 4. Run tests (if applicable)
npm run test:run
```

### Code Quality Requirements

- All code must pass Biome formatting and linting checks
- All TypeScript code must pass type checking with zero errors
- Follow the 100-character line width limit
- Use 2-space indentation consistently
- Adhere to Biome's recommended linting rules

### When Claude Code Modifies Files

- Run `npm run format:fix` and `npm run lint:fix` after making changes
- Address any remaining linting warnings that cannot be auto-fixed
- Ensure TypeScript compilation succeeds with `npm run typecheck`
- Do not commit code with formatting, linting, or type errors

## Important Patterns

### When Modifying Data Fetching

- Always maintain the adapter pattern: Fetcher → Adapter → Service
- If adding parallel strategy support, ensure complete objects are built for each provider
- Test both `fallback` and `parallel` strategies
- Update TypeScript types in `src/types/index.ts` if adding new fields

### When Adding L2-Specific Features

- Check if network is OP Stack-based (Optimism, Base) or Arbitrum
- Add network-specific types (e.g., `TransactionOptimism extends Transaction`)
- Create adapters that inherit base behavior and add L2 fields
- Update `DataService` conditional logic in constructor and relevant methods

### When Working with Cache

- Cache keys format: `${chainId}:${type}:${identifier}`
- Don't cache "latest" block queries
- Clear cache when switching networks using `clearCacheForChain(chainId)`
- Default timeout: 30 seconds

### RPC Strategy Switching

- Strategy is set per-DataService instance via constructor
- User setting stored in `SettingsContext.settings.rpcStrategy`
- `useDataService` hook automatically applies current strategy
- All service methods check `this.rpcClient.getStrategy()` to determine behavior
