from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, BigInteger
from typing import List, Optional
from src.database.connection import get_db
from src.database.models import Transaction
from pydantic import BaseModel

router = APIRouter(prefix="/address", tags=["address"])


class AddressTransactionResponse(BaseModel):
    hash: str
    block_number: int
    timestamp: int
    from_address: str
    to_address: Optional[str]
    value: str
    gas: int
    gas_price: Optional[str]
    status: Optional[int]
    is_sender: bool

    class Config:
        from_attributes = True


@router.get("/{address}/transactions")
def get_address_transactions(
    address: str,
    skip: int = Query(0, ge=0, description="Number of transactions to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of transactions to return"),
    status: Optional[int] = Query(None, description="Filter by status (0=failed, 1=success)"),
    direction: Optional[str] = Query(None, description="Filter by direction (sent, received, both)"),
    from_block: Optional[int] = Query(None, description="Start block number (inclusive)"),
    to_block: Optional[int] = Query(None, description="End block number (inclusive)"),
    sort: str = Query("desc", description="Sort order (asc or desc)"),
    db: Session = Depends(get_db)
):
    """
    Get all transactions involving a specific address (as sender or receiver)
    Supports filtering by status, direction, and block range
    """
    # Normalize address to lowercase
    address = address.lower()

    # Build base query
    from src.database.models import Block, TransactionReceipt

    query = db.query(Transaction).join(
        Block,
        Transaction.block_number == Block.number
    ).outerjoin(
        TransactionReceipt,
        Transaction.hash == TransactionReceipt.transaction_hash
    )

    # Filter by direction
    if direction == "sent":
        query = query.filter(func.lower(Transaction.from_address) == address)
    elif direction == "received":
        query = query.filter(func.lower(Transaction.to_address) == address)
    else:  # "both" or None
        query = query.filter(
            or_(
                func.lower(Transaction.from_address) == address,
                func.lower(Transaction.to_address) == address
            )
        )

    # Filter by status
    if status is not None:
        query = query.filter(TransactionReceipt.status == status)

    # Filter by block range
    if from_block is not None:
        query = query.filter(Transaction.block_number >= from_block)
    if to_block is not None:
        query = query.filter(Transaction.block_number <= to_block)

    # Apply sorting
    if sort == "asc":
        query = query.order_by(Transaction.block_number.asc())
    else:
        query = query.order_by(Transaction.block_number.desc())

    # Get results with pagination
    results = query.offset(skip).limit(limit).all()

    if not results:
        return []

    # Build response
    response = []
    for tx in results:
        block = db.query(Block).filter(Block.number == tx.block_number).first()
        receipt = db.query(TransactionReceipt).filter(
            TransactionReceipt.transaction_hash == tx.hash
        ).first()

        is_sender = tx.from_address.lower() == address

        response.append({
            "hash": tx.hash,
            "block_number": tx.block_number,
            "timestamp": block.timestamp if block else 0,
            "from_address": tx.from_address,
            "to_address": tx.to_address,
            "value": tx.value,
            "gas": tx.gas,
            "gas_price": tx.gas_price,
            "status": receipt.status if receipt else None,
            "is_sender": is_sender
        })

    return response


@router.get("/{address}/balance")
def get_address_balance(
    address: str,
    db: Session = Depends(get_db)
):
    """
    Calculate address balance from indexed transactions
    Note: This is a simple calculation and may not reflect the actual current balance
    """
    # Normalize address
    address = address.lower()

    # This is a simplified balance calculation based on indexed transactions
    # For accurate balance, you would need to query the blockchain directly
    from src.database.models import TransactionReceipt

    # Calculate incoming value
    incoming = db.query(func.sum(func.cast(Transaction.value, BigInteger))).filter(
        func.lower(Transaction.to_address) == address
    ).scalar() or 0

    # Calculate outgoing value (only successful transactions)
    outgoing_query = db.query(func.sum(func.cast(Transaction.value, BigInteger))).join(
        TransactionReceipt,
        Transaction.hash == TransactionReceipt.transaction_hash
    ).filter(
        func.lower(Transaction.from_address) == address,
        TransactionReceipt.status == 1
    )
    outgoing = outgoing_query.scalar() or 0

    balance = incoming - outgoing

    return {
        "address": address,
        "balance": str(balance),
        "note": "Balance calculated from indexed transactions only. May not reflect actual on-chain balance."
    }


@router.get("/{address}/stats")
def get_address_stats(
    address: str,
    db: Session = Depends(get_db)
):
    """
    Get statistics for an address
    """
    address = address.lower()

    # Count transactions sent
    sent_count = db.query(func.count(Transaction.hash)).filter(
        func.lower(Transaction.from_address) == address
    ).scalar()

    # Count transactions received
    received_count = db.query(func.count(Transaction.hash)).filter(
        func.lower(Transaction.to_address) == address
    ).scalar()

    # Total value sent
    from src.database.models import TransactionReceipt
    sent_value = db.query(func.sum(func.cast(Transaction.value, BigInteger))).join(
        TransactionReceipt,
        Transaction.hash == TransactionReceipt.transaction_hash
    ).filter(
        func.lower(Transaction.from_address) == address,
        TransactionReceipt.status == 1
    ).scalar() or 0

    # Total value received
    received_value = db.query(func.sum(func.cast(Transaction.value, BigInteger))).filter(
        func.lower(Transaction.to_address) == address
    ).scalar() or 0

    return {
        "address": address,
        "transactions_sent": sent_count,
        "transactions_received": received_count,
        "total_sent": str(sent_value),
        "total_received": str(received_value),
        "net_balance": str(received_value - sent_value)
    }
