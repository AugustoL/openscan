from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.database.connection import get_db
from src.database.models import NetworkStats, Block, Transaction
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/network", tags=["network"])


class NetworkStatsResponse(BaseModel):
    chain_id: int
    current_block_number: int
    current_gas_price: str
    is_syncing: bool
    last_updated: int
    indexed_blocks: int
    indexed_transactions: int

    class Config:
        from_attributes = True


class NetworkSummaryResponse(BaseModel):
    total_blocks: int
    total_transactions: int
    latest_block: Optional[int]
    earliest_block: Optional[int]
    average_gas_used: Optional[float]
    average_transactions_per_block: Optional[float]


@router.get("/stats", response_model=NetworkStatsResponse)
def get_network_stats(
    chain_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get current network statistics
    """
    query = db.query(NetworkStats)

    if chain_id is not None:
        query = query.filter(NetworkStats.chain_id == chain_id)

    stats = query.first()

    if not stats:
        raise HTTPException(
            status_code=404,
            detail="Network stats not found. Run the indexer first."
        )

    # Count indexed blocks and transactions for this chain
    indexed_blocks = db.query(func.count(Block.number)).filter(
        Block.chain_id == stats.chain_id
    ).scalar()

    indexed_transactions = db.query(func.count(Transaction.hash)).join(
        Block,
        Transaction.block_number == Block.number
    ).filter(
        Block.chain_id == stats.chain_id
    ).scalar()

    return NetworkStatsResponse(
        chain_id=stats.chain_id,
        current_block_number=stats.current_block_number,
        current_gas_price=stats.current_gas_price,
        is_syncing=stats.is_syncing,
        last_updated=stats.last_updated,
        indexed_blocks=indexed_blocks or 0,
        indexed_transactions=indexed_transactions or 0
    )


@router.get("/summary", response_model=NetworkSummaryResponse)
def get_network_summary(
    chain_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get summary statistics about indexed data
    """
    query = db.query(Block)

    if chain_id is not None:
        query = query.filter(Block.chain_id == chain_id)

    # Total blocks
    total_blocks = query.count()

    if total_blocks == 0:
        raise HTTPException(
            status_code=404,
            detail="No indexed data found. Run the indexer first."
        )

    # Latest and earliest blocks
    latest_block = query.order_by(Block.number.desc()).first()
    earliest_block = query.order_by(Block.number.asc()).first()

    # Average gas used
    avg_gas = db.query(func.avg(Block.gas_used)).scalar()

    # Total transactions
    tx_query = db.query(Transaction)
    if chain_id is not None:
        tx_query = tx_query.join(Block, Transaction.block_number == Block.number).filter(
            Block.chain_id == chain_id
        )
    total_transactions = tx_query.count()

    # Average transactions per block
    avg_tx_per_block = total_transactions / total_blocks if total_blocks > 0 else 0

    return NetworkSummaryResponse(
        total_blocks=total_blocks,
        total_transactions=total_transactions,
        latest_block=latest_block.number if latest_block else None,
        earliest_block=earliest_block.number if earliest_block else None,
        average_gas_used=float(avg_gas) if avg_gas else None,
        average_transactions_per_block=avg_tx_per_block
    )


@router.get("/chains")
def list_indexed_chains(db: Session = Depends(get_db)):
    """
    List all chains that have been indexed
    """
    chains = db.query(NetworkStats).all()

    if not chains:
        return []

    result = []
    for chain in chains:
        block_count = db.query(func.count(Block.number)).filter(
            Block.chain_id == chain.chain_id
        ).scalar()

        result.append({
            "chain_id": chain.chain_id,
            "current_block_number": chain.current_block_number,
            "indexed_blocks": block_count,
            "last_updated": chain.last_updated
        })

    return result
