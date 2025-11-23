import time
import signal
import sys
from typing import Optional
from sqlalchemy.orm import Session
from src.rpc.client import RPCClient
from src.indexer.block_indexer import BlockIndexer
from src.database.connection import SessionLocal
from src.database.models import Block


class SyncService:
    """Service for continuous blockchain synchronization"""

    def __init__(self, rpc_client: RPCClient, poll_interval: int = 12):
        """
        Initialize sync service

        Args:
            rpc_client: RPC client instance
            poll_interval: Seconds to wait between checks for new blocks (default: 12s for Ethereum)
        """
        self.rpc_client = rpc_client
        self.indexer = BlockIndexer(rpc_client)
        self.poll_interval = poll_interval
        self.is_running = False
        self.chain_id = rpc_client.network_id

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        print("\n\nReceived shutdown signal. Stopping sync service...")
        self.is_running = False

    def _get_latest_indexed_block(self, db: Session) -> Optional[int]:
        """
        Get the latest block number that has been indexed

        Args:
            db: Database session

        Returns:
            Latest block number or None if no blocks indexed
        """
        latest_block = db.query(Block).filter(
            Block.chain_id == self.chain_id
        ).order_by(Block.number.desc()).first()

        return latest_block.number if latest_block else None

    def _index_missing_blocks(self, start_block: int, end_block: int) -> int:
        """
        Index a range of missing blocks

        Args:
            start_block: Start block number
            end_block: End block number

        Returns:
            Number of blocks indexed
        """
        if start_block > end_block:
            return 0

        print(f"Indexing missing blocks from {start_block} to {end_block}...")
        blocks = self.rpc_client.fetch_blocks_range(start_block, end_block)
        return self.indexer.index_blocks(blocks)

    def initial_sync(self, num_blocks: int = 100) -> int:
        """
        Perform initial sync of the latest N blocks

        Args:
            num_blocks: Number of recent blocks to index

        Returns:
            Number of blocks indexed
        """
        print(f"\n{'='*60}")
        print(f"Starting Initial Sync")
        print(f"{'='*60}\n")

        db = SessionLocal()
        try:
            latest_indexed = self._get_latest_indexed_block(db)

            if latest_indexed is not None:
                print(f"Found existing data. Latest indexed block: {latest_indexed}")
                choice = input("Do you want to:\n1. Continue from latest block\n2. Re-index last N blocks\nChoice (1/2): ").strip()

                if choice == "2":
                    # Re-index from N blocks ago
                    indexed_count = self.indexer.index_latest_blocks(num_blocks)
                    return indexed_count
                else:
                    print("Continuing from latest indexed block...")
                    return 0
            else:
                # No existing data, index latest N blocks
                print(f"No existing data found. Indexing latest {num_blocks} blocks...")
                indexed_count = self.indexer.index_latest_blocks(num_blocks)
                return indexed_count

        finally:
            db.close()

    def start_continuous_sync(self):
        """
        Start continuous synchronization service

        This will poll for new blocks and index them as they arrive
        """
        print(f"\n{'='*60}")
        print(f"Starting Continuous Sync Service")
        print(f"{'='*60}")
        print(f"Network: {self.rpc_client.network_info['name']}")
        print(f"Poll Interval: {self.poll_interval}s")
        print(f"Press Ctrl+C to stop")
        print(f"{'='*60}\n")

        self.is_running = True
        consecutive_errors = 0
        max_consecutive_errors = 5

        while self.is_running:
            try:
                db = SessionLocal()
                try:
                    # Get latest indexed block
                    latest_indexed = self._get_latest_indexed_block(db)

                    # Get current blockchain head
                    current_block = self.rpc_client.get_latest_block_number()

                    if latest_indexed is None:
                        print("No blocks indexed yet. Run initial sync first.")
                        break

                    # Calculate blocks to sync
                    blocks_behind = current_block - latest_indexed

                    if blocks_behind > 0:
                        print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] New blocks detected!")
                        print(f"Current block: {current_block}")
                        print(f"Latest indexed: {latest_indexed}")
                        print(f"Blocks behind: {blocks_behind}")

                        # Index new blocks one by one or in small batches
                        if blocks_behind <= 10:
                            # Small gap, index all at once
                            indexed_count = self._index_missing_blocks(
                                latest_indexed + 1,
                                current_block
                            )
                            print(f"Indexed {indexed_count} new block(s)")
                        else:
                            # Large gap, index in batches of 10
                            print(f"Large gap detected ({blocks_behind} blocks). Syncing in batches...")
                            total_indexed = 0
                            batch_start = latest_indexed + 1

                            while batch_start <= current_block and self.is_running:
                                batch_end = min(batch_start + 9, current_block)
                                indexed_count = self._index_missing_blocks(batch_start, batch_end)
                                total_indexed += indexed_count
                                batch_start = batch_end + 1

                                print(f"Progress: {total_indexed}/{blocks_behind} blocks indexed")

                            print(f"Sync complete! Indexed {total_indexed} blocks")

                        # Reset error counter on success
                        consecutive_errors = 0
                    else:
                        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Up to date (Block #{current_block})", end='\r')

                finally:
                    db.close()

                # Wait before next check
                time.sleep(self.poll_interval)

            except KeyboardInterrupt:
                print("\n\nShutdown requested by user")
                break

            except Exception as e:
                consecutive_errors += 1
                print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error during sync: {e}")

                if consecutive_errors >= max_consecutive_errors:
                    print(f"\nToo many consecutive errors ({consecutive_errors}). Stopping sync service.")
                    break

                print(f"Retrying in {self.poll_interval}s... (Error count: {consecutive_errors}/{max_consecutive_errors})")
                time.sleep(self.poll_interval)

        print(f"\n{'='*60}")
        print(f"Sync Service Stopped")
        print(f"{'='*60}\n")

    def sync_once(self):
        """
        Check for new blocks once and index them

        Useful for running as a cron job
        """
        db = SessionLocal()
        try:
            latest_indexed = self._get_latest_indexed_block(db)

            if latest_indexed is None:
                print("No blocks indexed yet. Run initial sync first.")
                return 0

            current_block = self.rpc_client.get_latest_block_number()
            blocks_behind = current_block - latest_indexed

            if blocks_behind > 0:
                print(f"Indexing {blocks_behind} new block(s)...")
                indexed_count = self._index_missing_blocks(
                    latest_indexed + 1,
                    current_block
                )
                print(f"Indexed {indexed_count} block(s)")
                return indexed_count
            else:
                print("Already up to date")
                return 0

        finally:
            db.close()

    def get_sync_status(self) -> dict:
        """
        Get current sync status

        Returns:
            Dictionary with sync status information
        """
        db = SessionLocal()
        try:
            latest_indexed = self._get_latest_indexed_block(db)
            current_block = self.rpc_client.get_latest_block_number()

            if latest_indexed is None:
                return {
                    "synced": False,
                    "latest_indexed_block": None,
                    "current_blockchain_block": current_block,
                    "blocks_behind": current_block,
                    "sync_percentage": 0.0
                }

            blocks_behind = current_block - latest_indexed
            sync_percentage = (latest_indexed / current_block * 100) if current_block > 0 else 0

            return {
                "synced": blocks_behind == 0,
                "latest_indexed_block": latest_indexed,
                "current_blockchain_block": current_block,
                "blocks_behind": blocks_behind,
                "sync_percentage": round(sync_percentage, 2)
            }

        finally:
            db.close()
