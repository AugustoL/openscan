from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database.connection import get_db
from src.database.models import Block, Transaction
from pydantic import BaseModel

router = APIRouter(prefix="/blocks", tags=["blocks"])


class BlockResponse(BaseModel):
    number: int
    hash: str
    parent_hash: str
    timestamp: int
    miner: str
    gas_used: int
    gas_limit: int
    base_fee_per_gas: Optional[str]
    transaction_count: int
    size: int

    class Config:
        from_attributes = True


class BlockDetailResponse(BaseModel):
    number: int
    hash: str
    parent_hash: str
    timestamp: int
    miner: str
    difficulty: str
    total_difficulty: str
    size: int
    nonce: str
    gas_limit: int
    gas_used: int
    base_fee_per_gas: Optional[str]
    state_root: str
    transactions_root: str
    receipts_root: str
    extra_data: str
    logs_bloom: str
    sha3_uncles: str
    mix_hash: Optional[str]
    chain_id: int
    transaction_count: int

    class Config:
        from_attributes = True


@router.get("/latest", response_model=List[BlockResponse])
def get_latest_blocks(
    limit: int = Query(10, ge=1, le=100, description="Number of latest blocks to return"),
    chain_id: Optional[int] = Query(None, description="Filter by chain ID"),
    db: Session = Depends(get_db)
):
    """
    Get the latest N blocks in descending order (newest first)
    """
    query = db.query(Block)

    if chain_id is not None:
        query = query.filter(Block.chain_id == chain_id)

    blocks = query.order_by(Block.number.desc()).limit(limit).all()

    # Add transaction count to each block
    result = []
    for block in blocks:
        tx_count = db.query(Transaction).filter(Transaction.block_number == block.number).count()
        block_dict = {
            "number": block.number,
            "hash": block.hash,
            "parent_hash": block.parent_hash,
            "timestamp": block.timestamp,
            "miner": block.miner,
            "gas_used": block.gas_used,
            "gas_limit": block.gas_limit,
            "base_fee_per_gas": block.base_fee_per_gas,
            "transaction_count": tx_count,
            "size": block.size
        }
        result.append(BlockResponse(**block_dict))

    return result


@router.get("/", response_model=List[BlockResponse])
def list_blocks(
    skip: int = Query(0, ge=0, description="Number of blocks to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of blocks to return"),
    chain_id: Optional[int] = Query(None, description="Filter by chain ID"),
    db: Session = Depends(get_db)
):
    """
    List blocks in descending order (newest first)
    """
    query = db.query(Block)

    if chain_id is not None:
        query = query.filter(Block.chain_id == chain_id)

    blocks = query.order_by(Block.number.desc()).offset(skip).limit(limit).all()

    # Add transaction count to each block
    result = []
    for block in blocks:
        tx_count = db.query(Transaction).filter(Transaction.block_number == block.number).count()
        block_dict = {
            "number": block.number,
            "hash": block.hash,
            "parent_hash": block.parent_hash,
            "timestamp": block.timestamp,
            "miner": block.miner,
            "gas_used": block.gas_used,
            "gas_limit": block.gas_limit,
            "base_fee_per_gas": block.base_fee_per_gas,
            "transaction_count": tx_count,
            "size": block.size
        }
        result.append(BlockResponse(**block_dict))

    return result


@router.get("/hash/{block_hash}", response_model=BlockDetailResponse)
def get_block_by_hash(
    block_hash: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific block by hash
    """
    block = db.query(Block).filter(Block.hash == block_hash).first()

    if not block:
        raise HTTPException(status_code=404, detail=f"Block with hash {block_hash} not found")

    # Get transaction count
    tx_count = db.query(Transaction).filter(Transaction.block_number == block.number).count()

    block_dict = {
        "number": block.number,
        "hash": block.hash,
        "parent_hash": block.parent_hash,
        "timestamp": block.timestamp,
        "miner": block.miner,
        "difficulty": block.difficulty,
        "total_difficulty": block.total_difficulty,
        "size": block.size,
        "nonce": block.nonce,
        "gas_limit": block.gas_limit,
        "gas_used": block.gas_used,
        "base_fee_per_gas": block.base_fee_per_gas,
        "state_root": block.state_root,
        "transactions_root": block.transactions_root,
        "receipts_root": block.receipts_root,
        "extra_data": block.extra_data,
        "logs_bloom": block.logs_bloom,
        "sha3_uncles": block.sha3_uncles,
        "mix_hash": block.mix_hash,
        "chain_id": block.chain_id,
        "transaction_count": tx_count
    }

    return BlockDetailResponse(**block_dict)


@router.get("/{block_number}", response_model=BlockDetailResponse)
def get_block(
    block_number: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific block by number
    """
    block = db.query(Block).filter(Block.number == block_number).first()

    if not block:
        raise HTTPException(status_code=404, detail=f"Block {block_number} not found")

    # Get transaction count
    tx_count = db.query(Transaction).filter(Transaction.block_number == block_number).count()

    block_dict = {
        "number": block.number,
        "hash": block.hash,
        "parent_hash": block.parent_hash,
        "timestamp": block.timestamp,
        "miner": block.miner,
        "difficulty": block.difficulty,
        "total_difficulty": block.total_difficulty,
        "size": block.size,
        "nonce": block.nonce,
        "gas_limit": block.gas_limit,
        "gas_used": block.gas_used,
        "base_fee_per_gas": block.base_fee_per_gas,
        "state_root": block.state_root,
        "transactions_root": block.transactions_root,
        "receipts_root": block.receipts_root,
        "extra_data": block.extra_data,
        "logs_bloom": block.logs_bloom,
        "sha3_uncles": block.sha3_uncles,
        "mix_hash": block.mix_hash,
        "chain_id": block.chain_id,
        "transaction_count": tx_count
    }

    return BlockDetailResponse(**block_dict)


@router.get("/{block_number}/transactions")
def get_block_transactions(
    block_number: int,
    include_receipts: bool = Query(False, description="Include transaction receipts"),
    db: Session = Depends(get_db)
):
    """
    Get all transactions in a specific block
    Optionally include transaction receipts with status information
    """
    block = db.query(Block).filter(Block.number == block_number).first()

    if not block:
        raise HTTPException(status_code=404, detail=f"Block {block_number} not found")

    transactions = db.query(Transaction).filter(
        Transaction.block_number == block_number
    ).order_by(Transaction.transaction_index).all()

    if include_receipts:
        from src.database.models import TransactionReceipt
        result = []
        for tx in transactions:
            receipt = db.query(TransactionReceipt).filter(
                TransactionReceipt.transaction_hash == tx.hash
            ).first()

            tx_data = {
                "hash": tx.hash,
                "from": tx.from_address,
                "to": tx.to_address,
                "value": tx.value,
                "gas": tx.gas,
                "gas_price": tx.gas_price,
                "nonce": tx.nonce,
                "transaction_index": tx.transaction_index,
                "type": tx.type
            }

            if receipt:
                tx_data["receipt"] = {
                    "status": receipt.status,
                    "gas_used": receipt.gas_used,
                    "cumulative_gas_used": receipt.cumulative_gas_used,
                    "effective_gas_price": receipt.effective_gas_price,
                    "contract_address": receipt.contract_address
                }

            result.append(tx_data)
        return result
    else:
        return [
            {
                "hash": tx.hash,
                "from": tx.from_address,
                "to": tx.to_address,
                "value": tx.value,
                "gas": tx.gas,
                "gas_price": tx.gas_price,
                "nonce": tx.nonce,
                "transaction_index": tx.transaction_index,
                "type": tx.type
            }
            for tx in transactions
        ]
