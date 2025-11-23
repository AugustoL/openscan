#!/usr/bin/env python3
"""
OpenScan Blockchain Indexer
Main script to index blocks from EVM-compatible blockchains
"""

import argparse
import sys
from src.config.networks import NetworkConfig, settings
from src.rpc.client import RPCClient
from src.indexer.block_indexer import BlockIndexer
from src.indexer.sync_service import SyncService


def main():
    parser = argparse.ArgumentParser(
        description="OpenScan Blockchain Indexer - Index blocks from EVM-compatible chains"
    )

    parser.add_argument(
        "--network",
        type=str,
        default=settings.default_network,
        choices=["mainnet", "sepolia", "local"],
        help="Network to index (default: sepolia)"
    )

    parser.add_argument(
        "--blocks",
        type=int,
        default=settings.blocks_to_index,
        help=f"Number of latest blocks to index (default: {settings.blocks_to_index})"
    )

    parser.add_argument(
        "--start-block",
        type=int,
        help="Start from specific block number (overrides --blocks)"
    )

    parser.add_argument(
        "--end-block",
        type=int,
        help="End at specific block number (requires --start-block)"
    )

    parser.add_argument(
        "--sync",
        action="store_true",
        help="Enable continuous sync mode (keeps indexer running and syncs new blocks)"
    )

    parser.add_argument(
        "--sync-only",
        action="store_true",
        help="Only run continuous sync (skip initial indexing)"
    )

    parser.add_argument(
        "--poll-interval",
        type=int,
        default=12,
        help="Seconds to wait between checking for new blocks in sync mode (default: 12)"
    )

    parser.add_argument(
        "--status",
        action="store_true",
        help="Show sync status and exit"
    )

    args = parser.parse_args()

    try:
        # Get network ID from name
        network_id = NetworkConfig.get_network_id(args.network)
        network_info = NetworkConfig.get_network_info(network_id)

        print(f"\n{'='*60}")
        print(f"OpenScan Blockchain Indexer")
        print(f"{'='*60}")
        print(f"Network: {network_info['name']} (Chain ID: {network_id})")
        print(f"{'='*60}\n")

        # Initialize RPC client
        print("Connecting to RPC endpoint...")
        rpc_client = RPCClient(network_id)

        # Handle status check
        if args.status:
            sync_service = SyncService(rpc_client, args.poll_interval)
            status = sync_service.get_sync_status()

            print(f"\n{'='*60}")
            print(f"Sync Status")
            print(f"{'='*60}")
            print(f"Network: {network_info['name']}")
            print(f"Latest Indexed Block: {status['latest_indexed_block']}")
            print(f"Current Blockchain Block: {status['current_blockchain_block']}")
            print(f"Blocks Behind: {status['blocks_behind']}")
            print(f"Sync Progress: {status['sync_percentage']}%")
            print(f"Status: {'✓ Synced' if status['synced'] else '⚠ Behind'}")
            print(f"{'='*60}\n")
            sys.exit(0)

        # Handle sync-only mode
        if args.sync_only:
            sync_service = SyncService(rpc_client, args.poll_interval)
            sync_service.start_continuous_sync()
            sys.exit(0)

        # Initialize indexer
        indexer = BlockIndexer(rpc_client)

        # Determine blocks to index
        if args.start_block is not None and args.end_block is not None:
            # Index specific range
            print(f"\nIndexing blocks from {args.start_block} to {args.end_block}...")
            blocks = rpc_client.fetch_blocks_range(args.start_block, args.end_block)
            indexed_count = indexer.index_blocks(blocks)
        elif args.start_block is not None:
            # Index from specific block to latest
            latest_block = rpc_client.get_latest_block_number()
            print(f"\nIndexing blocks from {args.start_block} to {latest_block}...")
            blocks = rpc_client.fetch_blocks_range(args.start_block, latest_block)
            indexed_count = indexer.index_blocks(blocks)
        else:
            # Index latest N blocks
            indexed_count = indexer.index_latest_blocks(args.blocks)

        print(f"\n{'='*60}")
        print(f"Initial Indexing Complete!")
        print(f"{'='*60}")
        print(f"Successfully indexed {indexed_count} blocks")
        print(f"Database: {settings.database_url}")

        # Handle continuous sync mode
        if args.sync:
            print(f"\nStarting continuous sync mode...")
            print(f"The indexer will keep running and sync new blocks as they arrive.")
            print(f"\nYou can also start the API server in another terminal:")
            print(f"  python -m src.api.main")
            print(f"{'='*60}\n")

            sync_service = SyncService(rpc_client, args.poll_interval)
            sync_service.start_continuous_sync()
        else:
            print(f"\nTo start continuous sync:")
            print(f"  python main.py --network {args.network} --sync-only")
            print(f"\nStart the API server to query the indexed data:")
            print(f"  python -m src.api.main")
            print(f"{'='*60}\n")

    except KeyboardInterrupt:
        print("\n\nIndexing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
