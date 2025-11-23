from web3 import Web3
from typing import Dict, List, Optional, Any
from src.config.networks import NetworkConfig, settings


class RPCClient:
    """RPC client for interacting with EVM-compatible blockchains"""

    def __init__(self, network_id: int):
        """
        Initialize RPC client for a specific network

        Args:
            network_id: Network ID (1 for mainnet, 11155111 for sepolia, etc.)
        """
        self.network_id = network_id
        self.network_info = NetworkConfig.get_network_info(network_id)
        rpc_url = NetworkConfig.get_rpc_url(network_id, settings)

        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to {self.network_info['name']} at {rpc_url}")

        print(f"Connected to {self.network_info['name']} (Chain ID: {self.network_id})")

    def get_latest_block_number(self) -> int:
        """Get the latest block number"""
        return self.w3.eth.block_number

    def get_block(self, block_number: int, full_transactions: bool = True) -> Dict[str, Any]:
        """
        Get block data

        Args:
            block_number: Block number to fetch
            full_transactions: If True, include full transaction objects

        Returns:
            Block data dictionary
        """
        block = self.w3.eth.get_block(block_number, full_transactions=full_transactions)
        block_dict = dict(block)

        # Convert transactions to dicts if they are full objects
        if full_transactions and block_dict.get('transactions'):
            if len(block_dict['transactions']) > 0 and hasattr(block_dict['transactions'][0], 'items'):
                # Transactions are AttributeDict objects, convert to regular dicts
                block_dict['transactions'] = [dict(tx) for tx in block_dict['transactions']]

        return block_dict

    def get_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """
        Get transaction data

        Args:
            tx_hash: Transaction hash

        Returns:
            Transaction data dictionary
        """
        tx = self.w3.eth.get_transaction(tx_hash)
        return dict(tx)

    def get_transaction_receipt(self, tx_hash: str) -> Dict[str, Any]:
        """
        Get transaction receipt

        Args:
            tx_hash: Transaction hash

        Returns:
            Transaction receipt dictionary
        """
        receipt = self.w3.eth.get_transaction_receipt(tx_hash)
        return dict(receipt)

    def get_gas_price(self) -> int:
        """Get current gas price in wei"""
        return self.w3.eth.gas_price

    def is_syncing(self) -> bool:
        """Check if node is syncing"""
        syncing = self.w3.eth.syncing
        return syncing is not False

    def get_balance(self, address: str, block_number: Optional[int] = None) -> int:
        """
        Get balance of an address

        Args:
            address: Ethereum address
            block_number: Block number (None for latest)

        Returns:
            Balance in wei
        """
        if block_number is None:
            return self.w3.eth.get_balance(address)
        return self.w3.eth.get_balance(address, block_number)

    def get_code(self, address: str) -> str:
        """
        Get contract code at address

        Args:
            address: Contract address

        Returns:
            Contract bytecode as hex string
        """
        code = self.w3.eth.get_code(address)
        return code.hex()

    def get_transaction_count(self, address: str) -> int:
        """
        Get transaction count (nonce) for an address

        Args:
            address: Ethereum address

        Returns:
            Transaction count
        """
        return self.w3.eth.get_transaction_count(address)

    def fetch_blocks_range(self, start_block: int, end_block: int) -> List[Dict[str, Any]]:
        """
        Fetch a range of blocks with full transaction data

        Args:
            start_block: Starting block number (inclusive)
            end_block: Ending block number (inclusive)

        Returns:
            List of block dictionaries with full transaction data
        """
        blocks = []
        for block_num in range(start_block, end_block + 1):
            try:
                block = self.get_block(block_num, full_transactions=True)
                blocks.append(block)
                if (block_num - start_block + 1) % 10 == 0:
                    print(f"Fetched {block_num - start_block + 1}/{end_block - start_block + 1} blocks...")
            except Exception as e:
                print(f"Error fetching block {block_num}: {e}")
                continue

        return blocks

    def fetch_latest_blocks(self, count: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch the latest N blocks with full transaction data

        Args:
            count: Number of blocks to fetch

        Returns:
            List of block dictionaries with full transaction data
        """
        latest_block = self.get_latest_block_number()
        start_block = max(0, latest_block - count + 1)

        print(f"Fetching blocks {start_block} to {latest_block}...")
        return self.fetch_blocks_range(start_block, latest_block)

    def get_network_stats(self) -> Dict[str, Any]:
        """
        Get current network statistics

        Returns:
            Dictionary with network stats
        """
        return {
            "chain_id": self.network_id,
            "current_block_number": self.get_latest_block_number(),
            "current_gas_price": str(self.get_gas_price()),
            "is_syncing": self.is_syncing(),
            "network_name": self.network_info["name"]
        }
