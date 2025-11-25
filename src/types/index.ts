import { ethers } from "ethers";
import React from "react";

// ==================== CORE DOMAIN TYPES ====================

export interface NetworkStats {
	currentGasPrice: string;
	isSyncing: boolean;
	currentBlockNumber: string;
	metadata: any;
}

export interface Block {
	difficulty: string;
	extraData: string;
	gasLimit: string;
	gasUsed: string;
	hash: string;
	logsBloom: string;
	miner: string;
	mixHash: string;
	nonce: string;
	number: string;
	parentHash: string;
	receiptsRoot: string;
	sha3Uncles: string;
	size: string;
	stateRoot: string;
	timestamp: string;
	baseFeePerGas?: string;
	totalDifficulty: string;
	transactions: string[];
	transactionsRoot: string;
	uncles: any[];
	blobGasUsed: string;
	excessBlobGas: string;
	withdrawalsRoot: string;
	withdrawals: Array<{
		address: string;
		amount: string;
		index: string;
		validatorIndex: string;
	}>;
}

export interface BlockArbitrum extends Block {
	l1BlockNumber: string;
	sendCount: string;
	sendRoot: string;
}

export interface Transaction {
	blockHash: string;
	blockNumber: string;
	from: string;
	gas: string;
	gasPrice: string;
	maxFeePerGas?: string;
	maxPriorityFeePerGas?: string;
	hash: string;
	nonce: string;
	to: string;
	data: string;
	transactionIndex: string;
	value: string;
	type: string;
	v: string;
	r: string;
	s: string;
	timestamp?: string;
	blockBaseFeePerGas?: string;
	receipt?: TransactionReceipt;
}

export interface TransactionArbitrum extends Transaction {
	requestId: string;
}

export interface TransactionReceipt {
	blockHash: string;
	blockNumber: string;
	contractAddress: any;
	cumulativeGasUsed: string;
	effectiveGasPrice: string;
	from: string;
	gasUsed: string;
	logs: any[];
	logsBloom: string;
	status: string;
	to: string;
	transactionHash: string;
	transactionIndex: string;
	type: string;
}

export interface TransactionReceiptArbitrum extends TransactionReceipt {
	l1BlockNumber: string;
	gasUsedForL1: string;
}

// Optimism types - blocks are same as Ethereum
export interface TransactionReceiptOptimism extends TransactionReceipt {
	l1Fee: string;
	l1GasPrice: string;
	l1GasUsed: string;
	l1FeeScalar: string;
}

export interface Address {
	address: string;
	balance: string;
	code: string;
	txCount: string;
	storeageAt: StoreageAt;
	recentTransactions?: Transaction[];
}

export type StoreageAt = Record<string, string>;

export interface MempoolTransaction {
	from: string;
	gas: string;
	gasPrice: string;
	hash: string;
	input: string;
	nonce: string;
	to: string;
	value: string;
	type: string;
	v: string;
	r: string;
	s: string;
}

// ==================== CONTEXT TYPES ====================

/**
 * Notification interface
 */
export interface Notification {
	id: string;
	message: string;
	type: "success" | "warning" | "error";
	duration?: number; // Auto-dismiss after this many milliseconds (optional)
}

/**
 * Notification context type
 */
export interface NotificationContextType {
	notifications: Notification[];
	addNotification: (
		message: string,
		type: Notification["type"],
		duration?: number,
	) => void;
	removeNotification: (id: string) => void;
	clearAllNotifications: () => void;
}

/**
 * Notification provider props
 */
export interface NotificationProviderProps {
	children: React.ReactNode;
}

/**
 * Theme context type
 */
export interface ThemeContextType {
	isDarkMode: boolean;
	toggleTheme: () => void;
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
	children: React.ReactNode;
}

/**
 * App context interface
 */
export interface IAppContext {
	appReady: boolean;
	resourcesLoaded: boolean;
	isHydrated: boolean;
	rpcUrls: RpcUrlsContextType;
	setRpcUrls: (rpcUrls: RpcUrlsContextType) => void;
	jsonFiles: Record<string, any>;
	setJsonFiles: (jsonFiles: Record<string, any>) => void;
}

/**
 * RPC URLs context type
 */

export type RPCUrls = string[];

export type supportedChainsIds =
	| 1 // mainnet
	| 11155111 // sepolia testnet
	| 31337 // local node (hardhat, anvil, aztec)
	| 677868 // aztec sandobx
	| 42161 // arbitrum one
	| 10 // optimism mainnet
	| 8453; // base mainnet

export type RpcUrlsContextType = Record<supportedChainsIds, RPCUrls>;

// ==================== SETTINGS TYPES ====================

/**
 * User settings for the application
 */
export interface UserSettings {
	theme?: "light" | "dark" | "auto";
	showBackgroundBlocks?: boolean;
}

/**
 * Default user settings
 */
export const DEFAULT_SETTINGS: UserSettings = {
	theme: "auto",
	showBackgroundBlocks: true,
};

// src/services/rpc/types.ts
export interface RPCBlock {
	number: string; // hex
	hash: string;
	parentHash: string;
	nonce: string;
	sha3Uncles: string;
	logsBloom: string;
	transactionsRoot: string;
	stateRoot: string;
	receiptsRoot: string;
	miner: string;
	difficulty: string; // hex
	totalDifficulty: string; // hex
	extraData: string;
	size: string; // hex
	gasLimit: string; // hex
	gasUsed: string; // hex
	timestamp: string; // hex
	transactions: string[] | RPCTransaction[]; // either hashes or full transactions
	uncles: string[];
	baseFeePerGas?: string; // hex
	mixHash: string;
	blobGasUsed: string;
	excessBlobGas: string;
	withdrawalsRoot: string;
	withdrawals: Array<{
		address: string;
		amount: string;
		index: string;
		validatorIndex: string;
	}>;
}

export interface RPCTransaction {
	blockHash: string;
	blockNumber: string; // hex
	from: string;
	gas: string; // hex
	gasPrice: string; // hex
	maxFeePerGas?: string; // hex
	maxPriorityFeePerGas?: string; // hex
	hash: string;
	input: string;
	nonce: string; // hex
	to: string;
	transactionIndex: string; // hex
	value: string; // hex
	type: string; // hex
	chainId: string; // hex
	v: string; // hex
	r: string;
	s: string;
}

export interface RPCTransactionReceipt {
	transactionHash: string;
	transactionIndex: string; // hex
	blockHash: string;
	blockNumber: string; // hex
	from: string;
	to: string;
	cumulativeGasUsed: string; // hex
	gasUsed: string; // hex
	contractAddress: string;
	logs: RPCLog[];
	logsBloom: string;
	status: string; // hex - "0x1" for success, "0x0" for failure
	effectiveGasPrice: string; // hex
	type: string; // hex
}

export interface RPCLog {
	address: string;
	topics: string[];
	data: string;
	blockNumber: string; // hex
	transactionHash: string;
	transactionIndex: string; // hex
	blockHash: string;
	logIndex: string; // hex
	removed: boolean;
}

// ==================== Artifacts TYPES ====================

export type ABI =
	| FunctionABI
	| ConstructorABI
	| FallbackABI
	| ReceiveABI
	| EventABI
	| ErrorABI;

export interface ABIParameter {
	name: string;
	type: string;
	indexed?: boolean; // Only used for events
	components?: ABIParameter[]; // For tuples / structs
}

export interface EventParameter extends ABIParameter {
	indexed: boolean;
}

export interface BaseABI {
	type: string;
}

export interface FunctionABI extends BaseABI {
	type: "function";
	name: string;
	inputs: ABIParameter[];
	outputs: ABIParameter[];
	stateMutability: "pure" | "view" | "nonpayable" | "payable";
}

export interface ConstructorABI extends BaseABI {
	type: "constructor";
	inputs: ABIParameter[];
	stateMutability: "nonpayable" | "payable";
}

export interface FallbackABI extends BaseABI {
	type: "fallback";
	stateMutability: "nonpayable" | "payable";
}

export interface ReceiveABI extends BaseABI {
	type: "receive";
	stateMutability: "payable";
}

export interface EventABI extends BaseABI {
	type: "event";
	name: string;
	inputs: EventParameter[];
	anonymous: boolean;
}

export interface ErrorABI extends BaseABI {
	type: "error";
	name: string;
	inputs: ABIParameter[];
}

// ==================== ADDRESS TRANSACTION TYPES ====================

/**
 * Result from trace_filter RPC call
 */
export interface TraceFilterResult {
	action: {
		callType?: string;
		from: string;
		to?: string;
		gas: string;
		input?: string;
		value: string;
		init?: string; // For contract creation
	};
	blockHash: string;
	blockNumber: number;
	result?: {
		gasUsed: string;
		output?: string;
		address?: string; // Created contract address
	};
	subtraces: number;
	traceAddress: number[];
	transactionHash: string;
	transactionPosition: number;
	type: "call" | "create" | "suicide" | "reward";
	error?: string;
}

/**
 * Result from eth_getLogs RPC call
 */
export interface LogEntry {
	address: string;
	topics: string[];
	data: string;
	blockNumber: string;
	transactionHash: string;
	transactionIndex: string;
	blockHash: string;
	logIndex: string;
	removed: boolean;
}

/**
 * Address transactions result with metadata about data source
 */
export interface AddressTransactionsResult {
	transactions: string[]; // Transaction hashes
	source: "trace_filter" | "logs" | "none";
	isComplete: boolean; // true if we have full history (trace_filter)
	message?: string; // Optional message about limitations
}
