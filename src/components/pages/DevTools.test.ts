import { describe, it, expect } from 'vitest';
import {
	convertEthUnits,
	parseInputValue,
	computeKeccak,
	stringToHex,
	hexToString,
	isValidAddress,
	isValidHex,
} from '../../utils/devtools';

describe('DevTools Utils', () => {
	describe('convertEthUnits', () => {
		it('should convert 1 ETH to all units', () => {
			const result = convertEthUnits('1', 'eth');
			expect(result).not.toBeNull();
			expect(result!.eth).toBe('1');
			expect(result!.gwei).toBe('1000000000');
			expect(result!.wei).toBe('1000000000000000000');
		});

		it('should convert 1 gwei to all units', () => {
			const result = convertEthUnits('1', 'gwei');
			expect(result).not.toBeNull();
			expect(result!.gwei).toBe('1');
			expect(result!.wei).toBe('1000000000');
			expect(result!.eth).toBe('0.000000001');
		});

		it('should return null for invalid input', () => {
			const result = convertEthUnits('invalid', 'eth');
			expect(result).toBeNull();
		});
	});

	describe('parseInputValue', () => {
		it('should parse string type', () => {
			expect(parseInputValue('hello', 'string')).toBe('hello');
		});

		it('should parse uint256 as bigint', () => {
			const result = parseInputValue('12345', 'uint256');
			expect(result).toBe(BigInt(12345));
		});

		it('should parse bool true', () => {
			expect(parseInputValue('true', 'bool')).toBe(true);
			expect(parseInputValue('1', 'bool')).toBe(true);
		});

		it('should parse bool false', () => {
			expect(parseInputValue('false', 'bool')).toBe(false);
			expect(parseInputValue('0', 'bool')).toBe(false);
		});

		it('should add 0x prefix to address without it', () => {
			const result = parseInputValue('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'address');
			expect(result).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
		});

		it('should keep 0x prefix for address that has it', () => {
			const result = parseInputValue('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'address');
			expect(result).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
		});

		it('should throw for invalid address', () => {
			expect(() => parseInputValue('invalid', 'address')).toThrow('Invalid address format');
		});
	});

	describe('computeKeccak', () => {
		it('should compute keccak256 for string input', () => {
			const result = computeKeccak('hello', 'string');
			expect(result.rawHash).toBeDefined();
			expect(result.rawHash).toMatch(/^0x[a-f0-9]{64}$/i);
		});

		it('should return empty object for empty input', () => {
			const result = computeKeccak('', 'string');
			expect(result).toEqual({});
		});

		it('should detect function signature pattern', () => {
			const result = computeKeccak('transfer(address,uint256)', 'string');
			expect(result.isFunctionSignature).toBe(true);
			expect(result.functionSelector).toBeDefined();
			expect(result.functionSelector).toMatch(/^0x[a-f0-9]{8}$/i);
		});

		it('should not detect function signature for regular string', () => {
			const result = computeKeccak('hello world', 'string');
			expect(result.isFunctionSignature).toBe(false);
			expect(result.functionSelector).toBeNull();
		});

		it('should compute correct transfer function selector', () => {
			// transfer(address,uint256) = 0xa9059cbb
			const result = computeKeccak('transfer(address,uint256)', 'string');
			expect(result.functionSelector).toBe('0xa9059cbb');
		});
	});

	describe('stringToHex', () => {
		it('should convert string to hex', () => {
			expect(stringToHex('hello')).toBe('0x68656c6c6f');
		});

		it('should return hex unchanged if already hex', () => {
			expect(stringToHex('0xabcdef')).toBe('0xabcdef');
		});
	});

	describe('hexToString', () => {
		it('should convert hex to string', () => {
			expect(hexToString('0x68656c6c6f')).toBe('hello');
		});

		it('should throw for invalid hex format', () => {
			expect(() => hexToString('invalid')).toThrow('Invalid hex format');
		});
	});

	describe('isValidAddress', () => {
		it('should return true for valid address', () => {
			expect(isValidAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true);
		});

		it('should return false for address without 0x', () => {
			expect(isValidAddress('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(false);
		});

		it('should return false for too short address', () => {
			expect(isValidAddress('0xd8dA6BF')).toBe(false);
		});

		it('should return false for invalid characters', () => {
			expect(isValidAddress('0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBe(false);
		});
	});

	describe('isValidHex', () => {
		it('should return true for valid hex', () => {
			expect(isValidHex('0xabcdef123')).toBe(true);
		});

		it('should return true for empty hex', () => {
			expect(isValidHex('0x')).toBe(true);
		});

		it('should return false for hex without 0x', () => {
			expect(isValidHex('abcdef')).toBe(false);
		});

		it('should return false for invalid characters', () => {
			expect(isValidHex('0xghijkl')).toBe(false);
		});
	});
});
