#!/usr/bin/env python3
"""
Debug script to check what's in a block
"""
from src.config.networks import NetworkConfig, settings
from src.rpc.client import RPCClient

# Connect to network
network_id = NetworkConfig.get_network_id("sepolia")
rpc_client = RPCClient(network_id)

# Get latest block
latest_block_num = rpc_client.get_latest_block_number()
print(f"Latest block: {latest_block_num}")

# Fetch with full transactions
block = rpc_client.get_block(latest_block_num, full_transactions=True)

print(f"\nBlock {block['number']} info:")
print(f"  Hash: {block['hash']}")
print(f"  Transactions: {len(block['transactions'])}")

if len(block['transactions']) > 0:
    first_tx = block['transactions'][0]
    print(f"\nFirst transaction type: {type(first_tx)}")

    if isinstance(first_tx, dict):
        print("✓ Transactions are FULL OBJECTS (dict)")
        print(f"  Sample: {first_tx.get('hash', 'N/A')}")
    else:
        print("✗ Transactions are just HASHES (str)")
        print(f"  Sample: {first_tx}")
else:
    print("  No transactions in this block")
