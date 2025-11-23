from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database.connection import get_db
from src.database.models import Transaction, TransactionReceipt, Log
from pydantic import BaseModel

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionWithTimestampResponse(BaseModel):
    hash: str
    block_number: int
    block_hash: str
    timestamp: int
    transaction_index: int
    from_address: str
    to_address: Optional[str]
    value: str
    gas: int
    gas_price: Optional[str]
    max_fee_per_gas: Optional[str]
    max_priority_fee_per_gas: Optional[str]
    nonce: int
    type: int
    status: Optional[int]

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    hash: str
    block_number: int
    block_hash: str
    timestamp: Optional[int]
    transaction_index: int
    from_address: str
    to_address: Optional[str]
    value: str
    gas: int
    gas_price: Optional[str]
    max_fee_per_gas: Optional[str]
    max_priority_fee_per_gas: Optional[str]
    nonce: int
    type: int
    input_data: str

    class Config:
        from_attributes = True


class ReceiptResponse(BaseModel):
    transaction_hash: str
    block_number: int
    block_hash: str
    from_address: str
    to_address: Optional[str]
    contract_address: Optional[str]
    gas_used: int
    cumulative_gas_used: int
    effective_gas_price: str
    status: int
    type: int

    class Config:
        from_attributes = True


class LogResponse(BaseModel):
    log_index: int
    transaction_hash: str
    block_number: int
    address: str
    data: str
    topic0: Optional[str]
    topic1: Optional[str]
    topic2: Optional[str]
    topic3: Optional[str]

    class Config:
        from_attributes = True


class TransactionWithReceiptResponse(BaseModel):
    hash: str
    block_number: int
    block_hash: str
    timestamp: Optional[int]
    transaction_index: int
    from_address: str
    to_address: Optional[str]
    value: str
    gas: int
    gas_price: Optional[str]
    max_fee_per_gas: Optional[str]
    max_priority_fee_per_gas: Optional[str]
    nonce: int
    type: int
    input_data: str
    receipt: Optional[ReceiptResponse]

    class Config:
        from_attributes = True


@router.get("/latest", response_model=List[TransactionWithTimestampResponse])
def get_latest_transactions(
    limit: int = Query(50, ge=1, le=100, description="Number of latest transactions to return"),
    chain_id: Optional[int] = Query(None, description="Filter by chain ID"),
    db: Session = Depends(get_db)
):
    """
    Get the latest N transactions across all blocks
    Includes timestamp and status information
    """
    from src.database.models import Block

    query = db.query(Transaction, Block.timestamp, TransactionReceipt.status).join(
        Block,
        Transaction.block_number == Block.number
    ).outerjoin(
        TransactionReceipt,
        Transaction.hash == TransactionReceipt.transaction_hash
    )

    if chain_id is not None:
        query = query.filter(Block.chain_id == chain_id)

    results = query.order_by(
        Transaction.block_number.desc(),
        Transaction.transaction_index.desc()
    ).limit(limit).all()

    return [
        TransactionWithTimestampResponse(
            hash=tx.hash,
            block_number=tx.block_number,
            block_hash=tx.block_hash,
            timestamp=timestamp,
            transaction_index=tx.transaction_index,
            from_address=tx.from_address,
            to_address=tx.to_address,
            value=tx.value,
            gas=tx.gas,
            gas_price=tx.gas_price,
            max_fee_per_gas=tx.max_fee_per_gas,
            max_priority_fee_per_gas=tx.max_priority_fee_per_gas,
            nonce=tx.nonce,
            type=tx.type,
            status=status
        )
        for tx, timestamp, status in results
    ]


@router.get("/{tx_hash}")
def get_transaction(
    tx_hash: str,
    include_receipt: bool = Query(False, description="Include transaction receipt"),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific transaction
    Optionally include the transaction receipt
    """
    from src.database.models import Block

    tx = db.query(Transaction).filter(Transaction.hash == tx_hash).first()

    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {tx_hash} not found")

    # Get block timestamp
    block = db.query(Block).filter(Block.number == tx.block_number).first()

    tx_data = {
        "hash": tx.hash,
        "block_number": tx.block_number,
        "block_hash": tx.block_hash,
        "timestamp": block.timestamp if block else None,
        "transaction_index": tx.transaction_index,
        "from_address": tx.from_address,
        "to_address": tx.to_address,
        "value": tx.value,
        "gas": tx.gas,
        "gas_price": tx.gas_price,
        "max_fee_per_gas": tx.max_fee_per_gas,
        "max_priority_fee_per_gas": tx.max_priority_fee_per_gas,
        "nonce": tx.nonce,
        "type": tx.type,
        "input_data": tx.input_data
    }

    if include_receipt:
        receipt = db.query(TransactionReceipt).filter(
            TransactionReceipt.transaction_hash == tx_hash
        ).first()

        if receipt:
            tx_data["receipt"] = ReceiptResponse(
                transaction_hash=receipt.transaction_hash,
                block_number=receipt.block_number,
                block_hash=receipt.block_hash,
                from_address=receipt.from_address,
                to_address=receipt.to_address,
                contract_address=receipt.contract_address,
                gas_used=receipt.gas_used,
                cumulative_gas_used=receipt.cumulative_gas_used,
                effective_gas_price=receipt.effective_gas_price,
                status=receipt.status,
                type=receipt.type
            )
        else:
            tx_data["receipt"] = None

        return TransactionWithReceiptResponse(**tx_data)
    else:
        return TransactionResponse(**tx_data)


@router.get("/{tx_hash}/receipt", response_model=ReceiptResponse)
def get_transaction_receipt(
    tx_hash: str,
    db: Session = Depends(get_db)
):
    """
    Get transaction receipt
    """
    receipt = db.query(TransactionReceipt).filter(
        TransactionReceipt.transaction_hash == tx_hash
    ).first()

    if not receipt:
        raise HTTPException(status_code=404, detail=f"Receipt for transaction {tx_hash} not found")

    return ReceiptResponse(
        transaction_hash=receipt.transaction_hash,
        block_number=receipt.block_number,
        block_hash=receipt.block_hash,
        from_address=receipt.from_address,
        to_address=receipt.to_address,
        contract_address=receipt.contract_address,
        gas_used=receipt.gas_used,
        cumulative_gas_used=receipt.cumulative_gas_used,
        effective_gas_price=receipt.effective_gas_price,
        status=receipt.status,
        type=receipt.type
    )


@router.get("/{tx_hash}/logs", response_model=List[LogResponse])
def get_transaction_logs(
    tx_hash: str,
    db: Session = Depends(get_db)
):
    """
    Get all logs from a transaction
    """
    logs = db.query(Log).filter(
        Log.transaction_hash == tx_hash
    ).order_by(Log.log_index).all()

    if not logs:
        # Check if transaction exists
        tx = db.query(Transaction).filter(Transaction.hash == tx_hash).first()
        if not tx:
            raise HTTPException(status_code=404, detail=f"Transaction {tx_hash} not found")
        # Transaction exists but has no logs
        return []

    return [
        LogResponse(
            log_index=log.log_index,
            transaction_hash=log.transaction_hash,
            block_number=log.block_number,
            address=log.address,
            data=log.data,
            topic0=log.topic0,
            topic1=log.topic1,
            topic2=log.topic2,
            topic3=log.topic3
        )
        for log in logs
    ]
