import SearchBox from '../common/SearchBox';
import BlockDisplay from '../common/BlockDisplay';
import TransactionDisplay from '../common/TransactionDisplay';
import TransactionReceiptDisplay from '../common/TransactionReceiptDisplay';
import AddressDisplay from '../common/AddressDisplay';
import { Block, Transaction, TransactionReceipt, Address } from '../../types';

const mockBlock: Block = {
  number: '12345678',
  hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  timestamp: (Date.now() / 1000).toString(),
  miner: '0xMinerAddress1234567890abcdef1234567890',
  transactions: Array(150).fill({}),
  gasUsed: '15000000',
  gasLimit: '30000000',
  size: '45000',
  difficulty: '0',
  extraData: '0x',
  logsBloom: '0x',
  mixHash: '0x',
  nonce: '0x',
  parentHash: '0x',
  receiptsRoot: '0x',
  sha3Uncles: '0x',
  stateRoot: '0x',
  totalDifficulty: '0',
  transactionsRoot: '0x',
  uncles: []
};

const mockTransaction: Transaction = {
  hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: '12345678',
  from: '0xSenderAddress1234567890abcdef123456',
  to: '0xReceiverAddress1234567890abcdef1234',
  value: '1500000000000000000', // 1.5 ETH
  gas: '21000',
  gasPrice: '50000000000', // 50 Gwei
  data: '0x',
  nonce: '42',
  transactionIndex: '5',
  type: '2',
  v: '0x1',
  r: '0x123',
  s: '0x456'
};

const mockReceipt: TransactionReceipt = {
  transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: '12345678',
  from: '0xSenderAddress1234567890abcdef123456',
  to: '0xReceiverAddress1234567890abcdef1234',
  gasUsed: '21000',
  cumulativeGasUsed: '150000',
  effectiveGasPrice: '50000000000',
  status: '1',
  contractAddress: null,
  logs: [],
  logsBloom: '0x',
  transactionIndex: '5',
  type: '2'
};

const mockAddress: Address = {
  address: '0xUserAddress1234567890abcdef1234567890ab',
  balance: '5250000000000000000', // 5.25 ETH
  code: '0x',
  txCount: '127',
  storeageAt: {
    '0x0': '0x000000000000000000000000000000000000000000000000000000000000007b',
    '0x1': '0x0000000000000000000000001234567890abcdef1234567890abcdef12345678',
    '0x2': '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
  },
  address: ''
};

const mockAddressHash = '0xUserAddress1234567890abcdef1234567890ab';

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">OPENSCAN</h1>
        <SearchBox />

        <div style={{ marginTop: '40px' }}>
          <h3 style={{ color: '#6b7280', marginBottom: '20px' }}>Component Previews</h3>

          <div className="components-grid">
            <BlockDisplay block={mockBlock} />
            <TransactionDisplay transaction={mockTransaction} />
            <TransactionReceiptDisplay receipt={mockReceipt} />
            <AddressDisplay address={mockAddress} addressHash={mockAddressHash} />
          </div>
        </div>
      </div>
    </div>
  );
};