from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database.connection import get_db
from src.database.models import Log
from pydantic import BaseModel

router = APIRouter(prefix="/logs", tags=["logs"])


class LogResponse(BaseModel):
    log_index: int
    transaction_hash: str
    block_number: int
    block_hash: str
    transaction_index: int
    address: str
    data: str
    topic0: Optional[str]
    topic1: Optional[str]
    topic2: Optional[str]
    topic3: Optional[str]
    removed: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[LogResponse])
def get_logs(
    address: Optional[str] = Query(None, description="Contract address that emitted the log"),
    topic0: Optional[str] = Query(None, description="Topic 0 (event signature)"),
    topic1: Optional[str] = Query(None, description="Topic 1"),
    topic2: Optional[str] = Query(None, description="Topic 2"),
    topic3: Optional[str] = Query(None, description="Topic 3"),
    from_block: Optional[int] = Query(None, description="Start block number (inclusive)"),
    to_block: Optional[int] = Query(None, description="End block number (inclusive)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    skip: int = Query(0, ge=0, description="Number of logs to skip"),
    db: Session = Depends(get_db)
):
    """
    Query event logs by contract address, topics, and block range
    Similar to eth_getLogs RPC method but using indexed data
    """
    query = db.query(Log)

    # Filter by address
    if address is not None:
        query = query.filter(Log.address == address.lower())

    # Filter by topics
    if topic0 is not None:
        query = query.filter(Log.topic0 == topic0)
    if topic1 is not None:
        query = query.filter(Log.topic1 == topic1)
    if topic2 is not None:
        query = query.filter(Log.topic2 == topic2)
    if topic3 is not None:
        query = query.filter(Log.topic3 == topic3)

    # Filter by block range
    if from_block is not None:
        query = query.filter(Log.block_number >= from_block)
    if to_block is not None:
        query = query.filter(Log.block_number <= to_block)

    # Filter out removed logs
    query = query.filter(Log.removed == False)

    # Order by block number and log index
    query = query.order_by(Log.block_number.desc(), Log.log_index.asc())

    # Apply pagination
    logs = query.offset(skip).limit(limit).all()

    return [
        LogResponse(
            log_index=log.log_index,
            transaction_hash=log.transaction_hash,
            block_number=log.block_number,
            block_hash=log.block_hash,
            transaction_index=log.transaction_index,
            address=log.address,
            data=log.data,
            topic0=log.topic0,
            topic1=log.topic1,
            topic2=log.topic2,
            topic3=log.topic3,
            removed=log.removed
        )
        for log in logs
    ]
