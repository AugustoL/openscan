from typing import List, Dict, Any
from sqlalchemy.orm import Session
from src.rpc.client import RPCClient
from src.database.models import Block, Transaction, TransactionReceipt, Log, NetworkStats
from src.database.connection import SessionLocal, init_db
from datetime import datetime


class BlockIndexer:
    """Block indexer that fetches and stores blockchain data"""

    def __init__(self, rpc_client: RPCClient):
        """
        Initialize block indexer

        Args:
            rpc_client: RPC client instance
        """
        self.rpc_client = rpc_client
        self.chain_id = rpc_client.network_id

        # Initialize database
        init_db()

    def _convert_hex_to_int(self, value: Any) -> int:
        """Convert hex string to integer"""
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.startswith('0x'):
            return int(value, 16)
        return int(value)

    def _convert_to_string(self, value: Any) -> str:
        """Convert various types to string"""
        if isinstance(value, bytes):
            return value.hex()
        if isinstance(value, int):
            return str(value)
        return str(value)

    def _store_block(self, block_data: Dict[str, Any], db: Session) -> Block:
        """
        Store block data in database

        Args:
            block_data: Block data from RPC
            db: Database session

        Returns:
            Block model instance
        """
        # Check if block already exists
        existing_block = db.query(Block).filter(Block.number == self._convert_hex_to_int(block_data['number'])).first()
        if existing_block:
            print(f"Block {block_data['number']} already exists, skipping...")
            return existing_block

        block = Block(
            number=self._convert_hex_to_int(block_data['number']),
            hash=self._convert_to_string(block_data['hash']),
            parent_hash=self._convert_to_string(block_data['parentHash']),
            timestamp=self._convert_hex_to_int(block_data['timestamp']),
            miner=block_data['miner'],
            difficulty=str(self._convert_hex_to_int(block_data['difficulty'])),
            total_difficulty=str(self._convert_hex_to_int(block_data.get('totalDifficulty', 0))),
            size=self._convert_hex_to_int(block_data['size']),
            nonce=self._convert_to_string(block_data.get('nonce', '0x0')),
            gas_limit=self._convert_hex_to_int(block_data['gasLimit']),
            gas_used=self._convert_hex_to_int(block_data['gasUsed']),
            base_fee_per_gas=str(self._convert_hex_to_int(block_data['baseFeePerGas'])) if 'baseFeePerGas' in block_data else None,
            state_root=self._convert_to_string(block_data['stateRoot']),
            transactions_root=self._convert_to_string(block_data['transactionsRoot']),
            receipts_root=self._convert_to_string(block_data['receiptsRoot']),
            extra_data=self._convert_to_string(block_data.get('extraData', '')),
            logs_bloom=self._convert_to_string(block_data.get('logsBloom', '')),
            sha3_uncles=self._convert_to_string(block_data['sha3Uncles']),
            mix_hash=self._convert_to_string(block_data.get('mixHash', '0x0')),
            chain_id=self.chain_id
        )

        db.add(block)
        return block

    def _store_transaction(self, tx_data: Dict[str, Any], db: Session) -> Transaction:
        """
        Store transaction data in database

        Args:
            tx_data: Transaction data from RPC
            db: Database session

        Returns:
            Transaction model instance
        """
        # Check if transaction already exists
        tx_hash = self._convert_to_string(tx_data['hash'])
        existing_tx = db.query(Transaction).filter(Transaction.hash == tx_hash).first()
        if existing_tx:
            return existing_tx

        transaction = Transaction(
            hash=tx_hash,
            block_number=self._convert_hex_to_int(tx_data['blockNumber']),
            block_hash=self._convert_to_string(tx_data['blockHash']),
            transaction_index=self._convert_hex_to_int(tx_data['transactionIndex']),
            from_address=tx_data['from'],
            to_address=tx_data.get('to'),
            value=str(self._convert_hex_to_int(tx_data['value'])),
            input_data=self._convert_to_string(tx_data['input']),
            nonce=self._convert_hex_to_int(tx_data['nonce']),
            gas=self._convert_hex_to_int(tx_data['gas']),
            gas_price=str(self._convert_hex_to_int(tx_data['gasPrice'])) if 'gasPrice' in tx_data else None,
            max_fee_per_gas=str(self._convert_hex_to_int(tx_data['maxFeePerGas'])) if 'maxFeePerGas' in tx_data else None,
            max_priority_fee_per_gas=str(self._convert_hex_to_int(tx_data['maxPriorityFeePerGas'])) if 'maxPriorityFeePerGas' in tx_data else None,
            type=self._convert_hex_to_int(tx_data.get('type', 0)),
            chain_id=self._convert_hex_to_int(tx_data.get('chainId', self.chain_id)),
            v=str(self._convert_hex_to_int(tx_data['v'])),
            r=self._convert_to_string(tx_data['r']),
            s=self._convert_to_string(tx_data['s'])
        )

        db.add(transaction)
        return transaction

    def _store_transaction_receipt(self, receipt_data: Dict[str, Any], db: Session) -> TransactionReceipt:
        """
        Store transaction receipt in database

        Args:
            receipt_data: Receipt data from RPC
            db: Database session

        Returns:
            TransactionReceipt model instance
        """
        tx_hash = self._convert_to_string(receipt_data['transactionHash'])

        # Check if receipt already exists
        existing_receipt = db.query(TransactionReceipt).filter(TransactionReceipt.transaction_hash == tx_hash).first()
        if existing_receipt:
            return existing_receipt

        receipt = TransactionReceipt(
            transaction_hash=tx_hash,
            block_number=self._convert_hex_to_int(receipt_data['blockNumber']),
            block_hash=self._convert_to_string(receipt_data['blockHash']),
            transaction_index=self._convert_hex_to_int(receipt_data['transactionIndex']),
            from_address=receipt_data['from'],
            to_address=receipt_data.get('to'),
            contract_address=receipt_data.get('contractAddress'),
            cumulative_gas_used=self._convert_hex_to_int(receipt_data['cumulativeGasUsed']),
            gas_used=self._convert_hex_to_int(receipt_data['gasUsed']),
            effective_gas_price=str(self._convert_hex_to_int(receipt_data['effectiveGasPrice'])),
            status=self._convert_hex_to_int(receipt_data['status']),
            type=self._convert_hex_to_int(receipt_data.get('type', 0)),
            logs_bloom=self._convert_to_string(receipt_data.get('logsBloom', ''))
        )

        db.add(receipt)
        return receipt

    def _store_logs(self, logs_data: List[Dict[str, Any]], db: Session) -> List[Log]:
        """
        Store event logs in database

        Args:
            logs_data: List of log data from receipt
            db: Database session

        Returns:
            List of Log model instances
        """
        logs = []
        for log_data in logs_data:
            topics = log_data.get('topics', [])

            log = Log(
                transaction_hash=self._convert_to_string(log_data['transactionHash']),
                log_index=self._convert_hex_to_int(log_data['logIndex']),
                block_number=self._convert_hex_to_int(log_data['blockNumber']),
                block_hash=self._convert_to_string(log_data['blockHash']),
                transaction_index=self._convert_hex_to_int(log_data['transactionIndex']),
                address=log_data['address'],
                data=self._convert_to_string(log_data['data']),
                topic0=self._convert_to_string(topics[0]) if len(topics) > 0 else None,
                topic1=self._convert_to_string(topics[1]) if len(topics) > 1 else None,
                topic2=self._convert_to_string(topics[2]) if len(topics) > 2 else None,
                topic3=self._convert_to_string(topics[3]) if len(topics) > 3 else None,
                removed=log_data.get('removed', False)
            )

            db.add(log)
            logs.append(log)

        return logs

    def index_block(self, block_data: Dict[str, Any], db: Session) -> Block:
        """
        Index a single block with all its transactions and receipts

        Args:
            block_data: Block data from RPC (must include full transactions)
            db: Database session

        Returns:
            Block model instance
        """
        # Store block
        block = self._store_block(block_data, db)

        # Store transactions
        transactions = block_data.get('transactions', [])

        if transactions:
            # Check if we have full transaction objects or just hashes
            if isinstance(transactions[0], dict):
                # Full transaction objects
                print(f"  Indexing {len(transactions)} transactions...")
                for tx_data in transactions:
                    # Store transaction
                    self._store_transaction(tx_data, db)

                    # Fetch and store receipt
                    try:
                        receipt_data = self.rpc_client.get_transaction_receipt(self._convert_to_string(tx_data['hash']))
                        self._store_transaction_receipt(receipt_data, db)

                        # Store logs
                        if 'logs' in receipt_data and receipt_data['logs']:
                            self._store_logs(receipt_data['logs'], db)

                    except Exception as e:
                        print(f"Error fetching receipt for tx {tx_data['hash']}: {e}")
            else:
                # Only transaction hashes - need to fetch full transaction data
                print(f"  Block has {len(transactions)} transaction hashes (not full objects)")
                print(f"  WARNING: Transactions not indexed. Use full_transactions=True when fetching blocks.")

        return block

    def index_blocks(self, blocks_data: List[Dict[str, Any]]) -> int:
        """
        Index multiple blocks

        Args:
            blocks_data: List of block data from RPC

        Returns:
            Number of blocks indexed
        """
        db = SessionLocal()
        indexed_count = 0

        try:
            for i, block_data in enumerate(blocks_data):
                try:
                    self.index_block(block_data, db)
                    db.commit()
                    indexed_count += 1
                    print(f"Indexed block {block_data['number']} ({i + 1}/{len(blocks_data)})")
                except Exception as e:
                    print(f"Error indexing block {block_data.get('number', 'unknown')}: {e}")
                    db.rollback()
                    continue

            # Update network stats
            self._update_network_stats(db)
            db.commit()

        finally:
            db.close()

        return indexed_count

    def _update_network_stats(self, db: Session):
        """Update network statistics in database"""
        stats_data = self.rpc_client.get_network_stats()

        # Check if stats already exist for this chain
        stats = db.query(NetworkStats).filter(NetworkStats.chain_id == self.chain_id).first()

        if stats:
            # Update existing stats
            stats.current_block_number = stats_data['current_block_number']
            stats.current_gas_price = stats_data['current_gas_price']
            stats.is_syncing = stats_data['is_syncing']
            stats.last_updated = int(datetime.now().timestamp())
        else:
            # Create new stats
            stats = NetworkStats(
                chain_id=self.chain_id,
                current_block_number=stats_data['current_block_number'],
                current_gas_price=stats_data['current_gas_price'],
                is_syncing=stats_data['is_syncing'],
                last_updated=int(datetime.now().timestamp())
            )
            db.add(stats)

    def index_latest_blocks(self, count: int = 100) -> int:
        """
        Fetch and index the latest N blocks

        Args:
            count: Number of blocks to index

        Returns:
            Number of blocks indexed
        """
        print(f"Fetching latest {count} blocks from {self.rpc_client.network_info['name']}...")
        blocks = self.rpc_client.fetch_latest_blocks(count)

        print(f"\nIndexing {len(blocks)} blocks...")
        indexed_count = self.index_blocks(blocks)

        print(f"\nSuccessfully indexed {indexed_count}/{len(blocks)} blocks")
        return indexed_count
