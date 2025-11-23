from sqlalchemy import Column, String, Integer, BigInteger, Text, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from src.database.connection import Base


class Block(Base):
    """Block model - stores complete block information"""
    __tablename__ = "blocks"

    # Primary key
    number = Column(BigInteger, primary_key=True, index=True)

    # Block identifiers
    hash = Column(String(66), unique=True, nullable=False, index=True)
    parent_hash = Column(String(66), nullable=False)

    # Block metadata
    timestamp = Column(BigInteger, nullable=False, index=True)
    miner = Column(String(42), nullable=False, index=True)
    difficulty = Column(String(78), nullable=False)
    total_difficulty = Column(String(78), nullable=False)
    size = Column(BigInteger, nullable=False)
    nonce = Column(String(18), nullable=False)

    # Gas information
    gas_limit = Column(BigInteger, nullable=False)
    gas_used = Column(BigInteger, nullable=False)
    base_fee_per_gas = Column(String(78), nullable=True)

    # State roots
    state_root = Column(String(66), nullable=False)
    transactions_root = Column(String(66), nullable=False)
    receipts_root = Column(String(66), nullable=False)

    # Additional data
    extra_data = Column(Text, nullable=True)
    logs_bloom = Column(Text, nullable=False)
    sha3_uncles = Column(String(66), nullable=False)
    mix_hash = Column(String(66), nullable=True)

    # Network
    chain_id = Column(Integer, nullable=False, index=True)

    # Relationships
    transactions = relationship("Transaction", back_populates="block", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Block {self.number} - {self.hash[:10]}...>"


class Transaction(Base):
    """Transaction model - stores complete transaction information"""
    __tablename__ = "transactions"

    # Primary key
    hash = Column(String(66), primary_key=True, index=True)

    # Block reference
    block_number = Column(BigInteger, ForeignKey("blocks.number"), nullable=False, index=True)
    block_hash = Column(String(66), nullable=False)
    transaction_index = Column(Integer, nullable=False)

    # Transaction parties
    from_address = Column(String(42), nullable=False, index=True)
    to_address = Column(String(42), nullable=True, index=True)

    # Value and data
    value = Column(String(78), nullable=False)
    input_data = Column(Text, nullable=False)
    nonce = Column(BigInteger, nullable=False)

    # Gas information
    gas = Column(BigInteger, nullable=False)
    gas_price = Column(String(78), nullable=True)
    max_fee_per_gas = Column(String(78), nullable=True)
    max_priority_fee_per_gas = Column(String(78), nullable=True)

    # Transaction type and signature
    type = Column(Integer, nullable=False)
    chain_id = Column(Integer, nullable=True)
    v = Column(String(10), nullable=False)
    r = Column(String(66), nullable=False)
    s = Column(String(66), nullable=False)

    # Relationships
    block = relationship("Block", back_populates="transactions")
    receipt = relationship("TransactionReceipt", back_populates="transaction", uselist=False, cascade="all, delete-orphan")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_from_block', 'from_address', 'block_number'),
        Index('idx_to_block', 'to_address', 'block_number'),
    )

    def __repr__(self):
        return f"<Transaction {self.hash[:10]}... from {self.from_address[:8]}...>"


class TransactionReceipt(Base):
    """Transaction receipt model - stores transaction execution results"""
    __tablename__ = "transaction_receipts"

    # Primary key (same as transaction hash)
    transaction_hash = Column(String(66), ForeignKey("transactions.hash"), primary_key=True, index=True)

    # Block reference
    block_number = Column(BigInteger, nullable=False, index=True)
    block_hash = Column(String(66), nullable=False)
    transaction_index = Column(Integer, nullable=False)

    # Receipt data
    from_address = Column(String(42), nullable=False)
    to_address = Column(String(42), nullable=True)
    contract_address = Column(String(42), nullable=True, index=True)

    # Gas usage
    cumulative_gas_used = Column(BigInteger, nullable=False)
    gas_used = Column(BigInteger, nullable=False)
    effective_gas_price = Column(String(78), nullable=False)

    # Status
    status = Column(Integer, nullable=False, index=True)
    type = Column(Integer, nullable=False)

    # Bloom filter
    logs_bloom = Column(Text, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="receipt")
    logs = relationship("Log", back_populates="receipt", cascade="all, delete-orphan")

    def __repr__(self):
        status_text = "success" if self.status == 1 else "failed"
        return f"<Receipt {self.transaction_hash[:10]}... - {status_text}>"


class Log(Base):
    """Log model - stores event logs from smart contracts"""
    __tablename__ = "logs"

    # Composite primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_hash = Column(String(66), ForeignKey("transaction_receipts.transaction_hash"), nullable=False, index=True)
    log_index = Column(Integer, nullable=False)

    # Block reference
    block_number = Column(BigInteger, nullable=False, index=True)
    block_hash = Column(String(66), nullable=False)
    transaction_index = Column(Integer, nullable=False)

    # Log data
    address = Column(String(42), nullable=False, index=True)
    data = Column(Text, nullable=False)

    # Topics (indexed event parameters)
    topic0 = Column(String(66), nullable=True, index=True)
    topic1 = Column(String(66), nullable=True, index=True)
    topic2 = Column(String(66), nullable=True, index=True)
    topic3 = Column(String(66), nullable=True, index=True)

    # Removed flag
    removed = Column(Boolean, default=False, nullable=False)

    # Relationships
    receipt = relationship("TransactionReceipt", back_populates="logs")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_address_block', 'address', 'block_number'),
        Index('idx_topic0_address', 'topic0', 'address'),
        Index('idx_tx_log', 'transaction_hash', 'log_index'),
    )

    def __repr__(self):
        return f"<Log {self.log_index} - {self.address[:8]}... in tx {self.transaction_hash[:10]}...>"


class NetworkStats(Base):
    """Network statistics - stores current network state"""
    __tablename__ = "network_stats"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    chain_id = Column(Integer, nullable=False, unique=True, index=True)

    # Stats
    current_block_number = Column(BigInteger, nullable=False)
    current_gas_price = Column(String(78), nullable=False)
    is_syncing = Column(Boolean, nullable=False)

    # Last update timestamp
    last_updated = Column(BigInteger, nullable=False)

    def __repr__(self):
        return f"<NetworkStats chain={self.chain_id} block={self.current_block_number}>"
