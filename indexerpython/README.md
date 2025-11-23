# OpenScan Blockchain Indexer

A Python-based blockchain indexer for EVM-compatible chains. Index and query blockchain data through a REST API, similar to Etherscan.

## Features

- **Multi-Network Support**: Ethereum Mainnet, Sepolia Testnet, and Local nodes
- **Complete Block Data**: Index blocks, transactions, receipts, and event logs
- **Continuous Sync**: Real-time synchronization to keep data up-to-date
- **REST API**: Query indexed data through FastAPI endpoints
- **Lightweight**: Uses SQLite for local storage
- **Extensible**: Easy to add support for other EVM chains

## Installation

### Prerequisites

- Python 3.10 or higher
- pip

### Setup

1. **Clone/Navigate to the project directory:**
   ```bash
   cd indexerpython
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env to customize RPC URLs and other settings
   ```

## Usage

### Indexing Blocks

#### Index latest 100 blocks and start continuous sync:
```bash
python main.py --sync
```

This will:
1. Index the latest 100 blocks from the network
2. Start continuous synchronization to keep data up-to-date
3. Keep running and index new blocks as they appear (every 12 seconds by default)

#### Index latest 100 blocks (one-time, no continuous sync):
```bash
python main.py
```

#### Index from a specific network:
```bash
python main.py --network mainnet --sync
python main.py --network sepolia --sync
python main.py --network local --sync
```

#### Index specific number of blocks:
```bash
python main.py --blocks 50 --sync
```

#### Index specific block range:
```bash
python main.py --start-block 1000000 --end-block 1000100
```

### Continuous Synchronization

#### Start continuous sync (skip initial indexing):
```bash
python main.py --sync-only
```

Use this if you already have data indexed and just want to keep it up-to-date.

#### Custom poll interval (seconds between checks):
```bash
python main.py --sync --poll-interval 6
```

#### Check sync status:
```bash
python main.py --status
```

This shows:
- Latest indexed block number
- Current blockchain block number
- How many blocks behind
- Sync progress percentage

### Starting the API Server

After indexing, start the REST API:

```bash
python -m src.api.main
```

Or using uvicorn directly:

```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the API is running, visit:
- **Interactive API docs**: http://localhost:8000/docs
- **OpenAPI schema**: http://localhost:8000/openapi.json

## API Endpoints

### Blocks

- `GET /blocks` - List blocks (with pagination)
  - Query params: `skip`, `limit`, `chain_id`
- `GET /blocks/{block_number}` - Get block details
- `GET /blocks/{block_number}/transactions` - Get block transactions

### Transactions

- `GET /transactions/{tx_hash}` - Get transaction details
- `GET /transactions/{tx_hash}/receipt` - Get transaction receipt
- `GET /transactions/{tx_hash}/logs` - Get transaction logs

### Address

- `GET /address/{address}/transactions` - Get address transactions
  - Query params: `skip`, `limit`
- `GET /address/{address}/balance` - Get calculated balance
- `GET /address/{address}/stats` - Get address statistics

### Network

- `GET /network/stats` - Get network statistics
- `GET /network/summary` - Get indexing summary
- `GET /network/chains` - List indexed chains

## Database

The indexer uses SQLite to store blockchain data locally. The database file is created at `./data/openscan.db` by default.

### Database Schema

- **blocks** - Block information
- **transactions** - Transaction data
- **transaction_receipts** - Transaction execution results
- **logs** - Smart contract event logs
- **network_stats** - Network statistics

## Configuration

Edit `.env` or set environment variables:

```bash
# RPC URLs
ETH_MAINNET_RPC_URL=https://eth.llamarpc.com
ETH_SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETH_LOCAL_RPC_URL=http://127.0.0.1:8545

# Default network
DEFAULT_NETWORK=sepolia

# Database
DATABASE_URL=sqlite:///./data/openscan.db

# API
API_HOST=0.0.0.0
API_PORT=8000

# Indexer
BLOCKS_TO_INDEX=100
```

## Adding Support for New Networks

To add support for a new EVM-compatible network:

1. Edit `src/config/networks.py`
2. Add the network to the `NETWORKS` dictionary:
   ```python
   NETWORKS = {
       # ... existing networks
       137: {
           "name": "Polygon Mainnet",
           "chain_id": 137,
           "rpc_key": "polygon_mainnet_rpc_url",
           "explorer": "https://polygonscan.com"
       }
   }
   ```
3. Add the RPC URL to `.env`:
   ```bash
   POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
   ```

## Example Queries

### Get latest blocks
```bash
curl http://localhost:8000/blocks?limit=10
```

### Get specific block
```bash
curl http://localhost:8000/blocks/19000000
```

### Get transaction details
```bash
curl http://localhost:8000/transactions/0x...
```

### Get address transactions
```bash
curl http://localhost:8000/address/0x.../transactions
```

### Get network stats
```bash
curl http://localhost:8000/network/stats
```

## Architecture

```
indexerpython/
├── src/
│   ├── config/          # Configuration and network settings
│   ├── database/        # SQLAlchemy models and connection
│   ├── rpc/             # RPC client for blockchain interaction
│   ├── indexer/         # Indexing logic
│   └── api/             # FastAPI REST endpoints
├── data/                # SQLite database files
├── main.py              # Main indexing script
└── requirements.txt     # Python dependencies
```

## Performance Notes

- **Indexing Speed**: Depends on RPC endpoint response time. Public RPCs may be slow.
- **Database Size**: ~100 blocks with transactions ≈ 10-50MB (varies by block content)
- **Memory Usage**: Low (~100-200MB during indexing)

## Workflow Example

### Recommended Setup

**Terminal 1 - Run the indexer with continuous sync:**
```bash
python main.py --network sepolia --sync
```

**Terminal 2 - Run the API server:**
```bash
python -m src.api.main
```

Now you have:
- A continuously synchronized blockchain indexer
- A REST API to query the data at http://localhost:8000

### How It Works

1. **Initial Sync**: When you start with `--sync`, it fetches the latest 100 blocks
2. **Continuous Updates**: Every 12 seconds (configurable), it checks for new blocks
3. **Automatic Indexing**: New blocks are indexed automatically as they appear on the blockchain
4. **Real-time API**: The API always serves the most up-to-date data

## Future Enhancements

- Address balance tracking
- Token transfers and ERC-20 events
- Smart contract verification
- WebSocket support for real-time updates
- Caching layer for frequently accessed data
- Support for reorganizations (chain reorgs)

## Troubleshooting

### Connection errors
- Check RPC URL is correct and accessible
- Try a different public RPC endpoint
- For local nodes, ensure the node is running

### Slow indexing
- Use a faster RPC endpoint (paid services like Alchemy, Infura)
- Reduce number of blocks to index
- Consider indexing in smaller batches

### Database locked errors
- Close any other connections to the SQLite database
- Use PostgreSQL for concurrent access

## License

MIT License

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
